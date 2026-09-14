import React, { useRef } from 'react';
import { 
  FileCode2, 
  Trash2, 
  Upload, 
  Check, 
  Hash, 
  Layers, 
  FileCheck,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { BinSlot } from '../types';

interface BinSlotRowProps {
  slot: BinSlot;
  index: number;
  totalSlots: number;
  onUpdateOffset: (id: string, offset: string) => void;
  onFileSelect: (id: string, file: File) => void;
  onClearFile?: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onDeleteSlot: (id: string) => void;
  isFlashing: boolean;
}

const COMMON_OFFSETS = [
  { label: '0x1000', name: 'Bootloader' },
  { label: '0x8000', name: 'Partitions' },
  { label: '0xe000', name: 'Boot App' },
  { label: '0x10000', name: 'App Firmware' },
  { label: '0x0000', name: 'Merged / Single Bin' },
];

export const BinSlotRow: React.FC<BinSlotRowProps> = ({
  slot,
  index,
  totalSlots,
  onUpdateOffset,
  onFileSelect,
  onClearFile,
  onToggleEnabled,
  onDeleteSlot,
  isFlashing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileSelect(slot.id, file);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isOffsetValid = (val: string) => {
    const v = val.trim().toLowerCase();
    if (v.startsWith('0x')) {
      return /^[0-9a-f]+$/i.test(v.slice(2));
    }
    return /^[0-9a-f]+$/i.test(v);
  };

  const validOffset = isOffsetValid(slot.offset);

  return (
    <div 
      id={`bin-slot-${slot.id}`}
      className={`rounded-2xl border transition-all duration-200 ${
        slot.enabled 
          ? 'bg-slate-900/95 border-slate-700/80 shadow-md hover:border-slate-600' 
          : 'bg-slate-900/40 border-slate-800/60 opacity-60'
      } p-3.5 sm:p-4`}
    >
      {/* Slot Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          {/* Slot Checkbox to enable/disable */}
          <label className="relative flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              id={`checkbox-slot-${slot.id}`}
              checked={slot.enabled}
              onChange={() => onToggleEnabled(slot.id)}
              disabled={isFlashing}
              className="sr-only"
            />
            <div 
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                slot.enabled 
                  ? 'bg-cyan-600 border-cyan-500 text-white' 
                  : 'bg-slate-800 border-slate-700 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </label>

          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
              #{index + 1}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight">
              Binary Slot
            </span>
          </div>

          {slot.file || slot.fileData ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              <FileCheck className="w-3 h-3" />
              {formatBytes(slot.fileSize)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (No file selected)
            </span>
          )}
        </div>

        {/* Delete Slot Button (Visible when totalSlots > 1) */}
        {totalSlots > 1 && (
          <button
            type="button"
            id={`btn-delete-slot-${slot.id}`}
            onClick={() => onDeleteSlot(slot.id)}
            disabled={isFlashing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/40 rounded-lg transition disabled:opacity-40"
            title="Remove this slot"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Delete</span>
          </button>
        )}
      </div>

      {/* Slot Inputs Grid: File Picker + Offset Address */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* BIN File Picker (Drag/Drop or Click) */}
        <div className="md:col-span-7">
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin"
            onChange={handleFileChange}
            disabled={isFlashing}
            className="hidden"
            id={`file-input-${slot.id}`}
          />
          <div
            onClick={() => !isFlashing && fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border border-dashed px-3.5 py-2.5 flex items-center justify-between gap-3 transition ${
              slot.fileName
                ? 'bg-slate-800/70 border-cyan-500/40 hover:border-cyan-400/80 hover:bg-slate-800'
                : 'bg-slate-800/30 border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                slot.fileName ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <FileCode2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                {slot.fileName ? (
                  <>
                    <p className="text-xs sm:text-sm font-medium text-slate-100 truncate">
                      {slot.fileName}
                    </p>
                    <p className="text-[11px] text-cyan-400 font-mono">
                      {formatBytes(slot.fileSize)} • Click to change .bin
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                      Select .bin firmware file
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Click to choose or drag & drop binary
                    </p>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={isFlashing}
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Browse</span>
            </button>
          </div>
        </div>

        {/* Offset Address Input (0x1000, 0x8000, 0x10000, etc.) */}
        <div className="md:col-span-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label 
                htmlFor={`offset-input-${slot.id}`}
                className="text-[11px] font-semibold text-slate-300 flex items-center gap-1"
              >
                <Hash className="w-3 h-3 text-cyan-400" />
                Offset Address (Hex)
              </label>
              {!validOffset && (
                <span className="text-[10px] text-rose-400 flex items-center gap-0.5">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Invalid Hex
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                id={`offset-input-${slot.id}`}
                value={slot.offset}
                onChange={(e) => onUpdateOffset(slot.id, e.target.value)}
                disabled={isFlashing}
                placeholder="0x1000"
                className={`w-full bg-slate-950/90 border rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:ring-1 transition ${
                  validOffset 
                    ? 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/30' 
                    : 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30 text-rose-300'
                }`}
              />
            </div>

            {/* Quick offset preset chips */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <Layers className="w-2.5 h-2.5" /> Preset:
              </span>
              {COMMON_OFFSETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onUpdateOffset(slot.id, preset.label)}
                  disabled={isFlashing}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition border ${
                    slot.offset.toLowerCase() === preset.label.toLowerCase()
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                  title={preset.name}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
