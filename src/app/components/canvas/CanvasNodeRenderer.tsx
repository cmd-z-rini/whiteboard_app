import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, Target, FileText, Users, AlertTriangle, Zap, ArrowRight, Calendar, Grid3X3, Check, Lightbulb, GripHorizontal, Copy, Signal, Wifi, BatteryFull, Smartphone, ChevronLeft, ChevronDown, ChevronUp, MoreHorizontal, Image as ImageIcon, Search, FlaskConical, Star, Shield, BookOpen, Eye, Award, GitMerge, HelpCircle, ClipboardList } from "lucide-react";
import {
  CanvasNode,
  CanvasComponentType,
  COMPONENT_DEFAULTS,
  FRAME_BEZEL,
  FRAME_STATUS_BAR_H,
  FRAME_HOME_INDICATOR_H,
} from "./types";
import { TimelineCardNode } from "./TimelineCard";
import * as Badge from "../ui/alignui/badge";

// ─── Clarifying Questions ────────────────────────────────────────
function ClarifyingQuestionsNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const questions = d.questions || [];

  const updateQ = (id: string, text: string) => {
    onUpdate({ ...d, questions: questions.map((q: any) => q.id === id ? { ...q, text } : q) });
  };
  const toggleQ = (id: string) => {
    onUpdate({ ...d, questions: questions.map((q: any) => q.id === id ? { ...q, answered: !q.answered } : q) });
  };
  const addQ = () => {
    onUpdate({ ...d, questions: [...questions, { id: `q-${Date.now()}`, text: "", answered: false }] });
  };

  return (
    <div className="p-1 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-md font-semibold">?</span>
        <span className="text-md font-semibold text-foreground">Clarifying Questions</span>
      </div>
      <div className="flex-1 space-y-2">
        {questions.map((q: any) => (
          <div key={q.id} className="group flex items-start gap-2.5">
            <button onClick={() => toggleQ(q.id)} className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors ${q.answered ? "bg-primary border-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/50"}`}>
              {q.answered && <Check className="w-3 h-3" />}
            </button>
            <InlineEdit value={q.text} onChange={(v) => updateQ(q.id, v)} className={`flex-1 text-base ${q.answered ? "text-muted-foreground line-through" : "text-foreground"}`} placeholder="Ask a question..." multiline />
          </div>
        ))}
        <button onClick={addQ} className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm mt-2">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>
    </div>
  );
}

// ─── Prioritization Matrix ───────────────────────────────────────
// ─── Prioritization Matrix ───────────────────────────────────────
function PrioritizationMatrixNode({ node }: NodeProps) {
  return (
    <div className="w-full h-full flex flex-col relative min-w-[600px] min-h-[400px]">
      <div className="absolute top-0 left-0 w-full h-full grid grid-cols-2 grid-rows-2">
        <div className="bg-[var(--category-1-surface-soft)] border-r border-b border-[var(--category-1-border-strong)] p-4 relative flex flex-col">
          <span className="text-xs font-bold text-[var(--category-1-text)] uppercase tracking-wider mb-1">High Impact</span>
          <span className="text-xs font-medium text-[var(--category-1-text)]/60 uppercase tracking-wider">Low Effort</span>
        </div>
        <div className="bg-[var(--category-2-surface-soft)] border-b border-[var(--category-2-border-strong)] p-4 relative flex flex-col">
          <span className="text-xs font-bold text-[var(--category-2-text)] uppercase tracking-wider mb-1">High Impact</span>
          <span className="text-xs font-medium text-[var(--category-2-text)]/60 uppercase tracking-wider">High Effort</span>
        </div>
        <div className="bg-[var(--category-3-surface-soft)] border-r border-[var(--category-3-border-strong)] p-4 relative flex flex-col">
          <span className="text-xs font-bold text-[var(--category-3-text)] uppercase tracking-wider mb-1">Low Impact</span>
          <span className="text-xs font-medium text-[var(--category-3-text)]/60 uppercase tracking-wider">Low Effort</span>
        </div>
        <div className="bg-[var(--category-4-surface-soft)] p-4 relative flex flex-col">
          <span className="text-xs font-bold text-[var(--category-4-text)] uppercase tracking-wider mb-1">Low Impact</span>
          <span className="text-xs font-medium text-[var(--category-4-text)]/60 uppercase tracking-wider">High Effort</span>
        </div>
      </div>
      {/* Background component, nodes are placed on top via canvas z-index/positioning naturally */}
    </div>
  );
}

// ─── Shape Node ──────────────────────────────────────────────────
function ShapeNode({ node }: NodeProps) {
  const d = node.data;
  const shapeClasses = {
    rectangle: "rounded-lg",
    circle: "rounded-full",
    diamond: "rotate-45 scale-75 rounded-sm",
  };
  // Default to rectangle if undefined
  const shapeClass = shapeClasses[(d.shapeType as "rectangle" | "circle" | "diamond") || "rectangle"];

  return (
    <div className={`w-full h-full ${shapeClass} ${d.color || "bg-blue-500"} shadow-sm border border-black/10 flex items-center justify-center`}>
      {/* Optional: Add text inside shape if needed later */}
    </div>
  );
}

// ─── Flow Step (Simple) ──────────────────────────────────────────
export function FlowStepNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="p-3 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
        {d.type === "action" ? "⚡" : "🛑"}
      </div>
      <InlineEdit value={d.label} onChange={(v) => onUpdate({ ...d, label: v })} className="text-base font-medium text-foreground" />
    </div>
  );
}

// ─── Mobile Frame (Updated) ──────────────────────────────────────


// ─── Business / User Goals ───────────────────────────────────────
function BusinessGoalsNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="h-full flex gap-3 p-1">
      <div className="flex-1 rounded-xl p-4 flex flex-col border" style={{ background: "var(--category-2-surface)", borderColor: "var(--category-2-border)" }}>
        <span className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--category-2-text)" }}>Business Goals</span>
        <InlineEdit value={d.business} onChange={(v) => onUpdate({ ...d, business: v })} className="flex-1 text-base text-foreground" multiline placeholder="Enter business goals..." />
      </div>
      <div className="flex-1 rounded-xl p-4 flex flex-col border" style={{ background: "var(--category-1-surface)", borderColor: "var(--category-1-border)" }}>
        <span className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--category-1-text)" }}>User Goals</span>
        <InlineEdit value={d.user} onChange={(v) => onUpdate({ ...d, user: v })} className="flex-1 text-base text-foreground" multiline placeholder="Enter user goals..." />
      </div>
      <div className="flex-1 rounded-xl p-4 flex flex-col border" style={{ background: "var(--category-5-surface)", borderColor: "var(--category-5-border)" }}>
        <span className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--category-5-text)" }}>Tech Constraints</span>
        <InlineEdit value={d.tech} onChange={(v) => onUpdate({ ...d, tech: v })} className="flex-1 text-base text-foreground" multiline placeholder="Enter technical constraints..." />
      </div>
    </div>
  );
}

// ─── Key Insights ────────────────────────────────────────────────
function KeyInsightsNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const insights = d.insights || [];

  const updateInsight = (id: string, text: string) => {
    onUpdate({ ...d, insights: insights.map((i: any) => i.id === id ? { ...i, text } : i) });
  };
  const updateType = (id: string, type: string) => {
    onUpdate({ ...d, insights: insights.map((i: any) => i.id === id ? { ...i, type } : i) });
  };
  const addInsight = () => {
    onUpdate({ ...d, insights: [...insights, { id: `i-${Date.now()}`, text: "", type: "finding" }] });
  };

  const TYPE_STYLE: Record<string, React.CSSProperties> = {
    problem: { background: "var(--category-4-surface)", borderColor: "var(--category-4-border)", color: "var(--category-4-text)" },
    stat: { background: "var(--category-2-surface)", borderColor: "var(--category-2-border)", color: "var(--category-2-text)" },
    finding: { background: "var(--category-3-surface)", borderColor: "var(--category-3-border)", color: "var(--category-3-text)" },
  };

  return (
    <div className="p-1">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4" />
        </span>
        <span className="text-md font-semibold text-foreground">Key Research Insights</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {insights.map((i: any) => (
          <div key={i.id} className="p-3 rounded-lg border flex flex-col gap-2" style={TYPE_STYLE[i.type] || { background: "var(--surface)", borderColor: "var(--surface-border)" }}>
            <div className="flex justify-between items-center">
              <select
                value={i.type}
                onChange={(e) => updateType(i.id, e.target.value)}
                className="text-xs uppercase font-semibold tracking-wide bg-transparent focus:outline-none opacity-70 hover:opacity-100"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="problem">Problem</option>
                <option value="stat">Stat</option>
                <option value="finding">Finding</option>
              </select>
            </div>
            <InlineEdit value={i.text} onChange={(v) => updateInsight(i.id, v)} className="font-medium text-sm text-foreground min-h-[40px]" multiline placeholder="Insight..." />
          </div>
        ))}
        <button onClick={addInsight} className="h-full min-h-[100px] rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/40 hover:border-border/80 hover:text-muted-foreground hover:bg-surface-subtle transition-all">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// ─── Crazy 8s (Updated) ──────────────────────────────────────────
function Crazy8sNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const grids = d.grids || Array(8).fill("");

  const updateGrid = (index: number, val: string) => {
    const newGrids = [...grids];
    newGrids[index] = val;
    onUpdate({ ...d, grids: newGrids });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="text-lg font-bold mb-4 flex items-center gap-2">
        <Grid3X3 className="w-5 h-5" /> Crazy 8s
      </div>
      <div className="grid grid-cols-4 grid-rows-2 gap-3 flex-1">
        {grids.map((text: string, i: number) => (
          <div key={i} className="relative border rounded-lg p-3 flex flex-col" style={{ background: "var(--category-3-surface-soft)", borderColor: "var(--category-3-border)" }}>
            <span className="absolute top-1 left-2 text-xs font-semibold text-muted-foreground/50 tabular-nums pointer-events-none">{i + 1}</span>
            <InlineEdit
              value={text}
              onChange={(v) => updateGrid(i, v)}
              className="flex-1 mt-3 font-handwriting text-sm leading-tight resize-none bg-transparent outline-none text-foreground"
              multiline
              placeholder="Sketch/Idea..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Frame ────────────────────────────────────────────────
// Device chrome (bezel / notch / status bar / home indicator) wrapping a real
// screen area. The screen is the container the PRD's F5 spec builds on — Stage 2
// renders child nodes inside [data-frame-screen], clipped to its bounds.
function MobileFrameNode({ node, screenChildren, isDropTarget }: NodeProps) {
  const hasChildren = Array.isArray(screenChildren) && screenChildren.length > 0;

  return (
    <div
      className={`w-full h-full rounded-[44px] bg-slate-800 shadow-xl relative select-none transition-shadow ${
        isDropTarget ? "ring-4 ring-primary/40" : ""
      }`}
      style={{ borderWidth: FRAME_BEZEL, borderStyle: "solid", borderColor: "rgb(30 41 59)" }}
    >
      <div className="absolute inset-0 bg-white rounded-[34px] overflow-hidden flex flex-col">
        {/* Status bar + notch */}
        <div
          className="relative shrink-0 flex items-center justify-between px-7 text-sm font-semibold text-slate-900 bg-white"
          style={{ height: FRAME_STATUS_BAR_H }}
        >
          <span>9:41</span>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-6 w-32 rounded-b-2xl bg-slate-800" />
          <span className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryFull className="w-4 h-4" />
          </span>
        </div>

        {/* Screen area — children are absolutely positioned in frame-local coords
            and clipped to this box (overflow-hidden = "can't drag outside"). */}
        <div
          className={`flex-1 relative overflow-hidden ${isDropTarget ? "bg-primary/5" : "bg-slate-50/60"}`}
          data-frame-screen={node.id}
        >
          {!hasChildren && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-300 pointer-events-none">
              <Smartphone className="w-8 h-8" />
              <span className="text-xs font-medium">Drop UI elements here</span>
            </div>
          )}
          {screenChildren}
        </div>

        {/* Home indicator */}
        <div
          className="shrink-0 flex items-center justify-center bg-white"
          style={{ height: FRAME_HOME_INDICATOR_H }}
        >
          <div className="h-1 w-28 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
}

// ─── Frame children (PRD F5 child element library) ───────────────
function UiNavBarNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="w-full h-full bg-white border-b border-slate-200 flex items-center gap-2 px-3 shadow-sm">
      <ChevronLeft className="w-5 h-5 text-slate-500 shrink-0" />
      <InlineEdit
        value={d.title}
        onChange={(v) => onUpdate({ ...d, title: v })}
        className="flex-1 text-md font-semibold text-slate-900 text-center"
        placeholder="Screen title"
        activateOn="dblclick"
      />
      <MoreHorizontal className="w-5 h-5 text-slate-500 shrink-0" />
    </div>
  );
}

function UiCardNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex gap-3">
      <div className="w-16 h-16 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-300">
        <ImageIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <InlineEdit
          value={d.title}
          onChange={(v) => onUpdate({ ...d, title: v })}
          className="text-base font-semibold text-slate-900"
          placeholder="Card title"
          activateOn="dblclick"
        />
        <InlineEdit
          value={d.body}
          onChange={(v) => onUpdate({ ...d, body: v })}
          className="text-sm text-slate-500"
          placeholder="Supporting copy"
          multiline
          activateOn="dblclick"
        />
      </div>
    </div>
  );
}

function UiTextBlockNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const isHeading = d.variant === "heading";
  return (
    <div className="w-full h-full flex items-start">
      <InlineEdit
        value={d.text}
        onChange={(v) => onUpdate({ ...d, text: v })}
        className={isHeading ? "text-lg font-bold text-slate-900" : "text-base text-slate-600"}
        placeholder="Add your copy here."
        multiline
        activateOn="dblclick"
      />
    </div>
  );
}

function UiButtonNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-slate-100 text-slate-900 border border-slate-200",
    ghost: "bg-transparent text-primary border border-primary/30",
  };
  const cycle = () => {
    const order = ["primary", "secondary", "ghost"];
    const next = order[(order.indexOf(d.variant || "primary") + 1) % order.length];
    onUpdate({ ...d, variant: next });
  };
  return (
    <div
      className={`w-full h-full rounded-xl flex items-center justify-center font-semibold text-base shadow-sm ${
        variants[d.variant] || variants.primary
      }`}
      onDoubleClick={cycle}
      title="Double-click to cycle variant"
    >
      <InlineEdit
        value={d.label}
        onChange={(v) => onUpdate({ ...d, label: v })}
        className="text-center"
        placeholder="Button"
        activateOn="dblclick"
      />
    </div>
  );
}

// ─── Wireframe Sketch ────────────────────────────────────────────
// Was aliased to MobileFrameNode, which ignored its data entirely. This is a
// low-fi sketch board: header bar, image placeholder, text lines, button.
function WireframeSketchNode({ node }: NodeProps) {
  return (
    <div className="w-full h-full rounded-lg border-2 border-dashed border-slate-400 bg-white p-4 flex flex-col gap-3 shadow-sm select-none">
      <div className="h-8 rounded bg-slate-200 shrink-0" />

      <div className="relative flex-1 min-h-[60px] rounded border border-slate-300 bg-slate-50 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full text-slate-300" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth={1} />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth={1} />
        </svg>
      </div>

      <div className="space-y-2 shrink-0">
        <div className="h-2.5 w-full rounded bg-slate-200" />
        <div className="h-2.5 w-4/5 rounded bg-slate-200" />
        <div className="h-2.5 w-3/5 rounded bg-slate-200" />
      </div>

      <div className="h-9 w-32 rounded-md bg-slate-300 shrink-0" />
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────
export interface NodeProps {
  node: CanvasNode;
  onUpdate: (data: Record<string, any>) => void;
  // New props for self-wrapping
  isSelected?: boolean;
  onStartDrag?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onResizeStart?: (e: React.MouseEvent, handle: "tl" | "tr" | "bl" | "br") => void;
  /**
   * Child nodes to mount inside a frame's screen area. Built by InfiniteCanvas
   * (which owns all mouse handling) and passed down, so the frame component
   * stays presentational.
   */
  screenChildren?: React.ReactNode;
  /** Frame is under an active palette drag — highlight it as a drop target. */
  isDropTarget?: boolean;
}

// ─── Standard Card Wrapper ───────────────────────────────────────
function StandardCardWrapper({ children, node, isSelected, onStartDrag, onDelete, onDuplicate }: { children: React.ReactNode } & NodeProps) {
  const defaults = COMPONENT_DEFAULTS[node.type] || { label: "Component", emoji: "🧩" };
  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition-shadow hover:shadow-md h-full flex flex-col ${isSelected ? "border-primary shadow-primary/10" : "border-transparent hover:border-border"}`}>
      {/* Drag handle */}
      <div
        className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing border-b border-border/50 rounded-t-xl bg-secondary/20"
        onMouseDown={(e) => onStartDrag?.(e)}
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            {defaults.label}
          </span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover/node:opacity-100 transition-opacity">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
            className="p-1 rounded hover:bg-secondary text-muted-foreground/40 hover:text-foreground transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors"
            title="Delete"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content — no overflow clip: the card auto-grows to fit its content
          (the node wrapper uses minHeight + height:auto), so nothing scrolls. */}
      <div className="p-3 h-full">
        {children}
      </div>
    </div>
  );
}

