import { BinSlot, FlashSettings, ConnectedDeviceInfo } from '../types';
import { NativeSerialPort, isNativeUsbSerialPlatform, isNativeUsbSerialAvailable } from './nativeSerialPort';

export type LogCallback = (message: string, type?: 'info' | 'success' | 'warning' | 'error' | 'output') => void;
export type ProgressCallback = (progress: {
  stage: 'idle' | 'connecting' | 'erasing' | 'flashing' | 'verifying' | 'completed' | 'failed';
  currentSlotIndex: number;
  totalSlots: number;
  currentFileName: string;
  currentPercentage: number;
  totalPercentage: number;
  statusMessage: string;
}) => void;

// NOTE: There is intentionally no simulated/demo mode anywhere in this file.
// connect()/eraseFlash()/flashFiles() either talk to real ESP32 hardware or
// throw a real error. A previous version had a `simulateFallback` flag that
// silently faked success when real hardware wasn't found -- that caused the
// app to report "connected"/"erased"/"flashed" with nothing actually
// happening on a real chip. That flag and every fallback branch tied to it
// has been removed, not just turned off, so it can't be re-triggered by
// accident from a caller.

export class EspFlasherService {
  private port: any = null;
  private esploader: any = null;
  private transport: any = null;
  private isConnected: boolean = false;
  private deviceInfo: ConnectedDeviceInfo = { connected: false };

  public isWebSerialSupported(): boolean {
    return 'serial' in navigator || 'usb' in navigator || isNativeUsbSerialPlatform();
  }

  public getDeviceInfo(): ConnectedDeviceInfo {
    return this.deviceInfo;
  }

  public async connect(baudRate: number, onLog: LogCallback): Promise<ConnectedDeviceInfo> {
    onLog('Checking serial / USB OTG availability...', 'info');

    const nativeAndroidApp = isNativeUsbSerialPlatform();
    const hasWebSerial = 'serial' in navigator;

    if (!hasWebSerial && !nativeAndroidApp) {
      throw new Error('Web Serial API is not supported in this browser. Use desktop Chrome/Edge, or the Android app.');
    }

    if (nativeAndroidApp) {
      // Real hardware path for the installed Android APK, via the native
      // UsbSerialPlugin (usb-serial-for-android) instead of navigator.serial,
      // which Capacitor's WebView does not implement.
      onLog('Checking for a connected USB-serial device (OTG)...', 'info');
      const available = await isNativeUsbSerialAvailable();
      if (!available) {
        throw new Error(
          'No supported USB-serial device detected. Check the OTG adapter, that the cable carries data (not power-only), and that the board is plugged in.'
        );
      }
      onLog('USB-serial device found. Requesting Android USB permission...', 'info');
      this.port = new NativeSerialPort();
    } else {
      onLog('Requesting Serial Port (USB / OTG)...', 'info');
      // @ts-ignore
      this.port = await navigator.serial.requestPort({});
    }
    onLog('Port selected. Initializing connection at ' + baudRate + ' baud...', 'info');

    try {
      const esptool = await import('esptool-js');
      const TransportClass = esptool.Transport;
      const ESPLoaderClass = esptool.ESPLoader;

      this.transport = new TransportClass(this.port);

      const customTerminal = {
        clean: () => {},
        writeLine: (data: string) => onLog(data, 'output'),
        write: (data: string) => onLog(data, 'output'),
      };

      const loaderOptions = {
        transport: this.transport,
        baudrate: baudRate,
        terminal: customTerminal,
        romBaudrate: 115200,
      };

      this.esploader = new ESPLoaderClass(loaderOptions);
      onLog('Connecting to ESP32 ROM bootloader...', 'info');

      const chip = await this.esploader.main();
      onLog(`Chip detected: ${chip || 'ESP32 Device'}`, 'success');

      const mac = this.esploader.mac ? this.esploader.mac() : 'Unknown';
      onLog(`MAC Address: ${mac}`, 'info');

      this.isConnected = true;
      this.deviceInfo = {
        connected: true,
        chipName: chip || 'ESP32',
        macAddress: mac,
        portName: nativeAndroidApp ? 'USB / OTG Serial (native)' : 'USB / OTG Serial',
        isSimulated: false,
      };

      return this.deviceInfo;
    } catch (innerErr: any) {
      onLog(`esptool-js failed to sync with the chip: ${innerErr.message || innerErr}`, 'error');
      try {
        await this.port?.close();
      } catch {
        // ignore
      }
      this.port = null;
      this.esploader = null;
      this.transport = null;
      throw new Error(
        `Could not sync with ESP32 bootloader (${innerErr.message || innerErr}). ` +
        `Check the board is in download mode / cable supports data, then try again.`
      );
    }
  }

