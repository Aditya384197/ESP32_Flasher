import React from 'react';
import { 
  Plus, 
  Zap, 
  Info, 
  Flame,
  Layers
} from 'lucide-react';
import { FlashSettings, FlashingProgress } from '../types';

interface ActionControlsProps {
  totalSlots: number;
  maxSlots: number;
  settings: FlashSettings;
  progress: FlashingProgress;
  isFlashing: boolean;
  onAddSlot: () => void;
  onErase: () => void;
  onFlash: () => void;
  hasSelectedFiles: boolean;
  isConnected: boolean;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  totalSlots,
  maxSlots,
  settings,
  progress,
  isFlashing,
  onAddSlot,
  onErase,
  onFlash,
  hasSelectedFiles,
  isConnected,
}) => {
  return (
    <div className="space-y-4 pt-1">
      {/* Dynamic Slot Add Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Active Slots:</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-cyan-400 font-bold">
              {totalSlots} / {maxSlots}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            (Supports 1 to 5 binary files)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Slot '+' Button */}
          <button
            type="button"
            id="btn-add-slot"
            onClick={onAddSlot}
            disabled={isFlashing || totalSlots >= maxSlots}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              totalSlots >= maxSlots
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500/50 shadow-cyan-600/20 active:scale-95'
            }`}
            title={totalSlots >= maxSlots ? 'Max 5 slots reached' : 'Open another binary slot (+)'}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Slot</span>
          </button>
        </div>
      </div>

      {/* Main Action Buttons: Erase & Flash (Right below slots, side by side) */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 1. Erase Flash Button */}
          <div className="flex flex-col">
            <button
              type="button"
              id="btn-erase-flash"
              onClick={onErase}
              disabled={isFlashing || settings.eraseAndFlash}
              className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm sm:text-base border transition shadow-md ${
                settings.eraseAndFlash
                  ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                  : 'bg-slate-800/90 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border-rose-500/30 hover:border-rose-500/60 shadow-rose-900/10 active:scale-[0.99]'
              } disabled:cursor-not-allowed`}
              title={
                settings.eraseAndFlash
                  ? 'Disabled: Erase & Flash option is active in settings'
                  : 'Wipe all sectors of SPI Flash memory'
              }
            >
              <Flame className={`w-5 h-5 ${settings.eraseAndFlash ? 'text-slate-600' : 'text-rose-400'}`} />
              <span>Erase Flash</span>
            </button>

            {/* Note when eraseAndFlash is ON */}
            {settings.eraseAndFlash ? (
              <p className="text-[11px] text-amber-400/90 mt-1.5 text-center flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Erase & Flash active in Settings (Auto-erase will run before flash)</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                Wipe entire chip memory before fresh installation
              </p>
            )}
          </div>

          {/* 2. Flash Firmware Button (Active, beside Erase) */}
          <div className="flex flex-col">
            <button
              type="button"
              id="btn-flash-firmware"
              onClick={onFlash}
              disabled={isFlashing || !hasSelectedFiles}
              className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm sm:text-base border transition shadow-lg ${
                isFlashing
                  ? 'bg-cyan-700 text-white border-cyan-500 animate-pulse'
                  : !hasSelectedFiles
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white border-cyan-400/40 shadow-cyan-600/30 active:scale-[0.99]'
              }`}
              title={!hasSelectedFiles ? 'Select at least one .bin file first' : 'Flash active binary slots'}
            >
              {isFlashing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Flashing In Progress...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current text-cyan-200" />
                  <span>Flash Firmware</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 mt-1.5 text-center">
              {!isConnected 
                ? '(Plug in USB-OTG and connect a real ESP32)' 
                : settings.eraseAndFlash 
                ? '⚡ Erase & Flash combined execution' 
                : 'Writes enabled binaries to target offsets'}
            </p>
          </div>
        </div>

        {/* Progress Bar & Status (when flashing or completed) */}
        {progress.active && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                {progress.stage === 'erasing' ? (
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                )}
                {progress.statusMessage}
              </span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                {progress.totalPercentage}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-500/50"
                style={{ width: `${Math.max(4, Math.min(100, progress.totalPercentage))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[200px] sm:max-w-xs">
                Writing: {progress.currentFileName || 'Binary'}
              </span>
              <span>Slot {progress.currentSlotIndex} of {progress.totalSlots}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