// ─── Naked nodes ─────────────────────────────────────────────────
// PRD "Naked Canvas" philosophy: a sticky note should just be a sticky note, not
// a card with a header. These types render bare — no header bar, no grip, no
// label — and are dragged by their body (the node wrapper in InfiniteCanvas
// already puts startNodeDrag on the whole element).
//
// StandardCardWrapper is kept only for genuinely structured multi-field
// templates (Persona Card, Empathy Map, User Journey, Prioritization Matrix)
// and the remaining unreviewed templates.
const NAKED_TYPES = new Set<CanvasComponentType>([
  "sticky-note",
  "text-card",
  "shape",
  "flow-step",
  "section-header",
  "mobile-frame",
  "wireframe-sketch",
  // Guided problem statement renders its own white card + left accent, so it must
  // not be double-wrapped by StandardCardWrapper.
  "problem-statement-guided",
  // Frame children are bare UI elements — a card header would defeat the point.
  "ui-nav-bar",
  "ui-card",
  "ui-text-block",
  "ui-button",
]);

// Naked types that carry an explicit data.height and can be resized.
// The rest size to their content, so resize handles would fight the layout.
const RESIZABLE_NAKED_TYPES = new Set<CanvasComponentType>([
  "shape",
  "mobile-frame",
  "wireframe-sketch",
  "ui-nav-bar",
  "ui-card",
  "ui-text-block",
  "ui-button",
]);

// ─── Naked Node Shell ────────────────────────────────────────────
// Selection affordance + hover actions, floated OUTSIDE the node body so the
// content stays visually bare. Deletion also works via the Delete/Backspace
// handler in App.tsx; this just keeps it discoverable.
function NakedNodeShell({
  children,
  node,
  isSelected,
  onDelete,
  onDuplicate,
  onResizeStart,
  resizable,
}: { children: React.ReactNode; resizable?: boolean } & NodeProps) {
  return (
    <div className="relative w-full h-full">
      {children}

      {isSelected && (
        resizable ? (
          <SelectionOverlay
            isSelected
            onResizeStart={onResizeStart}
            width={node.width}
            height={node.data.height}
          />
        ) : (
          <div className="absolute -inset-0.5 border border-primary rounded-xl pointer-events-none" />
        )
      )}

      {/* Anchored with bottom-full (flush to the node's top edge) and spaced with
          PADDING, not an offset. Padding is inside the element's box, so the
          hoverable region runs continuously from the node into the buttons — an
          offset like `-top-9` leaves a dead band between the two, and crossing it
          drops :hover and hides the bar before you can click it.
          pointer-events-none while hidden: an opacity-0 element still eats clicks,
          which would swallow drag-starts in the strip above every naked node. */}
      <div className="absolute bottom-full right-0 pb-1.5 opacity-0 pointer-events-none group-hover/node:opacity-100 group-hover/node:pointer-events-auto transition-opacity z-50">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-white p-0.5 shadow-sm">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
            className="p-1 rounded hover:bg-secondary text-muted-foreground/60 hover:text-foreground transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors"
            title="Delete"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Simple Text Node ──────────────────────────────────────────────
function SimpleTextNode({ node, onUpdate, isSelected, onStartDrag, onResizeStart }: NodeProps) {
  const d = node.data;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = newHeight + "px";
      if (newHeight !== d.height) {
        // Debounce or check to avoid infinite loops if onUpdate triggers re-render
        // For now, we just rely on local style for smoothness, and update data on blur or periodically?
        // Actually, updating data on every keypress might be heavy but ensures sync.
        // Let's rely on the style for display and update data.height.
        // onUpdate({ ...d, height: newHeight }); 
      }
    }
  }, [d.text]);

  return (
    <div
      className={`min-w-[100px] min-h-[40px] p-2 relative group ${isSelected ? "rounded-lg" : "hover:border-2 hover:border-blue-200 hover:border-dashed"}`}
      onMouseDown={onStartDrag}
      style={{ width: node.width, height: "auto" }} // Allow container to grow
    >
      <SelectionOverlay isSelected={!!isSelected} onResizeStart={onResizeStart} width={node.width} height={node.data.height} />
      <textarea
        ref={textareaRef}
        value={d.text}
        onChange={(e) => {
          // We need to update height in data so parent InfiniteCanvas knows
          e.target.style.height = "auto";
          const h = e.target.scrollHeight;
          onUpdate({ ...d, text: e.target.value, height: h });
        }}
        className="w-full bg-transparent resize-none border-none focus:ring-0 text-slate-800 leading-normal focus:outline-none font-handwriting text-lg overflow-hidden"
        style={{ fontSize: (d.fontSize || 18) + "px", height: d.height || "auto" }}
        placeholder="Type..."
        onMouseDown={(e) => e.stopPropagation()}
        autoFocus={!d.text} // Autofocus if empty (newly created)
      />
    </div>
  );
}

// ─── Simple Shape Node ─────────────────────────────────────────────
// ─── Selection Overlay (Handles) ───────────────────────────────────
// ─── Selection Overlay (Handles) ───────────────────────────────────
interface SelectionOverlayProps {
  isSelected: boolean;
  onResizeStart?: (e: React.MouseEvent, handle: "tl" | "tr" | "bl" | "br") => void;
  width?: number;
  height?: number;
}

