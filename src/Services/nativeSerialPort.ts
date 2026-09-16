// esptool-js's Transport class is written against the standard Web Serial
// SerialPort interface (the object navigator.serial.requestPort() returns):
// .open(options), .readable, .writable, .close(), .setSignals(), .getInfo().
// Capacitor's Android WebView doesn't implement navigator.serial at all, so
// there is nothing to hand Transport there. This file builds an object with
// the exact same shape, backed by the real native USB-serial plugin
// (UsbSerialPlugin.java) — so Transport/ESPLoader can drive real hardware
// from inside the installed app without knowing the difference.
import { registerPlugin, Capacitor } from '@capacitor/core';

interface UsbSerialDataEvent {
  data: string; // base64
}
interface UsbSerialErrorEvent {
  message: string;
}

interface UsbSerialPluginIface {
  isAvailable(): Promise<{ available: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  open(options: { baudRate: number }): Promise<{ vendorId: number; productId: number }>;
  write(options: { data: string }): Promise<void>;
  setSignals(options: { dtr?: boolean; rts?: boolean }): Promise<void>;
  close(): Promise<void>;
  addListener(
    eventName: 'dataReceived',
    listenerFunc: (event: UsbSerialDataEvent) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'serialError',
    listenerFunc: (event: UsbSerialErrorEvent) => void
  ): Promise<{ remove: () => void }>;
}

const UsbSerial = registerPlugin<UsbSerialPluginIface>('UsbSerial');

export function isNativeUsbSerialPlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function isNativeUsbSerialAvailable(): Promise<boolean> {
  if (!isNativeUsbSerialPlatform()) return false;
  try {
    const res = await UsbSerial.isAvailable();
    return !!res.available;
  } catch {
    return false;
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Drop-in replacement for the browser's SerialPort object, backed by the
 * native UsbSerialPlugin. Pass an instance of this to esptool-js's
 * `Transport` exactly like you would navigator.serial.requestPort()'s result.
 */
export class NativeSerialPort {
  private dataListener: { remove: () => void } | null = null;
  private errorListener: { remove: () => void } | null = null;
  private streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
  private _readable: ReadableStream<Uint8Array> | null = null;
  private _writable: WritableStream<Uint8Array> | null = null;
  private vendorId = 0;
  private productId = 0;

  async open(options: { baudRate: number }): Promise<void> {
    const perm = await UsbSerial.requestPermission();
    if (!perm.granted) {
      throw new Error('USB permission was denied. Reconnect the cable and allow access when prompted.');
    }

    const info = await UsbSerial.open({ baudRate: options.baudRate });
    this.vendorId = info.vendorId;
    this.productId = info.productId;

    this.dataListener = await UsbSerial.addListener('dataReceived', (event) => {
      this.streamController?.enqueue(base64ToUint8Array(event.data));
    });
    this.errorListener = await UsbSerial.addListener('serialError', (event) => {
      this.streamController?.error(new Error(event.message));
    });

    this._readable = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.streamController = controller;
      },
      cancel: () => {
        this.streamController = null;
      },
    });

    this._writable = new WritableStream<Uint8Array>({
      write: async (chunk) => {
        await UsbSerial.write({ data: uint8ArrayToBase64(chunk) });
      },
    });
  }

  get readable(): ReadableStream<Uint8Array> | null {
    return this._readable;
  }

  get writable(): WritableStream<Uint8Array> | null {
    return this._writable;
  }

  async setSignals(signals: { dataTerminalReady?: boolean; requestToSend?: boolean }): Promise<void> {
    await UsbSerial.setSignals({ dtr: signals.dataTerminalReady, rts: signals.requestToSend });
  }

  async getSignals(): Promise<{ clearToSend: boolean; dataCarrierDetect: boolean; dataSetReady: boolean; ringIndicator: boolean }> {
    // Native driver doesn't expose input line status; esptool-js only uses
    // setSignals() during its reset sequence, so this is not on the hot path.
    return { clearToSend: true, dataCarrierDetect: true, dataSetReady: true, ringIndicator: false };
  }

  getInfo(): { usbVendorId?: number; usbProductId?: number } {
    return { usbVendorId: this.vendorId, usbProductId: this.productId };
  }

  async close(): Promise<void> {
    this.dataListener?.remove();
    this.errorListener?.remove();
    this.dataListener = null;
    this.errorListener = null;
    this.streamController?.close();
    this.streamController = null;
    await UsbSerial.close();
  }
}
