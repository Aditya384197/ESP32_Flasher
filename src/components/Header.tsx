import React from 'react';
import { 
  Settings as SettingsIcon, 
  Usb, 
  Smartphone, 
  CheckCircle2, 
  Unplug,
  Download,
  PackageCheck
} from 'lucide-react';
import { ConnectedDeviceInfo, FlashSettings } from '../types';

interface HeaderProps {
  settings: FlashSettings;
  deviceInfo: ConnectedDeviceInfo;
  isConnecting: boolean;
  onOpenSettings: () => void;
  onOpenOtgGuide: () => void;
  onOpenInstallApp: () => void;
  onConnectDevice: () => void;
  onDisconnectDevice: () => void;
  onLog: (text: string, type?: 'info' | 'success' | 'warning' | 'error' | 'output') => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  deviceInfo,
  isConnecting,
  onOpenSettings,
  onOpenOtgGuide,
  onOpenInstallApp,
  onConnectDevice,
  onDisconnectDevice,
  onLog,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        {/* App Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-mono font-black text-base sm:text-lg">
            ESP
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ESP32 Flasher
              </h1>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {settings.chipFamily}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              WebSerial & USB-OTG Firmware Flasher • Android 10+ Compatible
            </p>
          </div>
        </div>

        {/* Action Controls & Last Corner Settings */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Install Android App / APK Button (Replaces Source Code button as requested) */}
          <button
            type="button"
            id="btn-install-app"
            onClick={onOpenInstallApp}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 shadow-sm transition active:scale-95"
            title="Install Android App / Download APK"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Install</span>
            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-900/60 px-1 py-0.5 rounded border border-emerald-600/40">
              APK
            </span>
          </button>

          {/* Android 10+ OTG Guide Button */}
          <button
            type="button"
            id="btn-otg-guide"
            onClick={onOpenOtgGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Android 10+ USB-OTG Connection Guide"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Android 10+</span>
            <span>OTG</span>
          </button>

          {/* Connect / Disconnect Hardware Button */}
          {deviceInfo.connected ? (
            <button
              type="button"
              id="btn-disconnect-device"
              onClick={onDisconnectDevice}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-medium rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:bg-rose-950/60 hover:border-rose-500/50 hover:text-rose-300 transition group"
              title="Click to disconnect"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:hidden" />
              <Unplug className="w-4 h-4 text-rose-400 hidden group-hover:inline" />
              <span className="font-mono">{deviceInfo.isSimulated ? 'Simulated' : 'Connected'}</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-connect-device"
              onClick={onConnectDevice}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition disabled:opacity-50"
            >
              {isConnecting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Usb className="w-4 h-4" />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          )}

          {/* Last Corner Settings Icon (आउट लास्ट कार्नर मे सेटिंग का आइकॉन) */}
          <button
            type="button"
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-cyan-400 flex items-center justify-center transition shadow-sm hover:rotate-45"
            title="ESP32 Settings (Chip Family, Frequency, Mode, Size, Erase & Flash)"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