function SelectionOverlay({ isSelected, onResizeStart, width, height }: SelectionOverlayProps) {
  if (!isSelected) return null;

  const handleStyle = "absolute w-3 h-3 bg-white border border-primary z-50";

  return (
    <>
      <div className="absolute inset-0 border border-primary pointer-events-none" />

      {/* Dimension Label (While resizing, but we don't have isResizing state here easily without prop drill. 
          For now, show it if selected and width/height is available? Or just relies on user drag) 
          Let's show it only if we added a `showDimensions` prop, but for now user asked for it "while resizing".
          Since we lift state, we can't easily know "while resizing" here unless passed.
          I'll skip the label inside this component for now and implement it in standard way or overlay.
          Actually, let's just show the handles.
      */}

      {/* Top Left */}
      <div
        className={`${handleStyle} -top-1.5 -left-1.5 cursor-nwse-resize`}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart?.(e, "tl"); }}
      />
      {/* Top Right */}
      <div
        className={`${handleStyle} -top-1.5 -right-1.5 cursor-nesw-resize`}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart?.(e, "tr"); }}
      />
      {/* Bottom Left */}
      <div
        className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-nesw-resize`}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart?.(e, "bl"); }}
      />
      {/* Bottom Right */}
      <div
        className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-nwse-resize`}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart?.(e, "br"); }}
      />

      {/* Dimension Label (Static for now if needed, or we render it from parent) */}
      {(width && height) && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {Math.round(width)} × {Math.round(height)}
        </div>
      )}
    </>
  );
}


function SimpleShapeNode({ node, onUpdate, isSelected, onStartDrag, onResizeStart }: NodeProps) {
  const d = node.data;
  return (
    <div
      className={`w-full h-full ${d.color?.includes("bg-") ? d.color : "bg-transparent border-4 border-slate-800"} flex items-center justify-center shadow-sm relative group`}
      style={{ overflow: "hidden" }} // Removed resize: both
      onMouseDown={onStartDrag}
    >
      <SelectionOverlay isSelected={!!isSelected} onResizeStart={onResizeStart} width={node.width} height={d.height} />
    </div>
  );
}

function SimpleCircleNode({ node, onUpdate, isSelected, onStartDrag, onResizeStart }: NodeProps) {
  const d = node.data;
  return (
    <div
      className={`w-full h-full rounded-full ${d.color?.includes("bg-") ? d.color : "bg-transparent border-4 border-slate-800"} flex items-center justify-center shadow-sm relative group`}
      style={{ overflow: "hidden" }} // Removed resize: both
      onMouseDown={onStartDrag}
    >
      <SelectionOverlay isSelected={!!isSelected} onResizeStart={onResizeStart} width={node.width} height={d.height} />
    </div>
  );
}

function PencilNode({ node, isSelected }: NodeProps) {
  const d = node.data;
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* SVG rendered at node position. The node x/y is the top-left of the bounding box. */}
      <svg
        width={node.width}
        height={node.data.height}
        viewBox={`0 0 ${node.width} ${node.data.height}`}
        style={{ overflow: "visible" }}
      >
        <path
          d={d.path}
          stroke={d.color}
          strokeWidth={d.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-auto cursor-pointer" // Allow selection
        />
      </svg>
      {isSelected && (
        <div className="absolute inset-0 border-2 border-primary border-dashed pointer-events-none opacity-50" />
      )}
    </div>
  );
}

export function CanvasNodeRenderer(props: NodeProps) {
  const { node, onUpdate } = props;

  // 1. Handle Simple Nodes (Raw Rendering)
  if (node.type === "simple-text") {
    return <SimpleTextNode {...props} />;
  }
  if (node.type === "simple-shape") {
    return <SimpleShapeNode {...props} />;
  }
  if (node.type === "simple-circle") {
    return <SimpleCircleNode {...props} />;
  }
  if (node.type === "pencil") {
    // Pencil nodes are transparent containers
    return <PencilNode {...props} />;
  }

  // 2. Handle Standard Nodes (Wrapped in Card)
  const renderContent = () => {
    switch (node.type) {
      case "section-header": return <SectionHeaderNode node={node} onUpdate={onUpdate} />;
      case "text-card": return <TextCardNode node={node} onUpdate={onUpdate} />;
      case "who-what-why": return <WhoWhatWhyNode node={node} onUpdate={onUpdate} />;
      case "sticky-note": return <StickyNoteNode node={node} onUpdate={onUpdate} />;
      case "hmw-card": return <HmwCardNode node={node} onUpdate={onUpdate} />;
      case "persona-card": return <PersonaCardNode node={node} onUpdate={onUpdate} />;
      case "user-flow": return <UserFlowNode node={node} onUpdate={onUpdate} />;
      case "checklist": return <ChecklistNode node={node} onUpdate={onUpdate} />;
      case "matrix": return <MatrixNode node={node} onUpdate={onUpdate} />;
      case "principle-card": return <PrincipleCardNode node={node} onUpdate={onUpdate} />;
      case "timeline": return <TimelineCardNode node={node} onUpdate={onUpdate} />;
      case "user-context-card": return <UserContextNode node={node} onUpdate={onUpdate} />;
      case "problem-brief": return <ProblemBriefNode node={node} onUpdate={onUpdate} />;
      case "problem-statement-guided": return <ProblemStatementGuidedNode node={node} onUpdate={onUpdate} />;
      case "user-context": return <UserContextNode node={node} onUpdate={onUpdate} />;
      case "success-metrics": return <SuccessMetricsNode node={node} onUpdate={onUpdate} />;
      case "crazy-8s": return <Crazy8sNode node={node} onUpdate={onUpdate} />;
      case "mobile-frame": return <MobileFrameNode {...props} />;
      case "ui-nav-bar": return <UiNavBarNode node={node} onUpdate={onUpdate} />;
      case "ui-card": return <UiCardNode node={node} onUpdate={onUpdate} />;
      case "ui-text-block": return <UiTextBlockNode node={node} onUpdate={onUpdate} />;
      case "ui-button": return <UiButtonNode node={node} onUpdate={onUpdate} />;
      case "flow-step": return <FlowStepNode node={node} onUpdate={onUpdate} />;
      case "clarifying-questions": return <ClarifyingQuestionsNode node={node} onUpdate={onUpdate} />;
      case "business-goals": return <BusinessGoalsNode node={node} onUpdate={onUpdate} />;
      case "prioritization-matrix": return <PrioritizationMatrixNode node={node} onUpdate={onUpdate} />;
      case "key-insights": return <KeyInsightsNode node={node} onUpdate={onUpdate} />;
      case "shape": return <ShapeNode node={node} onUpdate={onUpdate} />;

      // Legacy Mappings
      case "competitor-analysis": return <ChecklistNode node={node} onUpdate={onUpdate} />;
      case "brainstorm-list": return <ChecklistNode node={node} onUpdate={onUpdate} />;
      case "idea-voting": return <ChecklistNode node={node} onUpdate={onUpdate} />;
      case "usp-card": return <TextCardNode node={node} onUpdate={onUpdate} />;
      case "summary-card": return <TextCardNode node={node} onUpdate={onUpdate} />;
      case "wireframe-sketch": return <WireframeSketchNode node={node} onUpdate={onUpdate} />;
      case "jtbd-table": return <JtbdTableNode node={node} onUpdate={onUpdate} />;
      case "edge-case": return <EdgeCaseNode node={node} onUpdate={onUpdate} />;
      case "unsolved-problem": return <UnsolvedProblemNode node={node} onUpdate={onUpdate} />;

      // Session Mode (7-phase interview prep)
      case "brief-interrogation": return <BriefInterrogationNode node={node} onUpdate={onUpdate} />;
      case "working-assumption": return <WorkingAssumptionNode node={node} onUpdate={onUpdate} />;
      case "timeline-row": return <TimelineRowNode node={node} onUpdate={onUpdate} />;
      case "moment-of-truth": return <MomentOfTruthNode node={node} onUpdate={onUpdate} />;
      case "strategic-bet": return <StrategicBetNode node={node} onUpdate={onUpdate} />;
      case "copy-decision": return <CopyDecisionNode node={node} onUpdate={onUpdate} />;
      case "trigger-action-outcome": return <TriggerActionOutcomeNode node={node} onUpdate={onUpdate} />;
      case "thirty-day-arc": return <ThirtyDayArcNode node={node} onUpdate={onUpdate} />;
      case "entry-convergence": return <EntryConvergenceNode node={node} onUpdate={onUpdate} />;
      case "pushback-answer": return <PushbackAnswerNode node={node} onUpdate={onUpdate} />;
      case "vocabulary-sheet": return <VocabularySheetNode node={node} onUpdate={onUpdate} />;
      case "interviewer-lens": return <InterviewerLensNode node={node} onUpdate={onUpdate} />;
      case "self-score-checklist": return <SelfScoreChecklistNode node={node} onUpdate={onUpdate} />;

      default: return <div className="p-4 text-muted-foreground">Unknown component</div>;
    }
  };

  // 3. Naked nodes: bare content, no card chrome (PRD "Naked Canvas")
  if (NAKED_TYPES.has(node.type)) {
    return (
      <NakedNodeShell {...props} resizable={RESIZABLE_NAKED_TYPES.has(node.type)}>
        {renderContent()}
      </NakedNodeShell>
    );
  }

  // 4. Structured templates keep the card boundary
  return (
    <StandardCardWrapper {...props}>
      {renderContent()}
    </StandardCardWrapper>
  );
}
// `activateOn` defaults to "click" for nodes inside StandardCardWrapper, which are
// dragged by their header. Naked nodes are dragged by their body, so a single
// click there would drop into edit mode mid-drag — those pass "dblclick".
function InlineEdit({ value, onChange, className = "", multiline = false, placeholder = "Click to type...", activateOn = "click" }: {
  value: string; onChange: (v: string) => void; className?: string; multiline?: boolean; placeholder?: string;
  activateOn?: "click" | "dblclick";
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  // Grow the textarea to fit its content so it never scrolls inside the cell —
  // the card itself auto-grows (minHeight + height:auto), so the editor should too.
  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
      if (multiline) autoGrow(ref.current);
    }
  }, [editing]);

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as any}
          value={value}
          onChange={(e) => { onChange(e.target.value); autoGrow(e.target); }}
          onBlur={() => setEditing(false)}
          className={`w-full bg-white/60 border border-primary/20 rounded px-2 py-1 resize-none overflow-hidden focus:outline-none focus:border-primary/40 ${className}`}
          rows={1}
          onMouseDown={(e) => e.stopPropagation()}
        />
      );
    }
    return (
      <input
        ref={ref as any}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
        className={`w-full bg-white/60 border border-primary/20 rounded px-3 py-2 focus:outline-none focus:border-primary/40 ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      onClick={activateOn === "click" ? () => setEditing(true) : undefined}
      onDoubleClick={activateOn === "dblclick" ? () => setEditing(true) : undefined}
      className={`cursor-text rounded px-2 py-1 hover:bg-black/[0.03] transition-colors whitespace-pre-wrap ${activateOn === "dblclick" ? "select-none" : ""} ${className}`}
    >
      {value || <span className="text-muted-foreground/40 italic">{placeholder}</span>}
    </div>
  );
}

// ─── Problem Statement (guided) ──────────────────────────────────
// A structured "[user] needs a way to [needs] because [because]" builder with a
// live composed preview and collapsible writing tips. Distinct from the generic
// free-text `problem-brief`. Rendered naked (own white card + left accent) so it
// isn't double-wrapped by StandardCardWrapper's chrome.
const PROBLEM_STATEMENT_TIPS = [
  'Be specific about WHO — "a 28-year-old teacher in Chennai" beats "educators"',
  'The NEED should be a goal, not a feature — "plan tomorrow\'s commute in under 30 seconds" not "see a map"',
  "BECAUSE should be an insight from your diagnosis — reference what you learned in Phase 02",
  "A good problem statement should make the solution NOT obvious — if the answer is self-evident, the statement is too narrow",
  "Test it: could a competitor read this and build a completely different solution? If yes, it's at the right altitude",
];

function ProblemStatementGuidedNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const field = (
    key: "user" | "needs" | "because",
    label: string,
    placeholder: string
  ) => (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-0.5">
        {label}
      </div>
      <InlineEdit
        value={d[key] || ""}
        onChange={(v) => onUpdate({ ...d, [key]: v })}
        className="text-sm text-foreground"
        placeholder={placeholder}
        activateOn="dblclick"
        multiline
      />
    </div>
  );

  const part = (v: string | undefined) => (v && v.trim() ? v.trim() : "___");

  return (
    <div className="relative h-full flex flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-border border-l-[3px] border-l-primary">
      <div className="flex-1 p-4">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground leading-tight">Problem Statement</h3>
            <p className="mt-0.5 text-xs italic text-muted-foreground">
              Bridge your diagnosis into a single, specific problem worth solving.
            </p>
          </div>
        </div>

        {/* Fill-in-the-blank fields */}
        <div className="mt-4 space-y-2.5">
          {field("user", "[USER]", "Who specifically?")}
          {field("needs", "NEEDS A WAY TO", "What goal or need?")}
          {field("because", "BECAUSE", "What insight or barrier?")}
        </div>

        {/* Live composed preview — the anchor the user is building toward */}
        <div className="bg-primary/5 rounded-lg p-3 mt-3">
          <p className="text-sm italic text-foreground">
            {part(d.user)} needs a way to {part(d.needs)} because {part(d.because)}.
          </p>
        </div>

        {/* Collapsible writing tips */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onUpdate({ ...d, showTips: !d.showTips })}
          className="flex items-center gap-1.5 mt-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {d.showTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Writing tips
        </button>
        {d.showTips && (
          <div className="mt-1.5 pl-4 space-y-1">
            {PROBLEM_STATEMENT_TIPS.map((t, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-snug">· {t}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────
// A session ZONE marker, not a content card: a solid colored accent bar is the
// visual identity, the phase number is a large watermark, and a small pill
// carries the number next to the title. `min-h-full` fills a session node's
// fixed box when it's tall enough but GROWS past a short box instead of letting
// `overflow-hidden` clip the subtitle's bottom padding — so it stays correct for
// palette-dragged headers (auto height) and any legacy 80px session nodes alike.
function SectionHeaderNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="relative min-h-full overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Accent bar — the dominant element, colored from the session scaffold */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${d.color || "bg-primary"}`} />

      {/* Oversized watermark number — subtle decoration, never the focal point */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-[80px] font-bold leading-none text-foreground/[0.07] z-0">
        {d.number}
      </span>

      <div className="relative z-10 pt-5 pb-3 px-4">
        <div className="flex items-center gap-2.5">
          <Badge.Root variant="lighter" color="purple" size="medium" className="shrink-0 font-mono">
            {d.number}
          </Badge.Root>
          <InlineEdit
            value={d.title}
            onChange={(v) => onUpdate({ ...d, title: v })}
            className="text-xl font-semibold text-foreground"
            placeholder="Section title..."
            activateOn="dblclick"
          />
        </div>
        <InlineEdit
          value={d.subtitle}
          onChange={(v) => onUpdate({ ...d, subtitle: v })}
          className="text-sm text-muted-foreground mt-1"
          placeholder="Subtitle..."
          activateOn="dblclick"
        />
      </div>
    </div>
  );
}

