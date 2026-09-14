import React from 'react';
import { 
  ArrowLeft,
  X, 
  Smartphone, 
  Cable, 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  Zap,
  Info
} from 'lucide-react';

interface AndroidOTGGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidOTGGuideModal: React.FC<AndroidOTGGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="android-otg-modal"
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header with Back Button */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-otg-back"
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-400 border border-slate-700 transition active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold">Back</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Android 10+ USB-OTG Guide
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Installed-app limitation notice */}
          <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-3 text-[11px] text-rose-200/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Installed app limitation:</strong> the steps below (OTG toggle, Web Serial device picker) only work when this page is opened directly in the <strong>Chrome browser</strong> (desktop, or Android Chrome with the flag below). The installed APK runs in an embedded WebView that does not implement Web Serial / WebUSB, so <strong>Connect will always fall back to Simulated Mode</strong> inside the app itself — it will not talk to real hardware.
            </p>
          </div>

          {/* Step 1 */}
          <div className="flex gap-3 items-start bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
            <div className="w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white flex items-center gap-1.5">
                <Cable className="w-3.5 h-3.5 text-cyan-400" />
                Connect via USB-OTG Cable
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Plug a USB Type-C or Micro-USB OTG adapter into your Android 10+ smartphone, then attach your ESP32 board using a standard data-transfer USB cable.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 items-start bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
            <div className="w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                Enable OTG in Phone Settings
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                On OnePlus, Realme, Oppo, Vivo, or Xiaomi devices: Open <strong>Settings → System / Additional Settings → OTG Connection</strong> and toggle it ON.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 items-start bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
            <div className="w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Grant Serial Port Permission
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tap <strong>"Connect"</strong> in the top header. When the browser prompt asks for access to the USB / Serial device (CP2102, CH340, FTDI, or ESP JTAG), select the device and tap <strong>Connect</strong>.
              </p>
            </div>
          </div>

          {/* Chrome Flag Tip */}
          <div className="bg-cyan-950/40 border border-cyan-800/40 rounded-xl p-3 space-y-1.5">
            <div className="font-semibold text-cyan-300 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Android Chrome WebSerial Note</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If the device picker dialog does not appear automatically on your Android Chrome, open <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono">chrome://flags</code>, enable <strong>"Experimental Web Platform features"</strong>, and relaunch Chrome.
            </p>
          </div>

          {/* Hardware Boot Mode Tip */}
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-[11px] text-amber-200/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>ESP32 Bootloader Tip:</strong> If your board does not respond to auto-reset, hold down the <strong>BOOT (IO0)</strong> button on the ESP32 board, press the <strong>EN / RST</strong> button once, then release BOOT. The chip is now in download mode.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/95 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
