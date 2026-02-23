import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, Target, FileText, Users, AlertTriangle, Zap, ArrowRight, Calendar, Grid3X3, Check, Lightbulb, GripHorizontal, GripVertical, Copy } from "lucide-react";
import { CanvasNode, COMPONENT_DEFAULTS } from "./types";
import { TimelineCardNode } from "./TimelineCard";

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
    <div className="p-4 bg-indigo-50/30 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3 text-indigo-900">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">?</div>
        <span className="font-bold text-lg">Clarifying Questions</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {questions.map((q: any) => (
          <div key={q.id} className="group flex items-start gap-2">
            <button onClick={() => toggleQ(q.id)} className={`mt-1.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${q.answered ? "bg-indigo-600 border-indigo-600 text-white" : "border-indigo-300 bg-white hover:border-indigo-500"}`}>
              {q.answered && <Check className="w-3 h-3" />}
            </button>
            <InlineEdit value={q.text} onChange={(v) => updateQ(q.id, v)} className={`flex-1 text-base ${q.answered ? "text-muted-foreground line-through" : "text-foreground"}`} placeholder="Ask a question..." multiline />
          </div>
        ))}
        <button onClick={addQ} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-base mt-2">
          <Plus className="w-5 h-5" /> Add Question
        </button>
      </div>
    </div>
  );
}

// ─── Prioritization Matrix ───────────────────────────────────────
function PrioritizationMatrixNode({ node }: NodeProps) {
  return (
    <div className="w-full h-full flex flex-col relative min-w-[600px] min-h-[400px]">
      <div className="absolute top-0 left-0 w-full h-full grid grid-cols-2 grid-rows-2">
        <div className="bg-green-50/50 border-r border-b border-green-200 p-4 relative flex flex-col">
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">High Impact</span>
          <span className="text-[10px] font-medium text-green-600/60 uppercase tracking-wider">Low Effort</span>
        </div>
        <div className="bg-blue-50/50 border-b border-blue-200 p-4 relative flex flex-col">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">High Impact</span>
          <span className="text-[10px] font-medium text-blue-600/60 uppercase tracking-wider">High Effort</span>
        </div>
        <div className="bg-yellow-50/50 border-r border-yellow-200 p-6 relative flex flex-col">
          <span className="text-sm font-bold text-yellow-700 uppercase tracking-wider mb-1">Low Impact</span>
          <span className="text-xs font-medium text-yellow-600/60 uppercase tracking-wider">Low Effort</span>
        </div>
        <div className="bg-red-50/50 p-4 relative flex flex-col">
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Low Impact</span>
          <span className="text-[10px] font-medium text-red-600/60 uppercase tracking-wider">High Effort</span>
        </div>
      </div>
      {/* Background component, nodes are placed on top via canvas z-index/positioning naturally */}
    </div>
  );
}

