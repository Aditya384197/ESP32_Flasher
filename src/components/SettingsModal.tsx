import React from 'react';
import { 
  ArrowLeft,
  X, 
  Cpu, 
  Gauge, 
  HardDrive, 
  Check, 
  Info,
  Sliders,
  Settings2,
  CheckCircle2
} from 'lucide-react';
import { 
  FlashSettings, 
  EspChipFamily, 
  FlashFrequency, 
  FlashMode, 
  FlashSize 
} from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FlashSettings;
  onUpdateSettings: (newSettings: FlashSettings) => void;
}

const CHIP_FAMILIES: { value: EspChipFamily; label: string; desc: string }[] = [
  { value: 'ESP32', label: 'ESP32', desc: 'Xtensa Dual-Core 240MHz' },
  { value: 'ESP32-S3', label: 'ESP32-S3', desc: 'Xtensa Dual-Core + AI Vector' },
  { value: 'ESP32-C5', label: 'ESP32-C5', desc: 'RISC-V 2.4/5GHz Dual-Band' },
  { value: 'ESP32-C3', label: 'ESP32-C3', desc: 'Single-core RISC-V 160MHz' },
  { value: 'ESP32-C6', label: 'ESP32-C6', desc: 'RISC-V Wi-Fi 6 + Zigbee/Thread' },
  { value: 'ESP32-S2', label: 'ESP32-S2', desc: 'Single-core Xtensa + Native USB' },
  { value: 'ESP32-H2', label: 'ESP32-H2', desc: 'RISC-V 802.15.4 + BLE 5.2' },
  { value: 'ESP32-C2', label: 'ESP32-C2', desc: 'Compact RISC-V Architecture' },
];

const FLASH_FREQUENCIES: { value: FlashFrequency; label: string }[] = [
  { value: '40m', label: '40 MHz (Standard)' },
  { value: '80m', label: '80 MHz (High Speed)' },
  { value: '26m', label: '26 MHz' },
  { value: '20m', label: '20 MHz (Safe / Recovery)' },
];

const FLASH_MODES: { value: FlashMode; label: string; desc: string }[] = [
  { value: 'dio', label: 'DIO', desc: 'Dual I/O (Recommended default)' },
  { value: 'qio', label: 'QIO', desc: 'Quad I/O (Fastest SPI throughput)' },
  { value: 'dout', label: 'DOUT', desc: 'Dual Output' },
  { value: 'qout', label: 'QOUT', desc: 'Quad Output' },
];

const FLASH_SIZES: { value: FlashSize; label: string }[] = [
  { value: '4MB', label: '4 MB (Most ESP32 boards)' },
  { value: '2MB', label: '2 MB' },
  { value: '8MB', label: '8 MB' },
  { value: '16MB', label: '16 MB' },
  { value: '32MB', label: '32 MB' },
];

const BAUD_RATES = [
  { value: 115200, label: '115200 baud (Recommended for Android OTG)' },
  { value: 460800, label: '460800 baud (Fast Flashing)' },
  { value: 921600, label: '921600 baud (High Speed Desktop)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="settings-modal"
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header with Back Arrow Button */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Dedicated Back Arrow button to return to main page */}
            <button
              type="button"
              id="btn-settings-back"
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-400 border border-slate-700 transition active:scale-95"
              title="Back to Flasher"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold">Back</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Settings2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Flash Configuration
                </h2>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* 1. ESP32 Family Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>1. Chip Family</span>
              </label>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Selected: {settings.chipFamily}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHIP_FAMILIES.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  id={`btn-select-chip-${chip.value.toLowerCase()}`}
                  onClick={() => onUpdateSettings({ ...settings, chipFamily: chip.value })}
                  className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                    settings.chipFamily === chip.value
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold ring-1 ring-cyan-500/30'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">{chip.label}</span>
                    {settings.chipFamily === chip.value && (
                      <Check className="w-3 h-3 text-cyan-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-1">
                    {chip.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Flash Frequency */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>2. Flash Frequency</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FLASH_FREQUENCIES.map((freq) => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, flashFreq: freq.value })}
                  className={`p-2 rounded-xl text-center border transition ${
                    settings.flashFreq === freq.value
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono text-xs">{freq.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Flash Mode */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>3. Flash Mode</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FLASH_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, flashMode: mode.value })}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    settings.flashMode === mode.value
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-mono text-xs font-bold">{mode.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Flash Size */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>4. Flash Size</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FLASH_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, flashSize: size.value })}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    settings.flashSize === size.value
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-mono text-xs font-bold">{size.value}</div>
                  <div className="text-[10px] text-slate-400">{size.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Erase & Flash Checkbox (5th setting) */}
          <div className="pt-2 border-t border-slate-800">
            <label 
              id="label-erase-and-flash"
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                settings.eraseAndFlash
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                id="checkbox-erase-and-flash"
                checked={settings.eraseAndFlash}
                onChange={(e) => onUpdateSettings({ ...settings, eraseAndFlash: e.target.checked })}
                className="sr-only"
              />
              <div 
                className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center border transition shrink-0 ${
                  settings.eraseAndFlash
                    ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 border-slate-600 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  <span>5. Erase & Flash Prior to Upload</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Automatically wipe all SPI flash memory sectors before writing the new binaries.
                </p>
                <div className="mt-2 text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong>Rule Active:</strong> When enabled, the standalone <strong>Erase</strong> button on the main screen will be disabled. Only the <strong>Flash</strong> button will be active to ensure erase and flash execute together.
                  </span>
                </div>
              </div>
            </label>
          </div>

          {/* Baud Rate Option */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-slate-300 text-xs flex items-center gap-1">
              <span>Baud Rate</span>
            </label>
            <select
              value={settings.baudRate}
              onChange={(e) => onUpdateSettings({ ...settings, baudRate: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              {BAUD_RATES.map((br) => (
                <option key={br.value} value={br.value}>
                  {br.label}
                </option>
              ))}
            </select>
            {settings.baudRate >= 460800 && (
              <p className="text-[10.5px] text-amber-400 leading-relaxed pt-1">
                ⚠ High baud rates can cause "serial noise/corruption" errors while
                flashing over a phone's USB-OTG adapter, even if erase works fine.
                If flashing fails partway through, switch back to 115200 baud.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer with Return to Flasher button */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Changes apply automatically
          </span>
          <button
            type="button"
            id="btn-save-settings"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md shadow-cyan-600/30"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Back to Flasher</span>
          </button>
        </div>
      </div>
    </div>
  );
};
