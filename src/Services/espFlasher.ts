import { BinSlot, FlashSettings, ConnectedDeviceInfo } from '../types';

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

export class EspFlasherService {
  private port: any = null;
  private esploader: any = null;
  private transport: any = null;
  private isConnected: boolean = false;
  private isSimulated: boolean = false;
  private deviceInfo: ConnectedDeviceInfo = { connected: false };

  public isWebSerialSupported(): boolean {
    return 'serial' in navigator || 'usb' in navigator;
  }

  public getDeviceInfo(): ConnectedDeviceInfo {
    return this.deviceInfo;
  }

  public async connect(
    baudRate: number,
    onLog: LogCallback,
    simulateFallback = false
  ): Promise<ConnectedDeviceInfo> {
    onLog('Checking serial / USB OTG availability...', 'info');

    // Check if WebSerial is supported
    if (!('serial' in navigator)) {
      // IMPORTANT (Android APK build): the installed .apk runs inside Capacitor's
      // Android System WebView, which does NOT implement the Web Serial API (and
      // has no navigator.usb bridge either, since MainActivity.java is a bare
      // BridgeActivity with no native USB-serial plugin registered). That means
      // navigator.serial will never exist inside the packaged app, no matter what
      // OTG cable is used — real flashing can only work when this same web build
      // is opened directly in desktop Chrome/Edge, or in Chrome for Android with
      // "Experimental Web Platform features" enabled AND a WebUSB bridge.
      const isCapacitorApp = !!(window as any).Capacitor;
      if (isCapacitorApp) {
        onLog(
          'Web Serial API is not available inside the installed Android app (Capacitor WebView has no USB-serial bridge). Real hardware flashing cannot work from the .apk as built — open this app in desktop Chrome/Edge, or add a native USB-serial Capacitor plugin.',
          'error'
        );
      }
      if (simulateFallback) {
        onLog('Web Serial not available in this context. Starting Simulated Hardware Mode (Demo) — nothing is written to a real chip.', 'warning');
        return this.connectSimulated(baudRate, onLog);
      } else {
        throw new Error('Web Serial API is not supported in this browser. On Android Chrome, enable "Experimental Web Platform features" in chrome://flags or connect via desktop Chrome/Edge.');
      }
    }

    try {
      onLog('Requesting Serial Port (USB / OTG)...', 'info');
      // @ts-ignore
      this.port = await navigator.serial.requestPort({});
      onLog('Port selected. Initializing connection at ' + baudRate + ' baud...', 'info');

      // Attempt to load esptool-js dynamically
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
        this.isSimulated = false;
        this.deviceInfo = {
          connected: true,
          chipName: chip || 'ESP32',
          macAddress: mac,
          portName: 'USB / OTG Serial',
          isSimulated: false,
        };

        return this.deviceInfo;
      } catch (innerErr: any) {
        // BUGFIX: this used to swallow the real esptool-js error and mark the
        // device as "Connected" (isSimulated:false) anyway, which meant a genuine
        // hardware sync failure was reported to the user as a successful real
        // connection. Any erase/flash after that silently ran in the simulated
        // code path (since this.esploader was unusable) while claiming to be
        // real hardware -> fake "success" with nothing actually written to the chip.
        // Now we close the port and surface the real failure instead.
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
    } catch (err: any) {
      if (err.name === 'NotFoundError' || err.message?.includes('No port selected')) {
        onLog('Port selection cancelled by user.', 'warning');
        throw new Error('Port selection cancelled.');
      }
      onLog(`Hardware connection error: ${err.message}`, 'error');
      if (simulateFallback) {
        onLog('Switching to simulated mode for demonstration.', 'info');
        return this.connectSimulated(baudRate, onLog);
      }
      throw err;
    }
  }

  public async connectSimulated(baudRate: number, onLog: LogCallback): Promise<ConnectedDeviceInfo> {
    onLog('Initializing Simulated ESP32 hardware device...', 'info');
    await new Promise((resolve) => setTimeout(resolve, 600));
    onLog('Serial handshake sent (DTR/RTS pulse)...', 'info');
    await new Promise((resolve) => setTimeout(resolve, 500));
    onLog('Bootloader sync acknowledged: 0x07 0x07 0x12 0x20', 'output');
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    const simulatedMac = '24:6F:28:' + Math.floor(Math.random() * 89 + 10) + ':' + Math.floor(Math.random() * 89 + 10) + ':' + Math.floor(Math.random() * 89 + 10);
    onLog(`Chip Family: ESP32-D0WDQ6 (revision v1.0)`, 'success');
    onLog(`Features: WiFi, BT, Dual Core, 240MHz, VRef calibration in efuse`, 'info');
    onLog(`Crystal: 40MHz | MAC: ${simulatedMac}`, 'info');

    this.isConnected = true;
    this.isSimulated = true;
    this.deviceInfo = {
      connected: true,
      chipName: 'ESP32 (Simulated Mode)',
      macAddress: simulatedMac,
      crystalFreq: '40 MHz',
      flashSize: '4MB SPI Flash',
      portName: 'Virtual Serial Port',
      isSimulated: true,
    };

    return this.deviceInfo;
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
    this.isSimulated = false;
    this.deviceInfo = { connected: false };
    onLog('Device disconnected successfully.', 'info');
  }

