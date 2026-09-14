import React, { useState } from 'react';
import { 
  ArrowLeft, 
  X, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  PackageCheck, 
  Zap, 
  Github, 
  FileCode2,
  AlertCircle
} from 'lucide-react';
import { downloadSourceCodeZip } from '../utils/sourceZipExporter';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onAppInstalled: () => void;
  onLog: (text: string, type?: 'info' | 'success' | 'warning' | 'error' | 'output') => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onAppInstalled,
  onLog,
}) => {
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // 1. Direct 1-Tap Native Android Installation (WebAPK / PWA)
  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      onLog('Triggering native Android installation prompt...', 'info');
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          onLog('User accepted! ESP32 Flasher is now installed as a native app on your phone.', 'success');
          onAppInstalled();
          onClose();
        } else {
          onLog('Installation prompt dismissed.', 'warning');
        }
      } catch (err: any) {
        onLog(`Install prompt error: ${err.message}`, 'error');
      }
    } else {
      onLog('To install on Android: In Chrome menu (⋮), tap "Add to Home screen" or "Install App".', 'info');
    }
  };

  // 2. Download APK Package / Source Bundle
  const handleDownloadPackage = async () => {
    try {
      setIsDownloadingApk(true);
      onLog('Packaging Android APK project & native assets...', 'info');
      
      const res = await downloadSourceCodeZip();
      setDownloadSuccess(true);
      onLog(`Android project (${res.fileCount} files) downloaded: esp32-flasher-source.zip with GitHub Actions APK builder (.github/workflows/build-apk.yml).`, 'success');
    } catch (err: any) {
      onLog(`Failed to package APK project: ${err.message}`, 'error');
    } finally {
      setIsDownloadingApk(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="install-app-modal"
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-install-back"
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-400 border border-slate-700 transition active:scale-95"
              title="Back to Flasher"
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
                Install Android App
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
          {/* Method 1: Direct 1-Tap Phone Installation (WebAPK) */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-800/50 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                    <span>1-Tap Direct Install</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      Fastest
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Installs directly to your Android Home Screen & App Drawer
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Android OS automatically mints an official standalone application with custom icon, full-screen display, and full USB-OTG serial permissions.
            </p>

            <button
              type="button"
              id="btn-trigger-direct-install"
              onClick={handleDirectInstall}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/30 active:scale-[0.99]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install to Android Phone Now</span>
            </button>

            {!deferredPrompt && (
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  Tip: In Chrome on Android, tap the three dots <strong>(⋮)</strong> and select <strong>"Add to Home screen"</strong> / <strong>"Install app"</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Method 2: GitHub Actions Automated APK Builder */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>GitHub Actions APK Cloud Builder</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pre-configured workflow file: <code className="text-cyan-300">.github/workflows/build-apk.yml</code>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Push this repository to your GitHub and GitHub Actions will automatically compile the native Android Gradle project into a signed or debug <code className="text-cyan-300">.apk</code> artifact for you to download.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-white block">Step 1: Push to GitHub</span>
                <span className="text-slate-400 font-mono text-[10px] block">git push origin main</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="font-semibold text-white block">Step 2: Download APK</span>
                <span className="text-slate-400 text-[10px] block">From GitHub "Actions" tab</span>
              </div>
            </div>
          </div>

          {/* Method 3: Download Complete APK Project & Code Bundle */}
          <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <h4 className="font-semibold text-white text-xs">
                  Download Full Android APK Project Files
                </h4>
              </div>
              {downloadSuccess && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Includes complete <code className="text-cyan-300">android/</code> Gradle folder, manifests, and GitHub Actions APK builder.
            </p>

            <button
              type="button"
              id="btn-download-apk-bundle"
              onClick={handleDownloadPackage}
              disabled={isDownloadingApk}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition"
            >
              {isDownloadingApk ? (
                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Download Android Package Archive (.ZIP)</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/95 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