// ─── Shape Node ──────────────────────────────────────────────────
function ShapeNode({ node, isSelected, onStartConnection }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const d = node.data;
  const shapeClasses = {
    rectangle: "rounded-lg",
    circle: "rounded-full",
    diamond: "rotate-45 scale-75 rounded-sm",
  };
  const shapeClass = shapeClasses[(d.shapeType as "rectangle" | "circle" | "diamond") || "rectangle"];

  return (
    <div
      className={`w-full h-full ${shapeClass} ${d.color || "bg-blue-500"} shadow-sm border border-black/10 flex items-center justify-center relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles */}
      {(isSelected || isHovered) && (
        <ConnectionHandles onStart={() => onStartConnection?.()} />
      )}
    </div>
  );
}

// ─── Flow Step (Simple) ──────────────────────────────────────────
export function FlowStepNode({ node, onUpdate, onStartDrag, isSelected, onStartConnection }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const d = node.data;
  return (
    <div
      className="p-3 bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 cursor-grab active:cursor-grabbing relative"
      onMouseDown={onStartDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
        {d.type === "action" ? "⚡" : "🛑"}
      </div>
      <InlineEdit value={d.label} onChange={(v) => onUpdate({ ...d, label: v })} className="text-base font-medium" />

      {/* Connection Handles */}
      {(isSelected || isHovered) && (
        <ConnectionHandles onStart={() => onStartConnection?.()} />
      )}
    </div>
  );
}

// ─── Mobile Frame (Updated) ──────────────────────────────────────


// ─── Business / User Goals ───────────────────────────────────────
function BusinessGoalsNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="h-full flex gap-4 p-4">
      <div className="flex-1 bg-blue-50 rounded-xl p-4 flex flex-col border border-blue-100">
        <span className="text-xs font-bold text-blue-600 uppercase mb-2">Business Goals</span>
        <InlineEdit value={d.business} onChange={(v) => onUpdate({ ...d, business: v })} className="flex-1 text-base text-blue-900" multiline placeholder="Enter business goals..." />
      </div>
      <div className="flex-1 bg-green-50 rounded-xl p-4 flex flex-col border border-green-100">
        <span className="text-xs font-bold text-green-600 uppercase mb-2">User Goals</span>
        <InlineEdit value={d.user} onChange={(v) => onUpdate({ ...d, user: v })} className="flex-1 text-base text-green-900" multiline placeholder="Enter user goals..." />
      </div>
      <div className="flex-1 bg-purple-50 rounded-xl p-4 flex flex-col border border-purple-100">
        <span className="text-xs font-bold text-purple-600 uppercase mb-2">Tech Constraints</span>
        <InlineEdit value={d.tech} onChange={(v) => onUpdate({ ...d, tech: v })} className="flex-1 text-base text-purple-900" multiline placeholder="Enter technical constraints..." />
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

  const TYPE_COLORS: Record<string, string> = {
    problem: "bg-red-100 text-red-800 border-red-200",
    stat: "bg-blue-100 text-blue-800 border-blue-200",
    finding: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6 text-slate-800">
        <Lightbulb className="w-6 h-6 text-yellow-500" />
        <span className="font-bold text-xl">Key Research Insights</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {insights.map((i: any) => (
          <div key={i.id} className={`p-3 rounded-lg border flex flex-col gap-2 ${TYPE_COLORS[i.type] || "bg-white border-border"}`}>
            <div className="flex justify-between items-center">
              <select
                value={i.type}
                onChange={(e) => updateType(i.id, e.target.value)}
                className="text-[10px] uppercase font-bold bg-transparent focus:outline-none opacity-60 hover:opacity-100"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <option value="problem">Problem</option>
                <option value="stat">Stat</option>
                <option value="finding">Finding</option>
              </select>
            </div>
            <InlineEdit value={i.text} onChange={(v) => updateInsight(i.id, v)} className="font-medium text-sm min-h-[40px]" multiline placeholder="Insight..." />
          </div>
        ))}
        <button onClick={addInsight} className="h-full min-h-[100px] rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all">
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
      <div className="grid grid-cols-4 grid-rows-2 gap-4 flex-1">
        {grids.map((text: string, i: number) => (
          <div key={i} className="relative bg-yellow-50 border border-yellow-200 shadow-sm rounded-lg p-3 flex flex-col">
            <span className="absolute top-1 left-2 text-[10px] font-bold text-yellow-600/50 pointer-events-none">{i + 1}</span>
            <InlineEdit
              value={text}
              onChange={(v) => updateGrid(i, v)}
              className="flex-1 mt-3 font-handwriting text-sm leading-tight resize-none bg-transparent outline-none placeholder:text-yellow-600/20"
              multiline
              placeholder="Sketch/Idea..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile Frame (Updated with SVG) ───────────────────────────
function MobileFrameNode({ node, onStartDrag, isSelected, onStartConnection }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className="w-full h-full relative group cursor-grab active:cursor-grabbing"
      onMouseDown={onStartDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 375 812"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="drop-shadow-xl"
      >
        <rect x="1" y="1" width="373" height="810" rx="49" fill="#ECF0F3" />
        <rect x="8" y="8" width="359" height="796" rx="42" fill="white" />
        <rect x="1" y="1" width="373" height="810" rx="49" stroke="black" strokeWidth="2" />
        {/* Notch */}
        <path d="M121 1H254V12C254 23.0457 245.046 32 234 32H141C129.954 32 121 23.0457 121 12V1Z" fill="black" />
      </svg>

      <div className="absolute inset-0 pt-10 px-6 pb-6 overflow-auto pointer-events-none">
        {/* Content Area for dropping elements */}
      </div>

      {/* Connection Handles */}
      {(isSelected || isHovered) && (
        <ConnectionHandles onStart={() => onStartConnection?.()} />
      )}
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
  onStartConnection?: () => void;
  onFinishConnection?: () => void;
  children?: React.ReactNode;
}

function ConnectionHandles({ onStart }: {
  onStart: () => void;
}) {
  return (
    <>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-crosshair z-[100] border-2 border-white shadow-sm hover:scale-125 transition-transform"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onStart(); }}
      />
      <div
        className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-crosshair z-[100] border-2 border-white shadow-sm hover:scale-125 transition-transform"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onStart(); }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-crosshair z-[100] border-2 border-white shadow-sm hover:scale-125 transition-transform"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onStart(); }}
      />
      <div
        className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-crosshair z-[100] border-2 border-white shadow-sm hover:scale-125 transition-transform"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onStart(); }}
      />
    </>
  );
}

const BYPASS_WRAPPER_TYPES = ["sticky-note", "mobile-frame", "wireframe-sketch", "flow-step"];

// ─── Standard Card Wrapper ───────────────────────────────────────
function StandardCardWrapper({ node, children, onUpdate, isSelected, onStartDrag, onDelete, onDuplicate, onResizeStart, onStartConnection }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const d = node.data;
  const isBypassed = BYPASS_WRAPPER_TYPES.includes(node.type);

  // If bypassed, we don't render the card wrapper UI, just the children.
  // Actually, if it's bypassed, this function shouldn't even be called, but we have it as a fallback.
  if (isBypassed) return <>{children}</>;

  return (
    <div
      className={`group relative h-full bg-white border-2 transition-all duration-200 ${isSelected ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-border/50 hover:border-primary/30 shadow-sm"}`}
      style={{ borderRadius: "12px", background: d.color || "white" }}
      onMouseDown={onStartDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header / Draggable Area */}
      <div className="h-6 flex items-center justify-between px-2 border-b border-border/50 bg-secondary/30 rounded-t-[10px] cursor-grab active:cursor-grabbing group">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <span className="text-[10px] font-medium text-muted-foreground/60 truncate uppercase tracking-wider">{node.type.replace("-", " ")}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }} className="p-0.5 hover:bg-secondary rounded text-muted-foreground/60 hover:text-foreground"><Copy className="w-3 h-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="p-0.5 hover:bg-red-50 rounded text-muted-foreground/60 hover:text-red-500"><X className="w-3 h-3" /></button>
        </div>
      </div>

      <SelectionOverlay isSelected={!!isSelected} onResizeStart={onResizeStart} width={node.width} height={node.data.height} />

      <div className="p-3 h-full overflow-hidden">
        {children}
      </div>

      {/* Connection Handles */}
      {(isSelected || isHovered) && (
        <ConnectionHandles onStart={() => onStartConnection?.()} />
      )}
    </div>
  );
}

