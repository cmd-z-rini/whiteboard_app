import {
  MousePointer2,
  Hand,
  Pencil,
  ZoomIn,
  ZoomOut,
  Maximize,
  Clock,
  Undo2,
  Redo2,
  Trash2,
  Type,
  Square,
  ChevronDown,
  Play,
} from "lucide-react";
import type { ToolMode, CanvasViewport } from "./types";
import { DomainSelector, type Domain } from "../DomainSelector";
import * as Button from "../ui/alignui/button";

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
  // Timer state is owned by App so Session Mode can reset + start it on launch.
  timerSeconds: number;
  timerRunning: boolean;
  onToggleTimer: () => void;
  // Session Mode
  sessionActive: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  // Undo / redo
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  timerSeconds,
  timerRunning,
  onToggleTimer,
  sessionActive,
  onStartSession,
  onEndSession,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasToolbarProps) {
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
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background w-full shrink-0 z-50 h-16">
        {/* LEFT: Logo & Title */}
        <div className="flex items-center gap-4 min-w-fit">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20">
              <span className="font-bold text-lg">P</span>
            </div>
            <h1 className="font-extrabold text-lg text-foreground leading-none tracking-tight select-none">
              Prep<span className="text-primary">Slate</span>
            </h1>
          </div>

          <div className="h-6 w-px bg-border/60" />

          {/* Undo / redo */}
          <div className="flex items-center gap-1">
            <Button.Root
              variant="neutral"
              mode="ghost"
              size="xxsmall"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
            >
              <Button.Icon as={Undo2} />
            </Button.Root>
            <Button.Root
              variant="neutral"
              mode="ghost"
              size="xxsmall"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (⌘⇧Z)"
            >
              <Button.Icon as={Redo2} />
            </Button.Root>
          </div>
        </div>

        {/* RIGHT: Export, Timer, Domain */}
        <div className="flex items-center gap-4 min-w-fit justify-end">
          <DomainSelector selected={selectedDomain} onChange={onDomainChange} />

          <div className="h-6 w-px bg-border/60" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button.Root variant="neutral" mode="ghost" size="xxsmall" onClick={onZoomOut} title="Zoom out">
              <Button.Icon as={ZoomOut} />
            </Button.Root>
            <span className="text-sm font-mono w-10 text-center">{Math.round(viewport.zoom * 100)}%</span>
            <Button.Root variant="neutral" mode="ghost" size="xxsmall" onClick={onZoomIn} title="Zoom in">
              <Button.Icon as={ZoomIn} />
            </Button.Root>
          </div>

          <Button.Root variant="primary" mode="filled" size="xsmall" onClick={onExport}>
            Export
          </Button.Root>

          {/* Session Mode start/end */}
          {sessionActive ? (
            <Button.Root variant="error" mode="filled" size="xsmall" onClick={onEndSession}>
              <Button.Icon as={Square} className="fill-current" />
              End session
            </Button.Root>
          ) : (
            <Button.Root variant="neutral" mode="stroke" size="xsmall" onClick={onStartSession}>
              <Button.Icon as={Play} />
              Start session
            </Button.Root>
          )}

          {/* Timer */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium font-mono">
              {formatTime(timerSeconds)}
            </span>
            <button
              onClick={onToggleTimer}
              className={`text-xs px-2 py-0.5 rounded ${timerRunning ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
            >
              {timerRunning ? "Stop" : "Start"}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Bottom Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-background rounded-full shadow-xl border border-border px-6 py-3 flex items-center gap-4 z-50">
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
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              title={`${t.label} (${t.shortcut})`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-border" />

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