// ─── Text Card ───────────────────────────────────────────────────
function TextCardNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="p-2">
      <InlineEdit
        value={d.label || ""}
        onChange={(v) => onUpdate({ ...d, label: v })}
        className="text-base text-muted-foreground mb-2"
        placeholder="Label..."
        activateOn="dblclick"
      />
      <InlineEdit
        value={d.text}
        onChange={(v) => onUpdate({ ...d, text: v })}
        className="text-md"
        multiline
        placeholder="Double-click to type..."
        activateOn="dblclick"
      />
    </div>
  );
}

// ─── Who / What / Why ────────────────────────────────────────────
function WhoWhatWhyNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const cards = [
    { key: "who", label: "Who", sub: "Who are we designing for?", bg: "bg-sky-50/60", border: "border-sky-200", topBar: "bg-sky-500", pill: "bg-sky-100", pillText: "text-sky-700", subText: "text-sky-600/60", icon: <Users className="w-3.5 h-3.5" /> },
    { key: "what", label: "What", sub: "What are we designing?", bg: "bg-violet-50/60", border: "border-violet-200", topBar: "bg-violet-500", pill: "bg-violet-100", pillText: "text-violet-700", subText: "text-violet-600/60", icon: <FileText className="w-3.5 h-3.5" /> },
    { key: "why", label: "Why", sub: "Why does this matter?", bg: "bg-amber-50/60", border: "border-amber-200", topBar: "bg-amber-500", pill: "bg-amber-100", pillText: "text-amber-700", subText: "text-amber-600/60", icon: <Target className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 p-2">
      {cards.map((c) => (
        <div key={c.key} className={`relative ${c.bg} ${c.border} border rounded-xl p-4 overflow-hidden`}>
          <div className={`absolute top-0 left-0 w-full h-1.5 ${c.topBar}`} />
          <div className="flex items-center gap-2 mb-2 pt-1">
            <span className={`w-8 h-8 rounded-full ${c.pill} flex items-center justify-center ${c.pillText} shrink-0`}>
              {c.icon}
            </span>
            <span className={`text-base ${c.pillText} tracking-wider uppercase font-bold`}>{c.label}</span>
          </div>
          <p className={`text-sm ${c.subText} mb-2`}>{c.sub}</p>
          <InlineEdit
            value={d[c.key]}
            onChange={(v) => onUpdate({ ...d, [c.key]: v })}
            className="text-base"
            multiline
          />
        </div>
      ))}
    </div>
  );
}

// ─── Sticky Note ─────────────────────────────────────────────────
const stickyColorMap: Record<string, string> = {
  yellow: "bg-yellow-100 border-yellow-200",
  blue: "bg-blue-100 border-blue-200",
  green: "bg-green-100 border-green-200",
  pink: "bg-pink-100 border-pink-200",
  purple: "bg-purple-100 border-purple-200",
  orange: "bg-orange-100 border-orange-200",
};

function StickyNoteNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const colors = stickyColorMap[d.color] || stickyColorMap.yellow;

  // FigJam model: click-drag moves the note, double-click enters edit. The
  // textarea covers nearly the whole note, so it must stay pointer-transparent
  // until editing — otherwise it swallows the mousedown and the note is only
  // draggable by its padding rim. New (empty) notes open straight into edit.
  const [editing, setEditing] = useState(!d.text);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  return (
    <div
      className={`p-4 rounded-xl border shadow-sm min-h-[140px] h-full ${colors}`}
      onDoubleClick={() => setEditing(true)}
    >
      <textarea
        ref={ref}
        value={d.text}
        readOnly={!editing}
        onChange={(e) => onUpdate({ ...d, text: e.target.value })}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setEditing(false);
            e.currentTarget.blur();
          }
        }}
        onMouseDown={(e) => { if (editing) e.stopPropagation(); }}
        className={`w-full bg-transparent resize-none focus:outline-none text-md min-h-[100px] leading-relaxed ${
          editing ? "cursor-text" : "pointer-events-none select-none"
        }`}
        placeholder="Double-click to type..."
      />
    </div>
  );
}