  public async eraseFlash(
    onLog: LogCallback,
    onProgress: ProgressCallback
  ): Promise<void> {
    if (!this.isConnected) {
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

    if (this.isSimulated || !this.esploader) {
      // Simulate erase steps
      for (let i = 20; i <= 95; i += 15) {
        await new Promise((r) => setTimeout(r, 600));
        onLog(`Erasing sector at offset 0x${(i * 0x10000).toString(16)}...`, 'output');
        onProgress({
          stage: 'erasing',
          currentSlotIndex: 0,
          totalSlots: 1,
          currentFileName: 'Entire SPI Flash Chip',
          currentPercentage: i,
          totalPercentage: i,
          statusMessage: `Erasing chip memory (${i}%)...`,
        });
      }
      await new Promise((r) => setTimeout(r, 800));
    } else {
      try {
        await this.esploader.eraseFlash();
      } catch (err: any) {
        onLog(`Hardware erase flash error: ${err.message}`, 'error');
        throw err;
      }
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
    if (!this.isConnected) {
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

      if (this.isSimulated || !this.esploader) {
        // High fidelity simulated flashing with chunks
        const chunks = 10;
        const delay = Math.max(120, Math.min(300, 2000 / chunks));

        for (let c = 1; c <= chunks; c++) {
          await new Promise((r) => setTimeout(r, delay));
          const filePercent = Math.round((c / chunks) * 100);
          const currentSlotBytes = Math.round((c / chunks) * slot.fileSize);
          const overallPercent = Math.round(((bytesWrittenCumulative + currentSlotBytes) / (totalBytesAll || 1)) * 100);

          onProgress({
            stage: 'flashing',
            currentSlotIndex: index + 1,
            totalSlots: activeSlots.length,
            currentFileName: slot.fileName,
            currentPercentage: filePercent,
            totalPercentage: overallPercent,
            statusMessage: `Writing ${slot.fileName} (${filePercent}%) at ${offsetHex}`,
          });

          if (c % 3 === 0 || c === chunks) {
            const blockAddr = '0x' + (offsetVal + Math.floor((c / chunks) * slot.fileSize)).toString(16).toUpperCase();
            onLog(`Wrote ${Math.round(currentSlotBytes / 1024)} KB / ${Math.round(slot.fileSize / 1024)} KB to ${blockAddr} (${filePercent}%)`, 'output');
          }
        }
      } else {
        // Real hardware flashing using esptool-js
        try {
          // BUGFIX: esptool-js >= 0.6.0 changed writeFlash's fileArray[].data to
          // expect a raw Uint8Array (see "Use Uint8Array instead of string for
          // write flash" in the esptool-js changelog, which explicitly breaks
          // callers still using the old binary-string format). This project
          // depends on esptool-js ^0.6.1, so the old String.fromCharCode
          // conversion here was passing the wrong type — real hardware writes
          // would either throw or write corrupted/garbage data to the chip.
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

          await this.esploader.writeFlash(flashOptions);
        } catch (hwErr: any) {
          onLog(`Flashing error on hardware: ${hwErr.message || hwErr}`, 'error');
          throw hwErr;
        }
      }

      bytesWrittenCumulative += slot.fileSize;
      // NOTE: esptool-js only reports a real MD5 match if you pass a
      // calculateMD5Hash callback into writeFlash (not done here), so this no
      // longer claims a hash was verified when none was computed.
      onLog(`[Slot #${slot.slotNumber}] Successfully written ${slot.fileName} to ${offsetHex}`, 'success');
    }

    // Reset board
    onLog('--------------------------------------------------------', 'output');
    onLog('Hard resetting via RTS pin...', 'info');
    if (this.esploader) {
      try {
        await this.esploader.hardReset();
      } catch {
        // ignore
      }
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

    onLog('🎉 FLASH COMPLETE! Board has been reset and is now running your new firmware.', 'success');
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
