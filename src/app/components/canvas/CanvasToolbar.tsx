import { useState, useEffect } from "react";
import {
  MousePointer2,
  Hand,
  Pencil,
  ZoomIn,
  ZoomOut,
  Maximize,
  Clock,
  Undo2,
  Trash2,
  Type,
  Square,
  ChevronDown,
} from "lucide-react";
import type { ToolMode, CanvasViewport } from "./types";
import { DomainSelector, type Domain } from "../DomainSelector";

interface CanvasToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  viewport: CanvasViewport;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onClearDrawing: () => void;
  selectedDomain: Domain;
  onDomainChange: (d: Domain) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onExport: () => void;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
}

export function CanvasToolbar({
  toolMode,
  onToolModeChange,
  viewport,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onClearDrawing,
  selectedDomain,
  onDomainChange,
  selectedCount,
  onDeleteSelected,
  onExport,
  selectedColor,
  onColorChange,
}: CanvasToolbarProps) {
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: number | undefined;
    if (timerRunning) {
      interval = window.setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const tools: { mode: ToolMode; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { mode: "select", icon: <MousePointer2 className="w-5 h-5" />, label: "Select", shortcut: "V" },
    { mode: "pan", icon: <Hand className="w-5 h-5" />, label: "Pan", shortcut: "H" },
    { mode: "draw", icon: <Pencil className="w-5 h-5" />, label: "Draw", shortcut: "D" },
  ];

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white w-full shrink-0 z-50 h-16">
        {/* LEFT: Logo & Title */}
        <div className="flex items-center gap-4 min-w-fit">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <span className="font-bold text-lg">W</span>
            </div>
            <h1 className="font-bold text-sm text-slate-800 leading-tight">Whiteboard Helper</h1>
          </div>
        </div>

        {/* RIGHT: Export, Timer, Domain */}
        <div className="flex items-center gap-4 min-w-fit justify-end">
          <DomainSelector selected={selectedDomain} onChange={onDomainChange} />

          <div className="h-6 w-px bg-border/60" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button onClick={onZoomOut} className="w-7 h-7 rounded-md hover:bg-secondary flex items-center justify-center"><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className="text-[12px] font-mono w-10 text-center">{Math.round(viewport.zoom * 100)}%</span>
            <button onClick={onZoomIn} className="w-7 h-7 rounded-md hover:bg-secondary flex items-center justify-center"><ZoomIn className="w-3.5 h-3.5" /></button>
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-[12px] hover:bg-primary/90 transition-all font-medium shadow-sm whitespace-nowrap"
          >
            Export
          </button>

          {/* Timer */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium font-mono">
              {formatTime(timer)}
            </span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className={`text-[11px] px-2 py-0.5 rounded ${timerRunning ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
            >
              {timerRunning ? "Stop" : "Start"}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Bottom Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-xl border border-gray-200 px-6 py-3 flex items-center gap-4 z-50">
        <div className="flex items-center gap-1">
          {[
            { mode: "select", icon: <MousePointer2 className="w-5 h-5" />, label: "Select", shortcut: "V" },
            { mode: "pan", icon: <Hand className="w-5 h-5" />, label: "Pan", shortcut: "H" },
            { mode: "draw", icon: <Pencil className="w-5 h-5" />, label: "Draw", shortcut: "D" },
            { mode: "text", icon: <Type className="w-5 h-5" />, label: "Text", shortcut: "T" },
            { mode: "shape", icon: <Square className="w-5 h-5" />, label: "Square", shortcut: "S" },
            { mode: "circle", icon: <div className="w-4 h-4 rounded-full border-2 border-current" />, label: "Circle", shortcut: "C" },
          ].map((t) => (
            <button
              key={t.mode}
              onClick={() => onToolModeChange(t.mode as any)}
              className={`p-2 rounded-lg transition-all ${toolMode === t.mode
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                }`}
              title={`${t.label} (${t.shortcut})`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          {["bg-blue-500", "bg-red-500", "bg-green-500", "bg-yellow-500", "bg-black"].map(c => (
            <button
              key={c}
              onClick={() => onColorChange?.(c)}
              className={`w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110 ${c.replace("bg-", "bg-")} ${selectedColor === c ? "ring-2 ring-primary ring-offset-1" : ""}`}
              style={{ backgroundColor: c.replace("bg-", "").replace("-500", "") === "black" ? "#000000" : undefined }}
              title="Color"
            />
          ))}
        </div>
      </div>
    </>
  );
}