  public async disconnect(onLog: LogCallback): Promise<void> {
    if (this.esploader) {
      try {
        await this.esploader.hardReset();
      } catch {
        // ignore
      }
      this.esploader = null;
    }

    if (this.transport) {
      try {
        await this.transport.disconnect();
      } catch {
        // ignore
      }
      this.transport = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // ignore
      }
      this.port = null;
    }

    this.isConnected = false;
    this.deviceInfo = { connected: false };
    onLog('Device disconnected successfully.', 'info');
  }

  public async eraseFlash(
    onLog: LogCallback,
    onProgress: ProgressCallback
  ): Promise<void> {
    if (!this.isConnected || !this.esploader) {
      throw new Error('Please connect your ESP32 device first!');
    }

    onLog('================ ERASING FLASH ================', 'warning');
    onLog('Sending Erase Flash command to ESP chip...', 'info');
    onLog('Please wait, this may take 10 to 30 seconds depending on SPI Flash size...', 'info');

    onProgress({
      stage: 'erasing',
      currentSlotIndex: 0,
      totalSlots: 1,
      currentFileName: 'Entire SPI Flash Chip',
      currentPercentage: 15,
      totalPercentage: 15,
      statusMessage: 'Erasing Flash memory sectors...',
    });

    try {
      await this.esploader.eraseFlash();
    } catch (err: any) {
      onLog(`Hardware erase flash error: ${err.message}`, 'error');
      throw err;
    }

    onProgress({
      stage: 'completed',
      currentSlotIndex: 0,
      totalSlots: 1,
      currentFileName: 'SPI Flash',
      currentPercentage: 100,
      totalPercentage: 100,
      statusMessage: 'Flash chip erased successfully!',
    });

    onLog('Chip erase completed successfully! All sectors set to 0xFF.', 'success');
  }

  public async flashFiles(
    slots: BinSlot[],
    settings: FlashSettings,
    onLog: LogCallback,
    onProgress: ProgressCallback
  ): Promise<void> {
    if (!this.isConnected || !this.esploader) {
      throw new Error('Please connect your ESP32 board before flashing!');
    }

    const activeSlots = slots.filter((s) => s.enabled && (s.fileData || s.file));
    if (activeSlots.length === 0) {
      throw new Error('No .bin file selected. Please select at least one .bin file to flash.');
    }

    // Validate offsets
    for (const slot of activeSlots) {
      const offset = this.parseOffset(slot.offset);
      if (isNaN(offset)) {
        throw new Error(`Invalid offset address "${slot.offset}" in Slot #${slot.slotNumber}. Please use format like 0x1000 or 0x8000.`);
      }
    }

    onLog('================ STARTING FIRMWARE FLASH ================', 'info');
    onLog(`Target Board: ${settings.chipFamily}`, 'info');
    onLog(`Flash Config: Mode=${settings.flashMode.toUpperCase()}, Freq=${settings.flashFreq}, Size=${settings.flashSize}`, 'info');
    onLog(`Baud Rate: ${settings.baudRate}`, 'info');
    onLog(`Active Bin Slots to Flash: ${activeSlots.length}`, 'info');

    // 1. If eraseAndFlash is TRUE, perform erase first!
    if (settings.eraseAndFlash) {
      onLog('Auto Erase & Flash is active: Erasing flash sectors prior to writing...', 'warning');
      await this.eraseFlash(onLog, onProgress);
      onLog('Flash wiped clean. Proceeding to firmware upload...', 'info');
    }

    const totalBytesAll = activeSlots.reduce((acc, s) => acc + (s.fileSize || 0), 0);
    let bytesWrittenCumulative = 0;

    // 2. Flash each active slot in sequence
    for (let index = 0; index < activeSlots.length; index++) {
      const slot = activeSlots[index];
      const offsetHex = slot.offset.trim().toLowerCase().startsWith('0x')
        ? slot.offset.trim()
        : '0x' + slot.offset.trim();
      const offsetVal = this.parseOffset(slot.offset);

      onLog(`--------------------------------------------------------`, 'output');
      onLog(`[Slot #${slot.slotNumber}] Flashing file: ${slot.fileName} (${(slot.fileSize / 1024).toFixed(1)} KB) to ${offsetHex}`, 'info');

      const fileData = slot.fileData || (slot.file ? await slot.file.arrayBuffer() : null);
      if (!fileData) {
        throw new Error(`Could not read binary data for ${slot.fileName}`);
      }

      onProgress({
        stage: 'flashing',
        currentSlotIndex: index + 1,
        totalSlots: activeSlots.length,
        currentFileName: slot.fileName,
        currentPercentage: 0,
        totalPercentage: Math.round((bytesWrittenCumulative / (totalBytesAll || 1)) * 100),
        statusMessage: `Writing ${slot.fileName} to ${offsetHex}...`,
      });

      try {
        const uint8 = new Uint8Array(fileData);

        const fileObj = {
          data: uint8,
          address: offsetVal,
        };

        const flashOptions = {
          fileArray: [fileObj],
          flashMode: settings.flashMode,
          flashFreq: settings.flashFreq,
          flashSize: settings.flashSize,
          eraseAll: false,
          compress: true,
          reportProgress: (fileIndex: number, written: number, total: number) => {
            const filePercent = Math.round((written / total) * 100);
            const overallPercent = Math.round(((bytesWrittenCumulative + written) / totalBytesAll) * 100);
            onProgress({
              stage: 'flashing',
              currentSlotIndex: index + 1,
              totalSlots: activeSlots.length,
              currentFileName: slot.fileName,
              currentPercentage: filePercent,
              totalPercentage: overallPercent,
              statusMessage: `Flashing ${slot.fileName}: ${filePercent}%`,
            });
          },
        };

        // Transient USB-OTG noise causing a mid-flash checksum/SLIP error is a
        // common, well-known ESP32 flashing issue (not specific to this app) —
        // especially at high baud rates over phone OTG adapters/cables. Retry
        // the slot once before giving up; a genuine hardware/cable fault will
        // fail again and surface to the user either way.
        try {
          await this.esploader.writeFlash(flashOptions);
        } catch (firstErr: any) {
          onLog(`Write failed (${firstErr.message || firstErr}), retrying this slot once...`, 'warning');
          await new Promise((r) => setTimeout(r, 500));
          await this.esploader.writeFlash(flashOptions);
        }
      } catch (hwErr: any) {
        onLog(`Flashing error on hardware: ${hwErr.message || hwErr}`, 'error');
        if (/noise|corruption|checksum|invalid head/i.test(String(hwErr.message || hwErr))) {
          onLog('This usually means the current baud rate is too high for your USB-OTG cable/adapter. Open Settings and try 115200 baud (or a shorter/better-quality OTG cable), then flash again.', 'warning');
        }
        throw hwErr;
      }

      bytesWrittenCumulative += slot.fileSize;
      // esptool-js only reports a real MD5 match if you pass a
      // calculateMD5Hash callback into writeFlash (not done here), so this
      // does not claim a hash was verified when none was computed.
      onLog(`[Slot #${slot.slotNumber}] Successfully written ${slot.fileName} to ${offsetHex}`, 'success');
    }

    // Reset board
    onLog('--------------------------------------------------------', 'output');
    onLog('Hard resetting via RTS pin...', 'info');
    try {
      await this.esploader.hardReset();
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 400));

    onProgress({
      stage: 'completed',
      currentSlotIndex: activeSlots.length,
      totalSlots: activeSlots.length,
      currentFileName: 'All Binaries',
      currentPercentage: 100,
      totalPercentage: 100,
      statusMessage: 'Flashing successfully completed!',
    });

    onLog('FLASH COMPLETE! Board has been reset and is now running your new firmware.', 'success');
  }

  public parseOffset(offsetStr: string): number {
    const trimmed = offsetStr.trim().toLowerCase();
    if (trimmed.startsWith('0x')) {
      return parseInt(trimmed, 16);
    }
    // Check if valid hex
    if (/^[0-9a-f]+$/i.test(trimmed)) {
      return parseInt(trimmed, 16);
    }
    return parseInt(trimmed, 10);
  }
}

export const flasherService = new EspFlasherService();
