import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  BinSlotRow 
} from './components/BinSlotRow';
import { 
  ActionControls 
} from './components/ActionControls';
import { 
  SettingsModal 
} from './components/SettingsModal';
import { 
  AndroidOTGGuideModal 
} from './components/AndroidOTGGuideModal';
import { 
  InstallAppModal 
} from './components/InstallAppModal';
import { 
  LogTerminal 
} from './components/LogTerminal';
import { 
  BinSlot, 
  FlashSettings, 
  TerminalLog, 
  FlashingProgress, 
  ConnectedDeviceInfo 
} from './types';
import { 
  flasherService 
} from './Services/espFlasher';
import { 
  getDemoBinSlots 
} from './data/demoFirmware';
import { 
  Cpu, 
  Smartphone, 
  Layers, 
  HardDrive, 
  Radio, 
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';

const DEFAULT_OFFSETS = ['0x1000', '0x8000', '0xe000', '0x10000', '0x20000'];
const MAX_SLOTS = 5;

export default function App() {
  // 1. Bin Slots State (starts with exactly 1 slot as requested)
  const [slots, setSlots] = useState<BinSlot[]>([
    {
      id: 'slot-1',
      slotNumber: 1,
      offset: '0x1000',
      file: null,
      fileName: '',
      fileSize: 0,
      fileData: null,
      enabled: true,
    },
  ]);

  // 2. Settings State (Requested 5 settings)
  const [settings, setSettings] = useState<FlashSettings>({
    chipFamily: 'ESP32',
    flashFreq: '40m',
    flashMode: 'dio',
    flashSize: '4MB',
    eraseAndFlash: false, // 5th setting
    baudRate: 115200,     // recommended for Android 10+ OTG
  });

  // 3. Hardware & Serial Connection State
  const [deviceInfo, setDeviceInfo] = useState<ConnectedDeviceInfo>({ connected: false });
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // 4. Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOtgGuideOpen, setIsOtgGuideOpen] = useState<boolean>(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Capture Android PWA install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      addLog('Android App installation prompt is ready! Tap "Install APK" in the header.', 'info');
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      addLog('ESP32 Flasher successfully installed on your Android device!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 5. Progress State
  const [progress, setProgress] = useState<FlashingProgress>({
    active: false,
    stage: 'idle',
    currentSlotIndex: 0,
    totalSlots: 0,
    currentFileName: '',
    currentPercentage: 0,
    totalPercentage: 0,
    bytesWritten: 0,
    totalBytes: 0,
    statusMessage: '',
  });

  // 6. Logs Console State
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      text: 'ESP32 WebSerial Flasher initialized. Optimized for Android 10+ OTG & Desktop Chrome.',
      type: 'info',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      text: '1 Bin Slot active. Use "+" to add up to 5 slots, or click Settings icon in corner.',
      type: 'output',
    },
  ]);

  const addLog = (text: string, type: TerminalLog['type'] = 'info') => {
    const newLog: TerminalLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
      text,
      type,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Connect to ESP32 (Hardware via WebSerial / Android OTG, with simulated fallback)
  const handleConnectDevice = async () => {
    setIsConnecting(true);
    try {
      addLog('Connecting to device at ' + settings.baudRate + ' baud...', 'info');
      const dev = await flasherService.connect(settings.baudRate, addLog, true);
      setDeviceInfo(dev);
      addLog(`Connected successfully: ${dev.chipName}`, 'success');
    } catch (err: any) {
      addLog(`Connection failed: ${err.message}`, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectDevice = async () => {
    try {
      await flasherService.disconnect(addLog);
      setDeviceInfo({ connected: false });
    } catch (err: any) {
      addLog(`Disconnect error: ${err.message}`, 'error');
    }
  };

  // Dynamic Slot Management: Add Slot (+)
  const handleAddSlot = () => {
    if (slots.length >= MAX_SLOTS) {
      addLog(`Maximum limit of ${MAX_SLOTS} slots reached.`, 'warning');
      return;
    }
    const newIndex = slots.length;
    const defaultOffset = DEFAULT_OFFSETS[newIndex] || '0x10000';
    const newSlot: BinSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      slotNumber: newIndex + 1,
      offset: defaultOffset,
      file: null,
      fileName: '',
      fileSize: 0,
      fileData: null,
      enabled: true,
    };

    setSlots((prev) => [...prev, newSlot]);
    addLog(`Opened Slot #${newIndex + 1} with default offset ${defaultOffset}.`, 'info');
  };

  // Dynamic Slot Management: Delete Slot
  const handleDeleteSlot = (id: string) => {
    if (slots.length <= 1) {
      addLog('At least 1 slot must remain open.', 'warning');
      return;
    }

    setSlots((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // Re-index slot numbers
      return filtered.map((s, idx) => ({ ...s, slotNumber: idx + 1 }));
    });
    addLog(`Deleted slot. Remaining slots: ${slots.length - 1}.`, 'info');
  };

  // Update offset string for a slot
  const handleUpdateOffset = (id: string, offset: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, offset } : s))
    );
  };

  // Update file for a slot
  const handleFileSelect = async (id: string, file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      setSlots((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                file,
                fileName: file.name,
                fileSize: file.size,
                fileData: buffer,
                enabled: true,
              }
            : s
        )
      );
      addLog(`Selected file "${file.name}" (${(file.size / 1024).toFixed(1)} KB) for Slot.`, 'info');
    } catch (err: any) {
      addLog(`Error reading file: ${err.message}`, 'error');
    }
  };

  // Toggle slot enabled/disabled
  const handleToggleEnabled = (id: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Load sample demo ESP32 binaries so users can test immediately
  const handleLoadDemoBins = () => {
    const demoSlots = getDemoBinSlots();
    setSlots(demoSlots);
    addLog('Loaded 4 ready-made ESP32 demo binaries: Bootloader (0x1000), Partitions (0x8000), Boot App (0xe000), and Firmware Blink (0x10000).', 'success');
  };

  // Erase Flash (Standalone Erase action)
  const handleEraseFlash = async () => {
    if (settings.eraseAndFlash) {
      addLog('Erase button is disabled because "Erase & Flash" is enabled in settings.', 'warning');
      return;
    }

    // If not connected, connect simulated or prompt
    if (!deviceInfo.connected) {
      addLog('No hardware connected. Auto-initiating connection...', 'info');
      try {
        const dev = await flasherService.connect(settings.baudRate, addLog, true);
        setDeviceInfo(dev);
      } catch (err: any) {
        addLog(`Could not connect: ${err.message}`, 'error');
        return;
      }
    }

    setIsFlashing(true);
    setProgress({
      active: true,
      stage: 'erasing',
      currentSlotIndex: 0,
      totalSlots: 1,
      currentFileName: 'Entire Flash',
      currentPercentage: 0,
      totalPercentage: 0,
      bytesWritten: 0,
      totalBytes: 0,
      statusMessage: 'Starting Erase...',
    });

    try {
      await flasherService.eraseFlash(addLog, (prog) => {
        setProgress((prev) => ({
          ...prev,
          ...prog,
          active: true,
        }));
      });
      addLog('Flash Erase completed successfully!', 'success');
    } catch (err: any) {
      addLog(`Erase failed: ${err.message}`, 'error');
    } finally {
      setIsFlashing(false);
      setTimeout(() => {
        setProgress((prev) => ({ ...prev, active: false }));
      }, 3000);
    }
  };

  // Flash Firmware (Flash action)
  const handleFlash = async () => {
    const activeSlots = slots.filter((s) => s.enabled && (s.fileData || s.file));
    if (activeSlots.length === 0) {
      addLog('Please select at least one .bin file or click "Load Demo Bins" to test.', 'error');
      return;
    }

    // If not connected, auto-connect simulated or request port
    if (!deviceInfo.connected) {
      addLog('Connecting ESP32 device before flash...', 'info');
      try {
        const dev = await flasherService.connect(settings.baudRate, addLog, true);
        setDeviceInfo(dev);
      } catch (err: any) {
        addLog(`Connection failed: ${err.message}`, 'error');
        return;
      }
    }

    setIsFlashing(true);
    setProgress({
      active: true,
      stage: 'connecting',
      currentSlotIndex: 1,
      totalSlots: activeSlots.length,
      currentFileName: activeSlots[0].fileName,
      currentPercentage: 0,
      totalPercentage: 0,
      bytesWritten: 0,
      totalBytes: activeSlots.reduce((acc, s) => acc + s.fileSize, 0),
      statusMessage: 'Preparing flash...',
    });

    try {
      await flasherService.flashFiles(slots, settings, addLog, (prog) => {
        setProgress((prev) => ({
          ...prev,
          ...prog,
          active: true,
        }));
      });
    } catch (err: any) {
      addLog(`Flashing failed: ${err.message}`, 'error');
    } finally {
      setIsFlashing(false);
      setTimeout(() => {
        setProgress((prev) => ({ ...prev, active: false }));
      }, 4000);
    }
  };

  const hasSelectedFiles = slots.some((s) => s.enabled && (s.fileData || s.file));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Header with Last Corner Settings Icon & Install APK */}
      <Header
        settings={settings}
        deviceInfo={deviceInfo}
        isConnecting={isConnecting}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOtgGuide={() => setIsOtgGuideOpen(true)}
        onOpenInstallApp={() => setIsInstallAppOpen(true)}
        onConnectDevice={handleConnectDevice}
        onDisconnectDevice={handleDisconnectDevice}
        onLog={addLog}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-6 space-y-5">
        {/* Device & Configuration Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Chip Family Card */}
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 transition flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">Board Family</span>
              <span className="text-xs sm:text-sm font-semibold text-white truncate block">
                {settings.chipFamily}
              </span>
            </div>
          </div>

          {/* Flash Mode & Freq Card */}
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 transition flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">SPI Mode & Freq</span>
              <span className="text-xs sm:text-sm font-semibold text-white truncate block">
                {settings.flashMode.toUpperCase()} • {settings.flashFreq}
              </span>
            </div>
          </div>

          {/* Flash Size Card */}
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className="cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 transition flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">Flash Size</span>
              <span className="text-xs sm:text-sm font-semibold text-white truncate block">
                {settings.flashSize}
              </span>
            </div>
          </div>

          {/* Erase & Flash Indicator Card */}
          <div 
            onClick={() => setIsSettingsOpen(true)}
            className={`cursor-pointer border rounded-xl p-3 transition flex items-center gap-2.5 ${
              settings.eraseAndFlash
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              settings.eraseAndFlash 
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">Erase & Flash</span>
              <span className="text-xs sm:text-sm font-semibold truncate block">
                {settings.eraseAndFlash ? 'Enabled (Active)' : 'Separate'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Bin Files Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Firmware Bin Files ({slots.length} / {MAX_SLOTS})</span>
            </h2>

            <span className="text-[11px] text-slate-400">
              Flash 1 to 5 binaries at custom memory offsets
            </span>
          </div>

          {/* Render Dynamic Slots (1 to 5) */}
          <div className="space-y-3">
            {slots.map((slot, index) => (
              <BinSlotRow
                key={slot.id}
                slot={slot}
                index={index}
                totalSlots={slots.length}
                onUpdateOffset={handleUpdateOffset}
                onFileSelect={handleFileSelect}
                onToggleEnabled={handleToggleEnabled}
                onDeleteSlot={handleDeleteSlot}
                isFlashing={isFlashing}
              />
            ))}
          </div>

          {/* Action Controls: Add Slot (+) + Erase & Flash buttons below slots */}
          <ActionControls
            totalSlots={slots.length}
            maxSlots={MAX_SLOTS}
            settings={settings}
            progress={progress}
            isFlashing={isFlashing}
            onAddSlot={handleAddSlot}
            onErase={handleEraseFlash}
            onFlash={handleFlash}
            onLoadDemoBins={handleLoadDemoBins}
            hasSelectedFiles={hasSelectedFiles}
            isConnected={deviceInfo.connected}
          />
        </section>

        {/* Real-time Serial Terminal Console */}
        <section className="space-y-2 pt-2">
          <LogTerminal
            logs={logs}
            onClearLogs={handleClearLogs}
            isFlashing={isFlashing}
          />
        </section>

        {/* Android 10+ OTG Support Banner */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              <strong>Android 10 & 10+ Mobile:</strong> Flash ESP32 firmware directly from your phone browser using a standard USB-OTG cable.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOtgGuideOpen(true)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 shrink-0 self-start sm:self-auto"
          >
            View OTG Guide →
          </button>
        </div>
      </main>

      {/* Settings Modal (5 items: ESP32 Family, Frequency, Mode, Size, Erase&Flash) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Android 10+ OTG Guide Modal */}
      <AndroidOTGGuideModal
        isOpen={isOtgGuideOpen}
        onClose={() => setIsOtgGuideOpen(false)}
      />

      {/* Install Android App & APK Modal */}
      <InstallAppModal
        isOpen={isInstallAppOpen}
        onClose={() => setIsInstallAppOpen(false)}
        deferredPrompt={deferredPrompt}
        onAppInstalled={() => setDeferredPrompt(null)}
        onLog={addLog}
      />
    </div>
  );
}
