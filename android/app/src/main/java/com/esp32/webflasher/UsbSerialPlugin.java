package com.esp32.webflasher;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbManager;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.hoho.android.usbserial.driver.UsbSerialDriver;
import com.hoho.android.usbserial.driver.UsbSerialPort;
import com.hoho.android.usbserial.driver.UsbSerialProber;
import com.hoho.android.usbserial.util.SerialInputOutputManager;

import java.util.List;

/**
 * Bridges the web app (running inside Capacitor's WebView, which has no
 * Web Serial / WebUSB support) to a real USB-serial connection using
 * usb-serial-for-android. This is what lets "Connect"/"Erase"/"Flash" talk to
 * actual ESP32 hardware over an OTG cable from the installed APK, instead of
 * only ever running in Simulated Mode.
 */
@CapacitorPlugin(name = "UsbSerial")
public class UsbSerialPlugin extends Plugin implements SerialInputOutputManager.Listener {

    private static final String TAG = "UsbSerialPlugin";
    private static final String ACTION_USB_PERMISSION = "com.esp32.webflasher.USB_PERMISSION";

    private UsbManager usbManager;
    private UsbSerialPort serialPort;
    private UsbDeviceConnection connection;
    private SerialInputOutputManager ioManager;

    private PluginCall pendingPermissionCall;

    private final BroadcastReceiver usbPermissionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (!ACTION_USB_PERMISSION.equals(intent.getAction())) {
                return;
            }
            synchronized (this) {
                boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                if (pendingPermissionCall != null) {
                    JSObject ret = new JSObject();
                    ret.put("granted", granted);
                    pendingPermissionCall.resolve(ret);
                    pendingPermissionCall = null;
                }
            }
        }
    };

    @Override
    public void load() {
        usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(usbPermissionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(usbPermissionReceiver, filter);
        }
    }

    /** Returns whether a supported USB-serial device is currently attached. */
    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", findDriver() != null);
        call.resolve(ret);
    }

    /** Lists attached USB devices recognized as serial adapters (CP210x/CH34x/FTDI/PL2303/CDC). */
    @PluginMethod
    public void listDevices(PluginCall call) {
        JSArray devices = new JSArray();
        List<UsbSerialDriver> drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
        for (UsbSerialDriver driver : drivers) {
            UsbDevice device = driver.getDevice();
            JSObject obj = new JSObject();
            obj.put("vendorId", device.getVendorId());
            obj.put("productId", device.getProductId());
            obj.put("deviceName", device.getDeviceName());
            devices.put(obj);
        }
        JSObject ret = new JSObject();
        ret.put("devices", devices);
        call.resolve(ret);
    }

    /** Requests Android's runtime USB permission dialog for the first supported device. */
    @PluginMethod
    public void requestPermission(PluginCall call) {
        UsbSerialDriver driver = findDriver();
        if (driver == null) {
            call.reject("No supported USB-serial device found. Check the OTG cable and that the board is plugged in.");
            return;
        }
        UsbDevice device = driver.getDevice();
        if (usbManager.hasPermission(device)) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        pendingPermissionCall = call;
        int flags = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S
                ? PendingIntent.FLAG_MUTABLE
                : 0;
        PendingIntent permissionIntent = PendingIntent.getBroadcast(
                getContext(), 0, new Intent(ACTION_USB_PERMISSION), flags);
        usbManager.requestPermission(device, permissionIntent);
        // resolved later by usbPermissionReceiver
    }

    /** Opens the serial connection at the given baud rate (8N1, matching esptool's expectations). */
    @PluginMethod
    public void open(PluginCall call) {
        int baudRate = call.getInt("baudRate", 115200);
        UsbSerialDriver driver = findDriver();
        if (driver == null) {
            call.reject("No supported USB-serial device found.");
            return;
        }
        UsbDevice device = driver.getDevice();
        if (!usbManager.hasPermission(device)) {
            call.reject("USB permission not granted yet. Call requestPermission() first.");
            return;
        }
        try {
            connection = usbManager.openDevice(device);
            if (connection == null) {
                call.reject("Failed to open USB device connection.");
                return;
            }
            serialPort = driver.getPorts().get(0);
            serialPort.open(connection);
            serialPort.setParameters(baudRate, UsbSerialPort.DATABITS_8,
                    UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);

            ioManager = new SerialInputOutputManager(serialPort, this);
            ioManager.setReadTimeout(200);
            // BUGFIX (from real CI build log): SerialInputOutputManager in this
            // library version does not implement Runnable — it manages its own
            // background thread via start()/stop(), matching the stop() call we
            // already use in close(). Scheduling it via ExecutorService.submit()
            // fails to compile ("cannot be converted to Runnable").
            ioManager.start();

            JSObject ret = new JSObject();
            ret.put("vendorId", device.getVendorId());
            ret.put("productId", device.getProductId());
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "open() failed", e);
            call.reject("Failed to open serial port: " + e.getMessage());
        }
    }

    /** Writes base64-encoded bytes to the serial port. */
    @PluginMethod
    public void write(PluginCall call) {
        String base64 = call.getString("data");
        if (base64 == null || serialPort == null) {
            call.reject("Port not open or no data provided.");
            return;
        }
        try {
            byte[] bytes = Base64.decode(base64, Base64.NO_WRAP);
            serialPort.write(bytes, 5000);
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "write() failed", e);
            call.reject("Write failed: " + e.getMessage());
        }
    }

    /** Sets the DTR/RTS signal lines — used by esptool's reset-into-bootloader sequence. */
    @PluginMethod
    public void setSignals(PluginCall call) {
        if (serialPort == null) {
            call.reject("Port not open.");
            return;
        }
        try {
            Boolean dtr = call.getBoolean("dtr");
            Boolean rts = call.getBoolean("rts");
            if (dtr != null) serialPort.setDTR(dtr);
            if (rts != null) serialPort.setRTS(rts);
            call.resolve();
        } catch (Exception e) {
            call.reject("setSignals failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void close(PluginCall call) {
        try {
            if (ioManager != null) {
                ioManager.stop();
                ioManager = null;
            }
            if (serialPort != null) {
                serialPort.close();
                serialPort = null;
            }
            if (connection != null) {
                connection.close();
                connection = null;
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("close failed: " + e.getMessage());
        }
    }

    private UsbSerialDriver findDriver() {
        // Default prober already covers CP210x, CH34x, FTDI, PL2303 and CDC-ACM
        // (the chips found on essentially every common ESP32 dev board).
        List<UsbSerialDriver> drivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager);
        return drivers.isEmpty() ? null : drivers.get(0);
    }

    @Override
    public void onNewData(byte[] data) {
        JSObject ret = new JSObject();
        ret.put("data", Base64.encodeToString(data, Base64.NO_WRAP));
        notifyListeners("dataReceived", ret);
    }

    @Override
    public void onRunError(Exception e) {
        Log.e(TAG, "IO error", e);
        JSObject ret = new JSObject();
        ret.put("message", e.getMessage() == null ? "Unknown serial IO error" : e.getMessage());
        notifyListeners("serialError", ret);
    }

    @Override
    protected void handleOnDestroy() {
        try {
            getContext().unregisterReceiver(usbPermissionReceiver);
        } catch (Exception ignored) {
            // already unregistered
        }
        super.handleOnDestroy();
    }
}
