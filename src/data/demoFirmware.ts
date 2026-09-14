import { BinSlot } from '../types';

// Helper to create simulated byte buffer for demo flashing
function createDummyBinary(size: number, name: string): ArrayBuffer {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < size; i++) {
    // Fill with magic bytes and sequential data
    view[i] = (i ^ 0xe7) & 0xff;
  }
  // ESP32 magic byte header 0xE9
  view[0] = 0xe9;
  return buffer;
}

export function getDemoBinSlots(): BinSlot[] {
  const bootloaderData = createDummyBinary(28 * 1024, 'bootloader.bin');
  const partitionsData = createDummyBinary(3 * 1024, 'partitions.bin');
  const app0Data = createDummyBinary(8 * 1024, 'boot_app0.bin');
  const appFirmwareData = createDummyBinary(192 * 1024, 'firmware_esp32_blink.bin');

  return [
    {
      id: 'slot-demo-1',
      slotNumber: 1,
      offset: '0x1000',
      file: null,
      fileName: 'bootloader.bin',
      fileSize: bootloaderData.byteLength,
      fileData: bootloaderData,
      enabled: true,
    },
    {
      id: 'slot-demo-2',
      slotNumber: 2,
      offset: '0x8000',
      file: null,
      fileName: 'partitions.bin',
      fileSize: partitionsData.byteLength,
      fileData: partitionsData,
      enabled: true,
    },
    {
      id: 'slot-demo-3',
      slotNumber: 3,
      offset: '0xe000',
      file: null,
      fileName: 'boot_app0.bin',
      fileSize: app0Data.byteLength,
      fileData: app0Data,
      enabled: true,
    },
    {
      id: 'slot-demo-4',
      slotNumber: 4,
      offset: '0x10000',
      file: null,
      fileName: 'firmware_esp32_blink.bin',
      fileSize: appFirmwareData.byteLength,
      fileData: appFirmwareData,
      enabled: true,
    },
  ];
}