// ─── Simple Text Node ──────────────────────────────────────────────
function SimpleTextNode({ node, onUpdate, isSelected, onStartDrag, onResizeStart, onStartConnection }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const d = node.data;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = newHeight + "px";
    }
  }, [d.text]);

  return (
    <div
      className={`min-w-[100px] min-h-[40px] p-2 relative group ${isSelected ? "rounded-lg" : "hover:border-2 hover:border-blue-200 hover:border-dashed"}`}
      onMouseDown={onStartDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: node.width, height: "auto" }} // Allow container to grow
    >
      <SelectionOverlay isSelected={!!isSelected} onResizeStart={onResizeStart} width={node.width} height={node.data.height} />
      <textarea
        ref={textareaRef}
        value={d.text}
        onChange={(e) => {
          e.target.style.height = "auto";
          const h = e.target.scrollHeight;
          onUpdate({ ...d, text: e.target.value, height: h });
        }}
        className="w-full bg-transparent resize-none border-none focus:ring-0 text-slate-800 leading-normal focus:outline-none font-handwriting text-lg overflow-hidden"
        style={{ fontSize: (d.fontSize || 18) + "px", height: d.height || "auto" }}
        placeholder="Type..."
        onMouseDown={(e) => e.stopPropagation()}
        autoFocus={!d.text}
      />

      {/* Connection Handles */}
      {(isSelected || isHovered) && (
        <ConnectionHandles onStart={() => onStartConnection?.()} />
      )}
    </div>
  );
}