// ─── HMW Card ────────────────────────────────────────────────────
// ─── HMW Card ────────────────────────────────────────────────────
function HmwCardNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const items = d.items || [{ id: "1", text: d.statement || "How might we..." }];

  const updateItem = (id: string, text: string) => {
    onUpdate({
      ...d,
      items: items.map((i: any) => (i.id === id ? { ...i, text } : i)),
    });
  };

  const addItem = () => {
    onUpdate({
      ...d,
      items: [...items, { id: `hmw-${Date.now()}`, text: "" }],
    });
  };

  const removeItem = (id: string) => {
    onUpdate({
      ...d,
      items: items.filter((i: any) => i.id !== id),
    });
  };

  return (
    <div className="p-1">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--category-3-surface)" }}>💡</span>
        <span className="text-md font-semibold text-foreground">"How Might We" Statements</span>
      </div>
      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="group relative">
            <input
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-md text-foreground focus:outline-none transition-colors"
              style={{ background: "var(--category-3-surface-soft)", borderColor: "var(--category-3-border)" }}
              placeholder="How might we..."
              onMouseDown={(e) => e.stopPropagation()}
            />
            {items.length > 1 && (
              <button
                onClick={() => removeItem(item.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="mt-3 text-base text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-1.5 rounded hover:bg-secondary transition-colors"
      >
        <Plus className="w-4 h-4" /> Add HMW statement
      </button>
    </div>
  );
}

// ─── Persona Card ────────────────────────────────────────────────
function PersonaCardNode({ node, onUpdate }: NodeProps) {
  const d = node.data;

  const updateList = (key: string, index: number, value: string) => {
    const list = [...d[key]];
    list[index] = value;
    onUpdate({ ...d, [key]: list });
  };
  const removeFromList = (key: string, index: number) => {
    onUpdate({ ...d, [key]: d[key].filter((_: any, i: number) => i !== index) });
  };
  const addToList = (key: string) => {
    onUpdate({ ...d, [key]: [...d[key], ""] });
  };

  return (
    <div className="p-2">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
          <span className="text-xl">{d.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <InlineEdit value={d.name} onChange={(v) => onUpdate({ ...d, name: v })} className="text-lg font-semibold" placeholder="Name..." />
          <div className="flex gap-3">
            <InlineEdit value={d.role} onChange={(v) => onUpdate({ ...d, role: v })} className="text-base text-muted-foreground flex-1" placeholder="Role..." />
            <InlineEdit value={d.age} onChange={(v) => onUpdate({ ...d, age: v })} className="text-base text-muted-foreground w-20" placeholder="Age..." />
          </div>
        </div>
      </div>
      <InlineEdit value={d.bio} onChange={(v) => onUpdate({ ...d, bio: v })} className="text-base bg-secondary/30 rounded-xl mb-4 p-3 leading-relaxed" multiline placeholder="Bio..." />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm text-success tracking-wider uppercase mb-2 font-bold">Goals</h4>
          {d.goals.map((g: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5 mb-1 group/gi">
              <span className="text-success/80 text-base mt-0.5">+</span>
              <input value={g} onChange={(e) => updateList("goals", i, e.target.value)} className="bg-transparent focus:outline-none text-base flex-1 min-w-0" onMouseDown={(e) => e.stopPropagation()} />
              <button onClick={() => removeFromList("goals", i)} className="opacity-0 group-hover/gi:opacity-100 text-muted-foreground/40 hover:text-destructive p-1"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => addToList("goals")} className="text-sm text-muted-foreground hover:text-success flex items-center gap-1 mt-2 px-1 py-0.5 rounded hover:bg-success/10"><Plus className="w-3.5 h-3.5" />Add</button>
        </div>
        <div>
          <h4 className="text-sm text-destructive tracking-wider uppercase mb-2 font-bold">Pain Points</h4>
          {d.painPoints.map((p: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5 mb-1 group/pi">
              <span className="text-destructive/70 text-base mt-0.5">-</span>
              <input value={p} onChange={(e) => updateList("painPoints", i, e.target.value)} className="bg-transparent focus:outline-none text-base flex-1 min-w-0" onMouseDown={(e) => e.stopPropagation()} />
              <button onClick={() => removeFromList("painPoints", i)} className="opacity-0 group-hover/pi:opacity-100 text-muted-foreground/40 hover:text-destructive p-1"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => addToList("painPoints")} className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 mt-2 px-1 py-0.5 rounded hover:bg-destructive/10"><Plus className="w-3.5 h-3.5" />Add</button>
        </div>
      </div>
    </div>
  );
}



// ─── User Flow (compact) ─────────────────────────────────────────
type StepFlag = "none" | "pain" | "opportunity";
interface FlowStep { id: string; label: string; note: string; flag: StepFlag; }

const DEFAULT_FLOW: FlowStep[] = [
  { id: "s1", label: "Entry Point", note: "User arrives", flag: "none" },
  { id: "s2", label: "Sign Up", note: "Registration", flag: "none" },
  { id: "s3", label: "Onboarding", note: "Setup wizard", flag: "pain" },
  { id: "s4", label: "Core Action", note: "Primary task", flag: "none" },
  { id: "s5", label: "Value Moment", note: "First 'aha'", flag: "opportunity" },
];

function UserFlowNode({ node, onUpdate }: NodeProps) {
  const [steps, setSteps] = useState<FlowStep[]>(node.data.steps ?? DEFAULT_FLOW);

  const updateStep = (id: string, field: keyof FlowStep, value: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };
  const cycleFlag = (id: string) => {
    const flags: StepFlag[] = ["none", "pain", "opportunity"];
    setSteps((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      return { ...s, flag: flags[(flags.indexOf(s.flag) + 1) % 3] };
    }));
  };
  const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));
  const addStep = () => setSteps((prev) => [...prev, { id: `s-${Date.now()}`, label: "New Step", note: "", flag: "none" }]);

  return (
    <div className="p-2 space-y-3">
      {/* Compact pill flow */}
      <div className="flex items-center gap-2 flex-wrap py-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full border text-sm font-medium ${step.flag === "pain" ? "bg-destructive/5 border-destructive/20" :
              step.flag === "opportunity" ? "bg-success/5 border-success/20" :
                "bg-secondary border-border"
              }`}>{step.label}</span>
            {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/30" />}
          </div>
        ))}
      </div>

      {/* Step list */}
      {steps.map((step, i) => (
        <div key={step.id} className={`flex items-center gap-3 rounded-xl p-3 border text-base ${step.flag === "pain" ? "bg-destructive/5 border-destructive/20" :
          step.flag === "opportunity" ? "bg-success/5 border-success/20" :
            "bg-white border-border"
          } group/fs`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm border shrink-0 font-medium ${step.flag === "pain" ? "bg-destructive/10 border-destructive/20 text-destructive" :
            step.flag === "opportunity" ? "bg-success/10 border-success/20 text-success" :
              "bg-secondary border-border text-muted-foreground"
            }`}>{i + 1}</span>
          <input value={step.label} onChange={(e) => updateStep(step.id, "label", e.target.value)}
            className="bg-transparent focus:outline-none flex-1 min-w-0 text-md" onMouseDown={(e) => e.stopPropagation()} />
          <input value={step.note} onChange={(e) => updateStep(step.id, "note", e.target.value)}
            className="bg-transparent focus:outline-none text-muted-foreground w-36 text-base" placeholder="note..." onMouseDown={(e) => e.stopPropagation()} />
          <div className="flex gap-1 opacity-0 group-hover/fs:opacity-100 transition-opacity">
            <button onClick={() => cycleFlag(step.id)} className="p-1.5 rounded hover:bg-secondary" title="Toggle flag">
              {step.flag === "none" ? <AlertTriangle className="w-4 h-4 text-muted-foreground/40" /> :
                step.flag === "pain" ? <AlertTriangle className="w-4 h-4 text-destructive" /> :
                  <Zap className="w-4 h-4 text-success" />}
            </button>
            {steps.length > 2 && (
              <button onClick={() => removeStep(step.id)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      <button onClick={addStep} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground text-base w-full justify-center">
        <Plus className="w-4 h-4" /> Add Step
      </button>
    </div>
  );
}

// ─── Checklist ───────────────────────────────────────────────────
function ChecklistNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const items = d.items as { id: string; text: string; checked: boolean }[];

  const toggle = (id: string) => {
    onUpdate({ ...d, items: items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item) });
  };
  const updateText = (id: string, text: string) => {
    onUpdate({ ...d, items: items.map((item) => item.id === id ? { ...item, text } : item) });
  };
  const remove = (id: string) => {
    onUpdate({ ...d, items: items.filter((item) => item.id !== id) });
  };
  const add = () => {
    onUpdate({ ...d, items: [...items, { id: `c-${Date.now()}`, text: "", checked: false }] });
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-3">
        <InlineEdit value={d.title} onChange={(v) => onUpdate({ ...d, title: v })} className="text-md font-medium" placeholder="Title..." />
        <span className="text-sm text-muted-foreground">{checkedCount}/{items.length}</span>
      </div>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-1.5 group/ci">
          <button onClick={() => toggle(item.id)} className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${item.checked ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
            {item.checked && <span className="text-sm">✓</span>}
          </button>
          <input value={item.text} onChange={(e) => updateText(item.id, e.target.value)}
            className={`bg-transparent focus:outline-none text-md flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}
            placeholder="Item..." onMouseDown={(e) => e.stopPropagation()} />
          <button onClick={() => remove(item.id)} className="opacity-0 group-hover/ci:opacity-100 text-muted-foreground/40 hover:text-destructive p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={add} className="text-base text-muted-foreground hover:text-foreground flex items-center gap-2 mt-3 p-1">
        <Plus className="w-4 h-4" /> Add item
      </button>
    </div>
  );
}

// ─── 2×2 Matrix ──────────────────────────────────────────────────
// ─── 2×2 Matrix ──────────────────────────────────────────────────
function MatrixNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const quadrants = [
    { key: "topLeft", label: "High Impact / Low Effort", bg: "bg-[var(--category-1-surface)]", border: "border-[var(--category-1-border)]", text: "text-[var(--category-1-text)]" },
    { key: "topRight", label: "High Impact / High Effort", bg: "bg-[var(--category-2-surface)]", border: "border-[var(--category-2-border)]", text: "text-[var(--category-2-text)]" },
    { key: "bottomLeft", label: "Low Impact / Low Effort", bg: "bg-[var(--category-3-surface)]", border: "border-[var(--category-3-border)]", text: "text-[var(--category-3-text)]" },
    { key: "bottomRight", label: "Low Impact / High Effort", bg: "bg-[var(--category-4-surface)]", border: "border-[var(--category-4-border)]", text: "text-[var(--category-4-text)]" },
  ];

  const items = d.items || []; // Array of { id, text, quadrant }

  const addItem = (quadrant: string) => {
    onUpdate({
      ...d,
      items: [...items, { id: `m-${Date.now()}`, text: "", quadrant }],
    });
  };

  const updateItem = (id: string, text: string) => {
    onUpdate({
      ...d,
      items: items.map((i: any) => (i.id === id ? { ...i, text } : i)),
    });
  };

  const removeItem = (id: string) => {
    onUpdate({
      ...d,
      items: items.filter((i: any) => i.id !== id),
    });
  };

  return (
    <div className="p-2">
      <div className="text-base font-medium text-muted-foreground mb-3 px-1">Solution Prioritization (Impact vs. Effort)</div>
      <div className="grid grid-cols-2 gap-3 h-full">
        {quadrants.map((q) => (
          <div key={q.key} className={`${q.bg} ${q.border} border rounded-2xl p-4 flex flex-col min-h-[200px]`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${q.text}`}>{q.label}</div>
            <div className="flex-1 space-y-3">
              {items.filter((i: any) => i.quadrant === q.key).map((item: any) => (
                <div key={item.id} className="group relative">
                  <textarea
                    value={item.text}
                    onChange={(e) => updateItem(item.id, e.target.value)}
                    className="w-full bg-white/50 hover:bg-white border border-transparent focus:border-black/5 rounded-lg px-3 py-2 text-base resize-none focus:outline-none transition-colors shadow-sm"
                    rows={2}
                    placeholder="Type idea..."
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 border shadow-sm text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addItem(q.key)}
              className="mt-3 self-start text-sm bg-white/50 hover:bg-white border border-black/5 rounded-lg px-3 py-1.5 text-muted-foreground transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Design Principle ────────────────────────────────────────────
function PrincipleCardNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className={`p-5 rounded-xl border ${d.color || "bg-surface-subtle border-border"}`}>
      <InlineEdit value={d.title} onChange={(v) => onUpdate({ ...d, title: v })} className="text-lg mb-2 font-semibold text-foreground" placeholder="Principle name..." />
      <InlineEdit value={d.description} onChange={(v) => onUpdate({ ...d, description: v })} className="text-base text-muted-foreground leading-relaxed" multiline placeholder="Describe..." />
    </div>
  );
}



// ─── Problem Brief ───────────────────────────────────────────────
function ProblemBriefNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="p-1">
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <FileText className="w-4 h-4" />
        </span>
        <span className="text-md font-semibold text-foreground">Problem Brief</span>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1.5 block">Context</label>
          <InlineEdit value={d.context} onChange={(v) => onUpdate({ ...d, context: v })} className="text-base min-h-[60px]" multiline placeholder="What is the context?" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1.5 block">Problem Statement</label>
          <InlineEdit value={d.problem} onChange={(v) => onUpdate({ ...d, problem: v })} className="text-base min-h-[60px]" multiline placeholder="What is the core problem?" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1.5 block">Goals</label>
          <InlineEdit value={d.goals} onChange={(v) => onUpdate({ ...d, goals: v })} className="text-base min-h-[60px]" multiline placeholder="What does success look like?" />
        </div>
      </div>
    </div>
  );
}

// ─── Success Metrics ─────────────────────────────────────────────
function SuccessMetricsNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const metrics = d.metrics || [];

  const updateMetric = (id: string, field: string, value: string) => {
    onUpdate({ ...d, metrics: metrics.map((m: any) => m.id === id ? { ...m, [field]: value } : m) });
  };
  const addMetric = () => {
    onUpdate({ ...d, metrics: [...metrics, { id: `m-${Date.now()}`, label: "New Metric", value: "0", target: "100" }] });
  };

  return (
    <div className="p-1">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--success) 12%, transparent)", color: "var(--success)" }}>
          <Target className="w-4 h-4" />
        </span>
        <span className="text-md font-semibold text-foreground">Success Metrics</span>
      </div>
      <div className="space-y-2">
        {metrics.map((m: any) => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-subtle border border-border">
            <div className="flex-1 min-w-0">
              <input value={m.label} onChange={(e) => updateMetric(m.id, "label", e.target.value)}
                className="bg-transparent font-medium text-base w-full focus:outline-none text-foreground" placeholder="Metric Name" onMouseDown={(e) => e.stopPropagation()} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Current</span>
                <input value={m.value} onChange={(e) => updateMetric(m.id, "value", e.target.value)}
                  className="bg-surface border border-border rounded-md px-1.5 py-0.5 text-sm w-16 text-right tabular-nums focus:outline-none" onMouseDown={(e) => e.stopPropagation()} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Target</span>
                <input value={m.target} onChange={(e) => updateMetric(m.id, "target", e.target.value)}
                  className="bg-surface border border-border rounded-md px-1.5 py-0.5 text-sm w-16 text-right font-semibold tabular-nums focus:outline-none" style={{ color: "var(--success)" }} onMouseDown={(e) => e.stopPropagation()} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addMetric} className="w-full py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-border/80 flex items-center justify-center gap-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Metric
        </button>
      </div>
    </div>
  );
}



// ─── User Context (List) ─────────────────────────────────────────
// Priority segments carry a light sentiment ranking (primary → tertiary), so
// they ramp through the ONE accent at decreasing strength rather than three
// unrelated hues — quiet, disciplined, Untitled-UI style.
const USER_PRIORITY_CYCLE = ["Primary", "Secondary", "Tertiary"] as const;
const USER_PRIORITY_STYLE: Record<string, string> = {
  Primary: "bg-primary/10 text-primary border-primary/20",
  Secondary: "bg-primary/[0.06] text-primary/80 border-primary/15",
  Tertiary: "bg-muted text-muted-foreground border-border",
};

function UserContextNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const users = d.users || [];

  const updateUser = (id: string, field: string, value: string) => {
    onUpdate({ ...d, users: users.map((u: any) => u.id === id ? { ...u, [field]: value } : u) });
  };
  const cyclePriority = (id: string, current: string) => {
    const next = USER_PRIORITY_CYCLE[(USER_PRIORITY_CYCLE.indexOf(current as any) + 1) % USER_PRIORITY_CYCLE.length];
    updateUser(id, "count", next);
  };
  const removeUser = (id: string) => onUpdate({ ...d, users: users.filter((u: any) => u.id !== id) });
  const addUser = () => onUpdate({ ...d, users: [...users, { id: `u-${Date.now()}`, name: "New User", count: "Secondary" }] });

  return (
    <div className="p-1">
      {/* Eyebrow header — icon chip + title + subtitle, shared card language */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Users className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <div className="text-md font-semibold text-foreground leading-tight">User Context</div>
          <div className="text-xs text-muted-foreground">Who we are designing for</div>
        </div>
      </div>

      <div className="space-y-2">
        {users.map((u: any) => {
          const priority = USER_PRIORITY_STYLE[u.count] ? u.count : "Secondary";
          const initial = (u.name || "?").trim().charAt(0).toUpperCase();
          return (
            <div key={u.id} className="group/uc flex items-center gap-3 p-2.5 rounded-lg bg-surface-subtle border border-border hover:border-border/80 transition-colors">
              <span className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                {initial}
              </span>
              <input value={u.name} onChange={(e) => updateUser(u.id, "name", e.target.value)}
                className="bg-transparent text-base font-medium text-foreground flex-1 min-w-0 focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="User group…" onMouseDown={(e) => e.stopPropagation()} />
              <button
                onClick={() => cyclePriority(u.id, priority)}
                onMouseDown={(e) => e.stopPropagation()}
                className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium border capitalize transition-colors ${USER_PRIORITY_STYLE[priority]}`}
                title="Click to change priority"
              >
                {priority}
              </button>
              <button
                onClick={() => removeUser(u.id)}
                onMouseDown={(e) => e.stopPropagation()}
                className="shrink-0 opacity-0 group-hover/uc:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        <button onClick={addUser} className="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add user group
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Session Mode — 7-phase interview prep components
// All carded (dispatched through StandardCardWrapper). Category colours
// come from the --category-N-* token ramp in canvas-tokens.css:
//   1 green · 2 blue(indigo) · 3 yellow(amber) · 4 red(rose) · 5 purple(violet) · 6 orange
// ══════════════════════════════════════════════════════════════════

const catSurface = (n: number): React.CSSProperties => ({
  background: `var(--category-${n}-surface)`,
  borderColor: `var(--category-${n}-border)`,
});
const catText = (n: number): React.CSSProperties => ({ color: `var(--category-${n}-text)` });

// ─── Brief Interrogation ─────────────────────────────────────────
function BriefInterrogationNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const constraints: string[] = d.constraints || [];
  const updateConstraint = (i: number, v: string) =>
    onUpdate({ ...d, constraints: constraints.map((c, idx) => (idx === i ? v : c)) });
  const addConstraint = () => onUpdate({ ...d, constraints: [...constraints, ""] });
  const removeConstraint = (i: number) =>
    onUpdate({ ...d, constraints: constraints.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col h-full p-1">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border" style={catSurface(2)}>
          <Search className="w-4 h-4" style={catText(2)} />
        </span>
        <span className="text-md font-semibold text-foreground">Brief Interrogation</span>
      </div>

      <div className="rounded-xl border border-border bg-surface-muted p-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">The brief</span>
        <InlineEdit value={d.prompt} onChange={(v) => onUpdate({ ...d, prompt: v })} className="text-base text-foreground mt-1" multiline placeholder="Paste the prompt you were given…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3" style={catSurface(1)}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={catText(1)}>What is asked</span>
          <InlineEdit value={d.what_is_asked} onChange={(v) => onUpdate({ ...d, what_is_asked: v })} className="text-sm text-foreground mt-1" multiline placeholder="The real ask…" />
        </div>
        <div className="rounded-lg border p-3" style={catSurface(4)}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={catText(4)}>What is NOT asked</span>
          <InlineEdit value={d.what_is_NOT_asked} onChange={(v) => onUpdate({ ...d, what_is_NOT_asked: v })} className="text-sm text-foreground mt-1" multiline placeholder="Out of scope…" />
        </div>
        <div className="rounded-lg border p-3" style={catSurface(3)}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={catText(3)}>Constraints</span>
          <div className="mt-1.5 space-y-1">
            {constraints.map((c, i) => (
              <div key={i} className="group/c flex items-start gap-1.5">
                <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--category-3-text)" }} />
                <InlineEdit value={c} onChange={(v) => updateConstraint(i, v)} className="flex-1 text-sm text-foreground" placeholder="Constraint…" />
                <button onClick={() => removeConstraint(i)} onMouseDown={(e) => e.stopPropagation()} className="shrink-0 opacity-0 group-hover/c:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addConstraint} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
        <div className="rounded-lg border p-3" style={catSurface(2)}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={catText(2)}>Success looks like</span>
          <InlineEdit value={d.success_looks_like} onChange={(v) => onUpdate({ ...d, success_looks_like: v })} className="text-sm text-foreground mt-1" multiline placeholder="Done when…" />
        </div>
      </div>
    </div>
  );
}

// ─── Working Assumption ──────────────────────────────────────────
function WorkingAssumptionNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="h-full pl-3 border-l-4" style={{ borderColor: "var(--category-3-border-strong)" }}>
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="w-4 h-4" style={catText(3)} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={catText(3)}>Working Assumption</span>
      </div>
      <p className="text-xs text-muted-foreground italic mb-2">State one hypothesis you're operating on. You'll revisit this at the end.</p>
      <InlineEdit value={d.assumption} onChange={(v) => onUpdate({ ...d, assumption: v })} className="text-lg font-medium text-foreground leading-snug" multiline placeholder="I'm assuming that…" />
      <div className="border-t border-border my-3" />
      <div className="space-y-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Because</span>
          <InlineEdit value={d.because} onChange={(v) => onUpdate({ ...d, because: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="…the reasoning is" />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">I'll validate by</span>
          <InlineEdit value={d.validate_by} onChange={(v) => onUpdate({ ...d, validate_by: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="…how I'll test it" />
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Row (horizontal journey strip) ─────────────────────
const TIMELINE_EMOTIONS = ["positive", "neutral", "negative"];
const TIMELINE_EMOTION_DOT: Record<string, string> = {
  positive: "bg-success",
  neutral: "bg-muted-foreground/40",
  negative: "bg-destructive",
};
function TimelineRowNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const stages: any[] = d.stages || [];
  const update = (id: string, field: string, v: string) =>
    onUpdate({ ...d, stages: stages.map((s) => (s.id === id ? { ...s, [field]: v } : s)) });
  const cycleEmotion = (id: string) => {
    const s = stages.find((x) => x.id === id);
    const next = TIMELINE_EMOTIONS[(TIMELINE_EMOTIONS.indexOf(s?.emotion) + 1) % 3];
    update(id, "emotion", next);
  };
  const addStage = () =>
    onUpdate({ ...d, stages: [...stages, { id: `s-${Date.now()}`, label: "Stage", emotion: "neutral", note: "" }] });
  const removeStage = (id: string) =>
    onUpdate({ ...d, stages: stages.filter((s) => s.id !== id) });

  return (
    <div className="h-full flex flex-col p-1">
      <InlineEdit value={d.title} onChange={(v) => onUpdate({ ...d, title: v })} className="text-md font-semibold text-foreground mb-2" placeholder="Journey title" />
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-start gap-1">
          {stages.map((s) => (
            <div key={s.id} className="group/st flex flex-col items-center text-center px-1" style={{ minWidth: 130, flex: 1 }}>
              <InlineEdit value={s.label} onChange={(v) => update(s.id, "label", v)} className="text-sm font-semibold text-foreground" placeholder="Stage" />
              <div className="relative w-full h-6 flex items-center justify-center my-1">
                <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
                <button onClick={() => cycleEmotion(s.id)} onMouseDown={(e) => e.stopPropagation()} title="Click to change emotion" className={`relative z-10 w-4 h-4 rounded-full border-2 border-white shadow-sm ${TIMELINE_EMOTION_DOT[s.emotion] || TIMELINE_EMOTION_DOT.neutral}`} />
              </div>
              <InlineEdit value={s.note} onChange={(v) => update(s.id, "note", v)} className="text-xs text-muted-foreground w-full" multiline placeholder="Note…" />
              <button onClick={() => removeStage(s.id)} onMouseDown={(e) => e.stopPropagation()} className="mt-1 opacity-0 group-hover/st:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addStage} className="shrink-0 self-center flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors">
            <Plus className="w-4 h-4" /> Stage
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Moment of Truth ─────────────────────────────────────────────
const MOT_EMOTION_CAT: Record<string, number> = { delight: 1, frustration: 4, confusion: 3, relief: 2 };
function MomentOfTruthNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const cat = MOT_EMOTION_CAT[d.emotion] || 3;
  return (
    <div className="h-full p-1">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" style={catText(cat)} />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Moment of Truth</span>
        </div>
        <select
          value={d.emotion}
          onChange={(e) => onUpdate({ ...d, emotion: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-xs font-medium capitalize rounded-md border px-2 py-0.5 focus:outline-none"
          style={{ ...catSurface(cat), ...catText(cat) }}
        >
          <option value="delight">Delight</option>
          <option value="frustration">Frustration</option>
          <option value="confusion">Confusion</option>
          <option value="relief">Relief</option>
        </select>
      </div>
      <p className="text-xs text-muted-foreground italic mb-2">The one interaction that defines whether the product succeeds or fails for this user.</p>
      <InlineEdit value={d.moment} onChange={(v) => onUpdate({ ...d, moment: v })} className="text-base font-medium text-foreground leading-snug" multiline placeholder="The single make-or-break moment…" />
      <div className="mt-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why critical</span>
        <InlineEdit value={d.why_critical} onChange={(v) => onUpdate({ ...d, why_critical: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="What's at stake here…" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-lg border p-2.5" style={catSurface(4)}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={catText(4)}>Current</span>
          <InlineEdit value={d.current_experience} onChange={(v) => onUpdate({ ...d, current_experience: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="Today…" />
        </div>
        <div className="rounded-lg border p-2.5" style={catSurface(1)}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={catText(1)}>Ideal</span>
          <InlineEdit value={d.ideal_experience} onChange={(v) => onUpdate({ ...d, ideal_experience: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="Instead…" />
        </div>
      </div>
    </div>
  );
}

// ─── Strategic Bet ───────────────────────────────────────────────
function StrategicBetNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const rows = [
    { label: "We believe", key: "we_believe", multiline: false },
    { label: "For", key: "for_user", multiline: false },
    { label: "Will achieve", key: "will_achieve", multiline: false },
    { label: "Because", key: "because", multiline: true },
  ];
  return (
    <div className="h-full pl-3 border-l-4" style={{ borderColor: "var(--category-5-border-strong)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-4 h-4" style={catText(5)} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={catText(5)}>Strategic Bet</span>
      </div>
      <p className="text-xs text-muted-foreground italic mb-3">Commit to a single direction before you start designing.</p>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.key}>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.label}</span>
            <InlineEdit value={d[r.key]} onChange={(v) => onUpdate({ ...d, [r.key]: v })} className="text-base text-foreground" multiline={r.multiline} placeholder="…" />
          </div>
        ))}
        <div className="rounded-lg border p-2.5 mt-1" style={catSurface(4)}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={catText(4)}>Riskiest assumption</span>
          <InlineEdit value={d.riskiest_assumption} onChange={(v) => onUpdate({ ...d, riskiest_assumption: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="The thing most likely to be wrong…" />
        </div>
      </div>
    </div>
  );
}

// ─── Copy Decision ───────────────────────────────────────────────
function CopyDecisionNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="h-full p-1">
      <div className="mb-2">
        <span className="inline-flex items-center rounded bg-muted text-muted-foreground text-xs font-medium uppercase tracking-wide px-1.5 py-0.5">
          UI Copy Spec
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4" style={catText(2)} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Copy Decision</span>
      </div>
      <div className="inline-flex items-center rounded-md border px-2 py-0.5 mb-3" style={{ ...catSurface(2), ...catText(2) }}>
        <InlineEdit value={d.screen_moment} onChange={(v) => onUpdate({ ...d, screen_moment: v })} className="text-xs font-medium" placeholder="Which screen / state" />
      </div>
      <InlineEdit value={d.headline} onChange={(v) => onUpdate({ ...d, headline: v })} className="text-xl font-semibold text-foreground leading-snug" multiline placeholder="The headline users read" />
      <div className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CTA</span>
        <div className="mt-1 inline-flex items-center rounded-lg bg-primary text-primary-foreground px-4 py-2 shadow-sm">
          <InlineEdit value={d.cta_text} onChange={(v) => onUpdate({ ...d, cta_text: v })} className="text-sm font-medium" placeholder="Button label" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Microcopy</span>
        <InlineEdit value={d.microcopy} onChange={(v) => onUpdate({ ...d, microcopy: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="Supporting text…" />
      </div>
      <div className="mt-3 pt-2 border-t border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this copy</span>
        <InlineEdit value={d.why_this_copy} onChange={(v) => onUpdate({ ...d, why_this_copy: v })} className="text-sm text-muted-foreground italic mt-0.5" multiline placeholder="Rationale…" />
      </div>
    </div>
  );
}

// ─── Trigger → Action → Outcome ──────────────────────────────────
function TriggerActionOutcomeNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const cols = [
    { key: "trigger", label: "Trigger", cat: 3, hint: "What prompts the user?" },
    { key: "action", label: "Action", cat: 2, hint: "What does the user do?" },
    { key: "outcome", label: "Outcome", cat: 1, hint: "What changes for them?" },
  ];
  const parts: React.ReactNode[] = [];
  cols.forEach((c, i) => {
    parts.push(
      <div key={c.key} className="flex-1 rounded-lg border p-3 flex flex-col" style={catSurface(c.cat)}>
        <span className="text-xs font-semibold uppercase tracking-wide" style={catText(c.cat)}>{c.label}</span>
        <span className="text-xs text-muted-foreground mb-1.5">{c.hint}</span>
        <InlineEdit value={d[c.key]} onChange={(v) => onUpdate({ ...d, [c.key]: v })} className="text-sm text-foreground flex-1" multiline placeholder={`${c.label}…`} />
      </div>
    );
    if (i < cols.length - 1) {
      parts.push(
        <div key={`${c.key}-arrow`} className="flex items-center px-1 text-muted-foreground/50">
          <ArrowRight className="w-4 h-4" />
        </div>
      );
    }
  });
  return (
    <div className="h-full p-1">
      <p className="text-xs text-muted-foreground italic mb-3">Map a single behaviour loop — what sparks the action, what the user does, and what changes as a result.</p>
      <div className="flex items-stretch">{parts}</div>
      <div className="mt-3 flex items-start gap-2">
        <button
          onClick={() => onUpdate({ ...d, loop_back: !d.loop_back })}
          onMouseDown={(e) => e.stopPropagation()}
          className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${d.loop_back ? "bg-primary border-primary text-primary-foreground" : "border-border bg-surface"}`}
        >
          {d.loop_back && <Check className="w-3 h-3" />}
        </button>
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Loops back ↺</span>
          {d.loop_back ? (
            <InlineEdit value={d.loop_text} onChange={(v) => onUpdate({ ...d, loop_text: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="How does the outcome trigger the loop again?" />
          ) : (
            <p className="text-xs text-muted-foreground italic mt-0.5">Does this outcome trigger the cycle again?</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 30-Day Arc ──────────────────────────────────────────────────
function ThirtyDayArcNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const milestones: any[] = d.milestones || [];
  const cats = [2, 3, 5, 1];
  const update = (id: string, field: string, v: string) =>
    onUpdate({ ...d, milestones: milestones.map((m) => (m.id === id ? { ...m, [field]: v } : m)) });
  return (
    <div className="h-full w-full overflow-hidden p-1">
      <InlineEdit value={d.title} onChange={(v) => onUpdate({ ...d, title: v })} className="text-md font-semibold text-foreground mb-3" placeholder="Arc title" />
      <div className="flex flex-row items-stretch gap-3 w-full">
        {milestones.map((m, i) => (
          <div key={m.id} className="flex-1 min-w-0 flex flex-col">
            <div className="relative h-6 flex items-center mb-1">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
              <span className="relative z-10 w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0" style={{ background: `var(--category-${cats[i]})` }} />
              <div className="relative z-10 ml-2 rounded px-1 bg-white/80" style={catText(cats[i])}>
                <InlineEdit value={m.day_label} onChange={(v) => update(m.id, "day_label", v)} className="text-xs font-bold" placeholder="Day" />
              </div>
            </div>
            <div className="rounded-lg border p-2.5 flex-1" style={catSurface(cats[i])}>
              <InlineEdit value={m.headline} onChange={(v) => update(m.id, "headline", v)} className="text-sm font-medium text-foreground" multiline placeholder="User achieves…" />
              <div className="mt-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</span>
                <InlineEdit value={m.action} onChange={(v) => update(m.id, "action", v)} className="text-xs text-foreground" multiline placeholder="Does…" />
              </div>
              <div className="mt-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feels</span>
                <InlineEdit value={m.feel} onChange={(v) => update(m.id, "feel", v)} className="text-xs text-foreground" placeholder="Emotion" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Entry Convergence ───────────────────────────────────────────
function EntryConvergenceNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const entries: any[] = d.entry_points || [];
  const update = (id: string, field: string, v: string) =>
    onUpdate({ ...d, entry_points: entries.map((e) => (e.id === id ? { ...e, [field]: v } : e)) });
  const addEntry = () => {
    if (entries.length >= 5) return;
    onUpdate({ ...d, entry_points: [...entries, { id: `e-${Date.now()}`, channel: "", description: "" }] });
  };
  const removeEntry = (id: string) => onUpdate({ ...d, entry_points: entries.filter((e) => e.id !== id) });
  return (
    <div className="h-full p-1">
      <div className="flex items-center gap-2 mb-3">
        <GitMerge className="w-4 h-4" style={catText(2)} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entry Convergence</span>
      </div>
      <div className="flex items-stretch gap-3">
        <div className="flex-1 space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="group/e flex items-center gap-1.5">
              <div className="flex-1 rounded-lg border border-border bg-surface-subtle p-2">
                <InlineEdit value={e.channel} onChange={(v) => update(e.id, "channel", v)} className="text-sm font-medium text-foreground" placeholder="Channel" />
                <InlineEdit value={e.description} onChange={(v) => update(e.id, "description", v)} className="text-xs text-muted-foreground" placeholder="Description" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <button onClick={() => removeEntry(e.id)} onMouseDown={(e2) => e2.stopPropagation()} className="shrink-0 opacity-0 group-hover/e:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {entries.length < 5 && (
            <button onClick={addEntry} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Plus className="w-3.5 h-3.5" /> Add entry point
            </button>
          )}
        </div>
        <div className="w-40 shrink-0 flex items-center">
          <div className="w-full rounded-xl border-2 p-3 text-center" style={{ ...catSurface(2), borderColor: "var(--category-2-border-strong)" }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={catText(2)}>Core action</span>
            <InlineEdit value={d.core_action} onChange={(v) => onUpdate({ ...d, core_action: v })} className="text-base font-semibold text-foreground mt-1" multiline placeholder="The one thing" />
          </div>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why they converge</span>
        <InlineEdit value={d.convergence_note} onChange={(v) => onUpdate({ ...d, convergence_note: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="What makes them all land here" />
      </div>
    </div>
  );
}

// ─── Pushback + Answer ───────────────────────────────────────────
const PUSHBACK_CONFIDENCE = ["high", "medium", "low"];
function pushbackConfidenceBadge(c: string): { cls: string; style: React.CSSProperties } {
  if (c === "high") return { cls: "bg-success/10 text-success border-success/30", style: {} };
  if (c === "low") return { cls: "bg-destructive/10 text-destructive border-destructive/30", style: {} };
  return { cls: "border", style: { ...catSurface(3), ...catText(3) } };
}
function PushbackAnswerNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const pushbacks: any[] = d.pushbacks || [];
  const update = (id: string, field: string, v: string) =>
    onUpdate({ ...d, pushbacks: pushbacks.map((p) => (p.id === id ? { ...p, [field]: v } : p)) });
  const cycleConf = (id: string, cur: string) => {
    const next = PUSHBACK_CONFIDENCE[(PUSHBACK_CONFIDENCE.indexOf(cur) + 1) % 3];
    update(id, "confidence", next);
  };
  const add = () => onUpdate({ ...d, pushbacks: [...pushbacks, { id: `p-${Date.now()}`, objection: "", answer: "", confidence: "medium" }] });
  const remove = (id: string) => onUpdate({ ...d, pushbacks: pushbacks.filter((p) => p.id !== id) });
  return (
    <div className="h-full flex flex-col p-1">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-md font-semibold text-foreground">Pushback + Answer</span>
      </div>
      <p className="text-xs text-muted-foreground italic mb-3">Anticipate the hardest question the interviewer will ask.</p>
      <div className="flex-1 space-y-2">
        {pushbacks.map((p) => {
          const b = pushbackConfidenceBadge(p.confidence);
          return (
            <div key={p.id} className="grid grid-cols-2 rounded-lg border border-border overflow-hidden">
              <div className="group/p relative p-2.5 bg-surface-muted border-r border-border">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objection</span>
                <InlineEdit value={p.objection} onChange={(v) => update(p.id, "objection", v)} className="text-sm text-foreground mt-0.5" multiline placeholder="They'll say…" />
                <button onClick={() => remove(p.id)} onMouseDown={(e) => e.stopPropagation()} className="absolute top-1 right-1 opacity-0 group-hover/p:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2.5 bg-surface">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Answer</span>
                  <button onClick={() => cycleConf(p.id, p.confidence)} onMouseDown={(e) => e.stopPropagation()} title="Cycle confidence" className={`rounded-md px-1.5 py-0.5 text-xs font-medium capitalize ${b.cls}`} style={b.style}>
                    {p.confidence}
                  </button>
                </div>
                <InlineEdit value={p.answer} onChange={(v) => update(p.id, "answer", v)} className="text-sm text-foreground mt-0.5" multiline placeholder="You'll answer…" />
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={add} className="mt-2 flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm">
        <Plus className="w-4 h-4" /> Add pushback
      </button>
    </div>
  );
}

// ─── JTBD Table ──────────────────────────────────────────────────
// A table mapping each job the user "hires" the product to do across its
// functional / emotional / social dimensions. The three job columns carry a
// subtle tint (teal / violet / amber) so the dimensions read at a glance; the
// tints use the same 8%-mix-with-white formula as the --category-N-surface
// tokens, but category tokens don't include a teal, so the hues are inlined here.
const JTBD_COLUMNS: { key: string; label: string; hint: string; tint: string | null }[] = [
  { key: "situation", label: "Situation", hint: "When I…", tint: null },
  { key: "functional", label: "Functional Job", hint: "I want to…", tint: "#14b8a6" },
  { key: "emotional", label: "Emotional Job", hint: "So I feel…", tint: "#8b5cf6" },
  { key: "social", label: "Social Job", hint: "And appear…", tint: "#f59e0b" },
  { key: "outcome", label: "Desired Outcome", hint: "The win…", tint: null },
];

function jtbdCellStyle(tint: string | null): React.CSSProperties {
  return tint ? { background: `color-mix(in srgb, ${tint} 8%, #fff)` } : {};
}

function JtbdTableNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const jobs: any[] = d.jobs || [];
  const update = (id: string, field: string, v: string) =>
    onUpdate({ ...d, jobs: jobs.map((j) => (j.id === id ? { ...j, [field]: v } : j)) });
  const add = () =>
    onUpdate({
      ...d,
      jobs: [...jobs, { id: `j-${Date.now()}`, situation: "", functional: "", emotional: "", social: "", outcome: "" }],
    });
  const remove = (id: string) => onUpdate({ ...d, jobs: jobs.filter((j) => j.id !== id) });

  return (
    <div className="h-full flex flex-col p-1">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardList className="w-4 h-4 text-primary" />
        <span className="text-md font-semibold text-foreground">Jobs to Be Done</span>
      </div>
      <p className="text-xs text-muted-foreground italic mb-3">
        Map what the user is hiring your product to do — functional, emotional, and social dimensions.
      </p>
      <div className="flex-1">
        {/* Column headers */}
        <div className="grid grid-cols-5 gap-1 mb-1">
          {JTBD_COLUMNS.map((c) => (
            <div key={c.key} className="px-2 py-1 rounded-md" style={jtbdCellStyle(c.tint)}>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
            </div>
          ))}
        </div>
        {/* Job rows */}
        <div className="space-y-1">
          {jobs.map((j) => (
            <div key={j.id} className="group/j relative grid grid-cols-5 gap-1">
              {JTBD_COLUMNS.map((c) => (
                <div key={c.key} className="px-1.5 py-1 rounded-md border border-border/60" style={jtbdCellStyle(c.tint)}>
                  <InlineEdit
                    value={j[c.key] || ""}
                    onChange={(v) => update(j.id, c.key, v)}
                    className="text-sm text-foreground"
                    placeholder={c.hint}
                    multiline
                  />
                </div>
              ))}
              <button
                onClick={() => remove(j.id)}
                onMouseDown={(e) => e.stopPropagation()}
                title="Remove job"
                className="absolute -top-1.5 -right-1.5 opacity-0 group-hover/j:opacity-100 rounded-full bg-white border border-border shadow-sm p-0.5 text-muted-foreground/50 hover:text-destructive transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <button onClick={add} className="mt-2 flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm">
        <Plus className="w-4 h-4" /> Add job
      </button>
    </div>
  );
}

// ─── Edge Case ───────────────────────────────────────────────────
const EDGE_SEVERITIES = ["low", "medium", "high"];
// Severity → AlignUI Badge color. low = green, medium = orange (warning), high = red.
function edgeSeverityColor(sev: string): "green" | "orange" | "red" {
  if (sev === "low") return "green";
  if (sev === "high") return "red";
  return "orange";
}

function EdgeCaseNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const severity = d.severity || "medium";
  const cycleSeverity = () => {
    const next = EDGE_SEVERITIES[(EDGE_SEVERITIES.indexOf(severity) + 1) % EDGE_SEVERITIES.length];
    onUpdate({ ...d, severity: next });
  };
  return (
    <div className="h-full pl-3 border-l-4 border-warning">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-md font-semibold text-foreground">Edge Case</span>
        </div>
        <Badge.Root
          asChild
          variant="light"
          size="medium"
          color={edgeSeverityColor(severity)}
          className="capitalize cursor-pointer"
        >
          <button
            onClick={cycleSeverity}
            onMouseDown={(e) => e.stopPropagation()}
            title="Cycle severity"
          >
            {severity}
          </button>
        </Badge.Root>
      </div>
      <p className="text-xs text-muted-foreground italic mb-3">Name something your solution doesn't handle well.</p>
      <InlineEdit
        value={d.scenario}
        onChange={(v) => onUpdate({ ...d, scenario: v })}
        className="text-base font-medium text-foreground leading-snug"
        multiline
        placeholder="What happens when…"
      />
      <div className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Impact</span>
        <InlineEdit value={d.impact} onChange={(v) => onUpdate({ ...d, impact: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="Why does this matter…" />
      </div>
      <div className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mitigation</span>
        <InlineEdit value={d.mitigation} onChange={(v) => onUpdate({ ...d, mitigation: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="How could we handle it…" />
      </div>
    </div>
  );
}

// ─── Unsolved Problem ────────────────────────────────────────────
function UnsolvedProblemNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="h-full pl-3 border-l-4 border-destructive">
      <div className="flex items-center gap-2 mb-1">
        <HelpCircle className="w-4 h-4 text-destructive" />
        <span className="text-md font-semibold text-foreground">Unsolved Problem</span>
      </div>
      <p className="text-xs text-muted-foreground italic mb-3">Naming what you haven't solved shows maturity, not weakness.</p>
      <InlineEdit
        value={d.problem}
        onChange={(v) => onUpdate({ ...d, problem: v })}
        className="text-base font-medium text-foreground leading-snug"
        multiline
        placeholder="A problem I haven't solved yet…"
      />
      <div className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why unsolved</span>
        <InlineEdit value={d.why_unsolved} onChange={(v) => onUpdate({ ...d, why_unsolved: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="I didn't address this because…" />
      </div>
      <div className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Future approach</span>
        <InlineEdit value={d.future_approach} onChange={(v) => onUpdate({ ...d, future_approach: v })} className="text-sm text-foreground mt-0.5" multiline placeholder="Given more time, I would…" />
      </div>
    </div>
  );
}

// ─── Vocabulary Sheet ────────────────────────────────────────────
function VocabularySheetNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const terms: any[] = d.terms || [];
  const update = (id: string, field: string, v: string) =>
    onUpdate({ ...d, terms: terms.map((t) => (t.id === id ? { ...t, [field]: v } : t)) });
  const add = () => onUpdate({ ...d, terms: [...terms, { id: `v-${Date.now()}`, term: "", definition: "" }] });
  const remove = (id: string) => onUpdate({ ...d, terms: terms.filter((t) => t.id !== id) });
  return (
    <div className="h-full flex flex-col p-1">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
        <BookOpen className="w-4 h-4 text-primary shrink-0" />
        <InlineEdit value={d.domain} onChange={(v) => onUpdate({ ...d, domain: v })} className="text-md font-semibold text-foreground" placeholder="Domain" />
      </div>
      <div className="flex-1 space-y-1">
        {terms.map((t) => (
          <div key={t.id} className="group/t flex items-baseline gap-1.5">
            <div className="flex-1 flex items-baseline gap-1 flex-wrap">
              <InlineEdit value={t.term} onChange={(v) => update(t.id, "term", v)} className="text-sm font-semibold text-foreground" placeholder="Term" />
              <span className="text-muted-foreground/50">:</span>
              <InlineEdit value={t.definition} onChange={(v) => update(t.id, "definition", v)} className="flex-1 text-sm text-muted-foreground" placeholder="Definition" />
            </div>
            <button onClick={() => remove(t.id)} onMouseDown={(e) => e.stopPropagation()} className="shrink-0 opacity-0 group-hover/t:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button onClick={add} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mt-1">
          <Plus className="w-3.5 h-3.5" /> Add term
        </button>
      </div>
    </div>
  );
}

// ─── Interviewer Lens (static reference) ─────────────────────────
const INTERVIEWER_CRITERIA = [
  { cat: 2, name: "Structured thinking", good: "Breaks the problem into clear, logical steps." },
  { cat: 1, name: "User empathy", good: "Anchors on a specific user and their real needs." },
  { cat: 3, name: "Business sense", good: "Ties decisions to outcomes and trade-offs." },
  { cat: 5, name: "Design craft", good: "Screens are usable, considered, and intentional." },
  { cat: 6, name: "Communication clarity", good: "Explains the thinking crisply, out loud." },
  { cat: 4, name: "Handling ambiguity", good: "Makes assumptions explicit and keeps moving." },
];
function InterviewerLensNode(_props: NodeProps) {
  return (
    <div className="h-full p-1">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-md font-semibold text-foreground">What they're evaluating</span>
      </div>
      <div className="space-y-2.5">
        {INTERVIEWER_CRITERIA.map((c) => (
          <div key={c.name} className="flex items-start gap-2.5">
            <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: `var(--category-${c.cat})` }} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.good}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Self-Score Checklist ────────────────────────────────────────
function SelfScoreChecklistNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const items: any[] = d.items || [];
  const score = items.filter((i) => i.done).length;
  const toggle = (id: string) => onUpdate({ ...d, items: items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) });
  const scoreCls = score >= 10 ? "text-success" : score < 7 ? "text-destructive" : "";
  const scoreStyle = score >= 7 && score < 10 ? catText(3) : undefined;
  return (
    <div className="h-full flex flex-col p-1">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <span className="text-md font-semibold text-foreground">Self-Score</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${scoreCls}`} style={scoreStyle}>{score}</span>
          <span className="text-sm text-muted-foreground">/ 12</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic mb-2">Complete this after the session, not during. Target: 10/12.</p>
      <div className="flex-1 space-y-1">
        {items.map((i) => (
          <button key={i.id} onClick={() => toggle(i.id)} onMouseDown={(e) => e.stopPropagation()} className="w-full flex items-start gap-2.5 text-left rounded-md px-1.5 py-1 hover:bg-secondary/40 transition-colors">
            <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${i.done ? "bg-success border-success text-white" : "border-border bg-surface"}`}>
              {i.done && <Check className="w-3 h-3" />}
            </span>
            <span className={`flex-1 text-sm ${i.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{i.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-muted-foreground text-center">Target: 10 / 12</div>
    </div>
  );
}
