import React, { useRef, useEffect, useState } from 'react';
import { 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ArrowDownToLine,
  Activity
} from 'lucide-react';
import { TerminalLog } from '../types';

interface LogTerminalProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  isFlashing: boolean;
}

export const LogTerminal: React.FC<LogTerminalProps> = ({
  logs,
  onClearLogs,
  isFlashing,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && isExpanded) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isExpanded]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogColor = (type: TerminalLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'error':
        return 'text-rose-400 font-semibold';
      case 'output':
        return 'text-cyan-300/90 font-mono';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
      {/* Terminal Header */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-1.5 ml-2 text-xs font-mono font-medium text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Serial Console & Flasher Log</span>
            {isFlashing && (
              <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-sans ml-1">
                <Activity className="w-3 h-3 animate-spin" />
                Active
              </span>
            )}
          </div>
        </div>

        {/* Console Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Copy logs */}
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Copy all logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear logs */}
          <button
            type="button"
            onClick={onClearLogs}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Collapse / Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {isExpanded && (
        <div className="p-3 sm:p-4 font-mono text-[11px] sm:text-xs h-56 sm:h-64 overflow-y-auto space-y-1 bg-slate-950/90 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-600 text-center py-10 font-sans text-xs">
              No logs yet. Connect ESP32 or click Flash / Erase to start.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-600 select-none shrink-0 text-[10px]">
                  {log.timestamp}
                </span>
                <span className={`${getLogColor(log.type)} break-all`}>
                  {log.text}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
};