// ─── Simple Shape Node ─────────────────────────────────────────────
// ─── Selection Overlay (Handles) ───────────────────────────────────
interface SelectionOverlayProps {
  isSelected: boolean;
  onResizeStart?: (e: React.MouseEvent, handle: "tl" | "tr" | "bl" | "br") => void;
  width?: number;
  height?: number;
  nodeType: string;
}

const resizableTypes = ['simple-shape', 'simple-circle', 'simple-text', 'mobile-frame', 'sticky-note', 'wireframe-sketch'];

function SelectionOverlay({ isSelected, onResizeStart, width, height, nodeType }: SelectionOverlayProps) {
  if (!isSelected) return null;

  const handleStyle = "absolute w-3 h-3 bg-white border border-blue-500 z-50";
  const canResize = resizableTypes.includes(nodeType);

  return (
    <>
      <div className="absolute inset-0 border border-blue-500 pointer-events-none" />

      {canResize && (
        <>
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
        </>
      )}

      {/* Dimension Label */}
      {canResize && width && height && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {Math.round(width)} × {Math.round(height)}
        </div>
      )}
    </>
  );
}


function SimpleShapeNode({ node, onUpdate, isSelected, onStartDrag, onResizeStart, onStartConnection }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const d = node.data;
  return (
    <div
      className={`w-full h-full ${d.color?.includes("bg-") ? d.color : "bg-transparent border-4 border-slate-800"} flex items-center justify-center shadow-sm relative group`}
      style={{ overflow: "hidden" }}
      onMouseDown={onStartDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SelectionOverlay isSelected={!!isSelected} onResizeStart={onResizeStart} width={node.width} height={d.height} nodeType={node.type} />

      {/* Connection Handles */}
      {(isSelected || isHovered) && (
        <ConnectionHandles onStart={() => onStartConnection?.()} />
      )}
    </div>
  );
}

function SimpleCircleNode({ node, onUpdate, isSelected, onStartDrag, onResizeStart, onStartConnection }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const d = node.data;
  return (
    <div
      className={`w-full h-full rounded-full ${d.color?.includes("bg-") ? d.color : "bg-transparent border-4 border-slate-800"} flex items-center justify-center shadow-sm relative group`}
      style={{ overflow: "hidden" }}
      onMouseDown={onStartDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SelectionOverlay isSelected={!!isSelected} onResizeStart={onResizeStart} width={node.width} height={d.height} nodeType={node.type} />

      {/* Connection Handles */}
      {(isSelected || isHovered) && (
        <ConnectionHandles onStart={() => onStartConnection?.()} />
      )}
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
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none opacity-50" />
      )}
    </div>
  );
}

