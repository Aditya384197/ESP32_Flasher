export interface BinSlot {
  id: string;
  slotNumber: number;
  offset: string;
  file: File | null;
  fileName: string;
  fileSize: number;
  fileData: ArrayBuffer | null;
  enabled: boolean;
}

export type EspChipFamily = 
  | 'ESP32'
  | 'ESP32-S3'
  | 'ESP32-C5'
  | 'ESP32-C3'
  | 'ESP32-C6'
  | 'ESP32-S2'
  | 'ESP32-H2'
  | 'ESP32-C2';

export type FlashFrequency = '40m' | '80m' | '20m' | '26m';
export type FlashMode = 'dio' | 'qio' | 'dout' | 'qout';
export type FlashSize = '2MB' | '4MB' | '8MB' | '16MB' | '32MB';

export interface FlashSettings {
  chipFamily: EspChipFamily;
  flashFreq: FlashFrequency;
  flashMode: FlashMode;
  flashSize: FlashSize;
  eraseAndFlash: boolean;
  baudRate: number;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'output';
}

export interface FlashingProgress {
  active: boolean;
  stage: 'idle' | 'connecting' | 'erasing' | 'flashing' | 'verifying' | 'completed' | 'failed';
  currentSlotIndex: number;
  totalSlots: number;
  currentFileName: string;
  currentPercentage: number;
  totalPercentage: number;
  bytesWritten: number;
  totalBytes: number;
  speedKbps?: number;
  statusMessage: string;
}

export interface ConnectedDeviceInfo {
  connected: boolean;
  chipName?: string;
  macAddress?: string;
  crystalFreq?: string;
  flashSize?: string;
  portName?: string;
  isSimulated?: boolean;
}