export function CanvasNodeRenderer(props: NodeProps) {
  const {
    node,
    onUpdate,
    isSelected,
    onStartDrag,
    onResizeStart,
    onDelete,
    onDuplicate,
    onStartConnection,
    onFinishConnection,
  } = props;

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

  // 1.5 Handle bypassed nodes (Naked Rendering)
  if (BYPASS_WRAPPER_TYPES.includes(node.type)) {
    switch (node.type) {
      case "sticky-note": return <StickyNoteNode {...props} />;
      case "mobile-frame": return <MobileFrameNode {...props} />;
      case "flow-step": return <FlowStepNode {...props} />;
      case "wireframe-sketch": return <MobileFrameNode {...props} />;
      default: return null;
    }
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
      case "user-context": return <UserContextNode node={node} onUpdate={onUpdate} />;
      case "success-metrics": return <SuccessMetricsNode node={node} onUpdate={onUpdate} />;
      case "crazy-8s": return <Crazy8sNode node={node} onUpdate={onUpdate} />;
      case "mobile-frame": return <MobileFrameNode node={node} onUpdate={onUpdate} />;
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
      case "wireframe-sketch": return <MobileFrameNode node={node} onUpdate={onUpdate} />;

      default: return <div className="p-4 text-muted-foreground">Unknown component</div>;
    }
  };

  return (
    <StandardCardWrapper {...props}>
      {renderContent()}
    </StandardCardWrapper>
  );
}
function InlineEdit({ value, onChange, className = "", multiline = false, placeholder = "Click to type..." }: {
  value: string; onChange: (v: string) => void; className?: string; multiline?: boolean; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as any}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          className={`w-full bg-white/60 border border-primary/20 rounded px-2 py-1 resize-none focus:outline-none focus:border-primary/40 ${className}`}
          rows={3}
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
      onClick={() => setEditing(true)}
      className={`cursor-text rounded px-2 py-1 hover:bg-black/[0.03] transition-colors whitespace-pre-wrap ${className}`}
    >
      {value || <span className="text-muted-foreground/40 italic">{placeholder}</span>}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────
function SectionHeaderNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1.5 ${d.color || "bg-blue-600"}`} />
      <div className="pt-6 pb-3 px-2">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[28px] text-muted-foreground/40">{d.number}</span>
          <InlineEdit
            value={d.title}
            onChange={(v) => onUpdate({ ...d, title: v })}
            className="text-[22px]"
            placeholder="Section title..."
          />
        </div>
        <InlineEdit
          value={d.subtitle}
          onChange={(v) => onUpdate({ ...d, subtitle: v })}
          className="text-[14px] text-muted-foreground"
          placeholder="Subtitle..."
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
        className="text-[14px] text-muted-foreground mb-2"
        placeholder="Label..."
      />
      <InlineEdit
        value={d.text}
        onChange={(v) => onUpdate({ ...d, text: v })}
        className="text-[16px]"
        multiline
        placeholder="Click to type..."
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
            <span className={`text-[13px] ${c.pillText} tracking-wider uppercase font-bold`}>{c.label}</span>
          </div>
          <p className={`text-[12px] ${c.subText} mb-2`}>{c.sub}</p>
          <InlineEdit
            value={d[c.key]}
            onChange={(v) => onUpdate({ ...d, [c.key]: v })}
            className="text-[14px]"
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

function StickyNoteNode({ node, onUpdate, onStartDrag, isSelected, onStartConnection }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const d = node.data;
  const colors = stickyColorMap[d.color] || stickyColorMap.yellow;
  return (
    <div
      className={`p-4 rounded-sm border shadow-md min-h-[140px] cursor-grab active:cursor-grabbing relative ${colors}`}
      onMouseDown={onStartDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <textarea
        value={d.text}
        onChange={(e) => {
          onUpdate({ ...d, text: e.target.value });
        }}
        className="w-full h-full bg-transparent resize-none focus:outline-none text-[18px] font-handwriting min-h-[120px] leading-relaxed overflow-hidden"
        placeholder="Type here..."
        onMouseDown={(e) => e.stopPropagation()}
      />
      {(isSelected || isHovered) && (
        <ConnectionHandles onStart={() => onStartConnection?.()} />
      )}
    </div>
  );
}

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
    <div className="bg-white border-0 rounded-xl p-2">
      <div className="flex items-center gap-3 mb-4 px-1">
        <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-[16px]">💡</span>
        <span className="text-base font-medium text-muted-foreground">"How Might We" Statements</span>
      </div>
      <div className="space-y-4">
        {items.map((item: any) => (
          <div key={item.id} className="group relative">
            <input
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              className="w-full bg-yellow-50/50 hover:bg-yellow-50 border border-transparent focus:border-yellow-300 rounded-lg px-5 py-4 text-lg focus:outline-none transition-colors"
              placeholder="How might we..."
              onMouseDown={(e) => e.stopPropagation()}
            />
            {items.length > 1 && (
              <button
                onClick={() => removeItem(item.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="mt-3 text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-1.5 rounded hover:bg-secondary transition-colors"
      >
        <Plus className="w-4 h-4" /> Add HMW statement
      </button>
    </div>
  );
}

// ─── Sticky Note ─────────────────────────────────────────────────
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
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white shrink-0">
          <span className="text-[32px]">{d.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <InlineEdit value={d.name} onChange={(v) => onUpdate({ ...d, name: v })} className="text-xl font-bold" placeholder="Name..." />
          <div className="flex gap-4">
            <InlineEdit value={d.role} onChange={(v) => onUpdate({ ...d, role: v })} className="text-base text-muted-foreground flex-1" placeholder="Role..." />
            <InlineEdit value={d.age} onChange={(v) => onUpdate({ ...d, age: v })} className="text-base text-muted-foreground w-20" placeholder="Age..." />
          </div>
        </div>
      </div>
      <InlineEdit value={d.bio} onChange={(v) => onUpdate({ ...d, bio: v })} className="text-base bg-secondary/30 rounded-xl mb-4 p-4 leading-relaxed" multiline placeholder="Bio..." />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-[12px] text-green-600 tracking-wider uppercase mb-2 font-bold">Goals</h4>
          {d.goals.map((g: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5 mb-1 group/gi">
              <span className="text-green-500 text-[14px] mt-0.5">+</span>
              <input value={g} onChange={(e) => updateList("goals", i, e.target.value)} className="bg-transparent focus:outline-none text-[14px] flex-1 min-w-0" onMouseDown={(e) => e.stopPropagation()} />
              <button onClick={() => removeFromList("goals", i)} className="opacity-0 group-hover/gi:opacity-100 text-muted-foreground/40 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => addToList("goals")} className="text-[12px] text-muted-foreground hover:text-green-600 flex items-center gap-1 mt-2 px-1 py-0.5 rounded hover:bg-green-50"><Plus className="w-3.5 h-3.5" />Add</button>
        </div>
        <div>
          <h4 className="text-[12px] text-red-500 tracking-wider uppercase mb-2 font-bold">Pain Points</h4>
          {d.painPoints.map((p: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5 mb-1 group/pi">
              <span className="text-red-400 text-[14px] mt-0.5">-</span>
              <input value={p} onChange={(e) => updateList("painPoints", i, e.target.value)} className="bg-transparent focus:outline-none text-[14px] flex-1 min-w-0" onMouseDown={(e) => e.stopPropagation()} />
              <button onClick={() => removeFromList("painPoints", i)} className="opacity-0 group-hover/pi:opacity-100 text-muted-foreground/40 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={() => addToList("painPoints")} className="text-[12px] text-muted-foreground hover:text-red-500 flex items-center gap-1 mt-2 px-1 py-0.5 rounded hover:bg-red-50"><Plus className="w-3.5 h-3.5" />Add</button>
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
            <span className={`px-3 py-1 rounded-full border text-[12px] font-medium ${step.flag === "pain" ? "bg-red-50 border-red-200" :
              step.flag === "opportunity" ? "bg-emerald-50 border-emerald-200" :
                "bg-gray-50 border-gray-200"
              }`}>{step.label}</span>
            {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/30" />}
          </div>
        ))}
      </div>

      {/* Step list */}
      {steps.map((step, i) => (
        <div key={step.id} className={`flex items-center gap-4 rounded-xl p-4 border text-base ${step.flag === "pain" ? "bg-red-50/50 border-red-200" :
          step.flag === "opportunity" ? "bg-emerald-50/50 border-emerald-200" :
            "bg-white border-border"
          } group/fs`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border shrink-0 font-medium ${step.flag === "pain" ? "bg-red-100 border-red-200 text-red-700" :
            step.flag === "opportunity" ? "bg-emerald-100 border-emerald-200 text-emerald-700" :
              "bg-secondary border-border text-muted-foreground"
            }`}>{i + 1}</span>
          <input value={step.label} onChange={(e) => updateStep(step.id, "label", e.target.value)}
            className="bg-transparent focus:outline-none flex-1 min-w-0 text-lg" onMouseDown={(e) => e.stopPropagation()} />
          <input value={step.note} onChange={(e) => updateStep(step.id, "note", e.target.value)}
            className="bg-transparent focus:outline-none text-muted-foreground w-40 text-sm" placeholder="note..." onMouseDown={(e) => e.stopPropagation()} />
          <div className="flex gap-1 opacity-0 group-hover/fs:opacity-100 transition-opacity">
            <button onClick={() => cycleFlag(step.id)} className="p-1.5 rounded hover:bg-secondary" title="Toggle flag">
              {step.flag === "none" ? <AlertTriangle className="w-4 h-4 text-muted-foreground/40" /> :
                step.flag === "pain" ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                  <Zap className="w-4 h-4 text-emerald-600" />}
            </button>
            {steps.length > 2 && (
              <button onClick={() => removeStep(step.id)} className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-muted-foreground/40">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      <button onClick={addStep} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground text-[14px] w-full justify-center">
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
      <div className="flex items-center justify-between mb-4 px-2">
        <InlineEdit value={d.title} onChange={(v) => onUpdate({ ...d, title: v })} className="text-lg font-semibold" placeholder="Title..." />
        <span className="text-sm text-muted-foreground">{checkedCount}/{items.length}</span>
      </div>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-2 group/ci">
          <button onClick={() => toggle(item.id)} className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 transition-colors ${item.checked ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
            {item.checked && <span className="text-sm">✓</span>}
          </button>
          <input value={item.text} onChange={(e) => updateText(item.id, e.target.value)}
            className={`bg-transparent focus:outline-none text-base flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}
            placeholder="Item..." onMouseDown={(e) => e.stopPropagation()} />
          <button onClick={() => remove(item.id)} className="opacity-0 group-hover/ci:opacity-100 text-muted-foreground/40 hover:text-red-500 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={add} className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-2 mt-3 p-1">
        <Plus className="w-4 h-4" /> Add item
      </button>
    </div>
  );
}

// ─── 2×2 Matrix ──────────────────────────────────────────────────
function MatrixNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const quadrants = [
    { key: "topLeft", label: "High Impact / Low Effort", bg: "bg-green-50", border: "border-green-100", pill: "bg-green-100 text-green-700" },
    { key: "topRight", label: "High Impact / High Effort", bg: "bg-blue-50", border: "border-blue-100", pill: "bg-blue-100 text-blue-700" },
    { key: "bottomLeft", label: "Low Impact / Low Effort", bg: "bg-yellow-50", border: "border-yellow-100", pill: "bg-yellow-100 text-yellow-700" },
    { key: "bottomRight", label: "Low Impact / High Effort", bg: "bg-red-50", border: "border-red-100", pill: "bg-red-100 text-red-700" },
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
      <div className="text-base font-medium text-muted-foreground mb-4 px-1">Solution Prioritization (Impact vs. Effort)</div>
      <div className="grid grid-cols-2 gap-4 h-full">
        {quadrants.map((q) => (
          <div key={q.key} className={`${q.bg} ${q.border} border rounded-2xl p-6 flex flex-col min-h-[250px]`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-4 ${q.pill.split(" ")[1]}`}>{q.label}</div>
            <div className="flex-1 space-y-4">
              {items.filter((i: any) => i.quadrant === q.key).map((item: any) => (
                <div key={item.id} className="group relative">
                  <textarea
                    value={item.text}
                    onChange={(e) => updateItem(item.id, e.target.value)}
                    className="w-full bg-white/50 hover:bg-white border border-transparent focus:border-black/5 rounded-lg px-4 py-3 text-base resize-none focus:outline-none transition-colors shadow-sm"
                    rows={2}
                    placeholder="Type idea..."
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 border shadow-sm text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addItem(q.key)}
              className="mt-3 self-start text-[12px] bg-white/50 hover:bg-white border border-black/5 rounded-lg px-3 py-1.5 text-muted-foreground transition-colors flex items-center gap-1.5"
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
    <div className={`p-8 rounded-xl border ${d.color || "bg-blue-50 border-blue-200"}`}>
      <InlineEdit value={d.title} onChange={(v) => onUpdate({ ...d, title: v })} className="text-xl mb-3 font-bold" placeholder="Principle name..." />
      <InlineEdit value={d.description} onChange={(v) => onUpdate({ ...d, description: v })} className="text-base text-muted-foreground leading-relaxed" multiline placeholder="Describe..." />
    </div>
  );
}



// ─── Problem Brief ───────────────────────────────────────────────
function ProblemBriefNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  return (
    <div className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6 border-b pb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
          <FileText className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-blue-900">Problem Brief</span>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide font-bold text-muted-foreground mb-1 block">Context</label>
          <InlineEdit value={d.context} onChange={(v) => onUpdate({ ...d, context: v })} className="text-base min-h-[60px]" multiline placeholder="What is the context?" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide font-bold text-muted-foreground mb-1 block">Problem Statement</label>
          <InlineEdit value={d.problem} onChange={(v) => onUpdate({ ...d, problem: v })} className="text-base min-h-[60px]" multiline placeholder="What is the core problem?" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide font-bold text-muted-foreground mb-1 block">Goals</label>
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
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-8 h-8 text-green-600" />
        <span className="text-xl font-bold text-green-900">Success Metrics</span>
      </div>
      <div className="space-y-3">
        {metrics.map((m: any) => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50/50 border border-green-100">
            <div className="flex-1">
              <input value={m.label} onChange={(e) => updateMetric(m.id, "label", e.target.value)}
                className="bg-transparent font-medium text-base w-full focus:outline-none text-green-900" placeholder="Metric Name" onMouseDown={(e) => e.stopPropagation()} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-green-600 uppercase">Current</span>
                <input value={m.value} onChange={(e) => updateMetric(m.id, "value", e.target.value)}
                  className="bg-white/80 rounded px-1.5 py-0.5 text-sm w-16 text-right focus:outline-none" onMouseDown={(e) => e.stopPropagation()} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-green-600 uppercase">Target</span>
                <input value={m.target} onChange={(e) => updateMetric(m.id, "target", e.target.value)}
                  className="bg-white/80 rounded px-1.5 py-0.5 text-sm w-16 text-right font-bold text-green-700 focus:outline-none" onMouseDown={(e) => e.stopPropagation()} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addMetric} className="w-full py-2 rounded-lg border border-dashed border-green-200 text-green-600 hover:bg-green-50 flex items-center justify-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Metric
        </button>
      </div>
    </div>
  );
}



// ─── User Context (List) ─────────────────────────────────────────
function UserContextNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const users = d.users || [];

  const updateUser = (id: string, field: string, value: string) => {
    onUpdate({ ...d, users: users.map((u: any) => u.id === id ? { ...u, [field]: value } : u) });
  };
  const addUser = () => onUpdate({ ...d, users: [...users, { id: `u-${Date.now()}`, name: "New User", count: "Primary" }] });

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-6 h-6 text-indigo-600" />
        <span className="font-bold text-lg">User Context</span>
      </div>
      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
            <input value={u.name} onChange={(e) => updateUser(u.id, "name", e.target.value)}
              className="bg-transparent font-medium text-sm flex-1 focus:outline-none" onMouseDown={(e) => e.stopPropagation()} />
            <div className="relative group">
              <input value={u.count} onChange={(e) => updateUser(u.id, "count", e.target.value)}
                className="bg-white rounded px-2 py-0.5 text-xs text-indigo-600 border border-indigo-200 w-24 text-center focus:outline-none" onMouseDown={(e) => e.stopPropagation()} />
            </div>
          </div>
        ))}
        <button onClick={addUser} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1">
          <Plus className="w-3 h-3" /> Add User Group
        </button>
      </div>
    </div>
  );
}
