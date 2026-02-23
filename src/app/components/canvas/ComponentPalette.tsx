import {
  Layout,
  StickyNote,
  Lightbulb,
  Users,
  CheckSquare,
  PenTool,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  FileText,
  Target,
  Route,
  Zap,
  Calendar,
  HelpCircle,
  BarChart2,
} from "lucide-react";
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { COMPONENT_DEFAULTS, type CanvasComponentType } from "./types";

interface ComponentPaletteProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  "section-header": <Layout className="w-5 h-5" />,
  "text-card": <FileText className="w-5 h-5" />,
  "who-what-why": <Target className="w-4 h-4" />,
  "sticky-note": <StickyNote className="w-4 h-4" />,
  "hmw-card": <Lightbulb className="w-4 h-4" />,
  matrix: <Grid3X3 className="w-4 h-4" />,
  "persona-card": <Users className="w-4 h-4" />,
  "user-flow": <Route className="w-4 h-4" />,
  checklist: <CheckSquare className="w-4 h-4" />,
  "principle-card": <Zap className="w-4 h-4" />,
  "sketch-pad": <PenTool className="w-4 h-4" />,
  "timeline": <Calendar className="w-5 h-5" />,
  "pattern-card": <Zap className="w-5 h-5" />,
  "problem-brief": <FileText className="w-5 h-5" />,
  "user-context": <Users className="w-5 h-5" />,
  "flow-step": <ChevronRight className="w-5 h-5" />,
  "crazy-8s": <Grid3X3 className="w-5 h-5" />,
  "mobile-frame": <Layout className="w-5 h-5" />,
  "success-metrics": <Target className="w-5 h-5" />,
  "clarifying-questions": <HelpCircle className="w-4 h-4" />,
  "business-goals": <Target className="w-4 h-4" />,
  "key-insights": <Lightbulb className="w-4 h-4" />,
  "prioritization-matrix": <BarChart2 className="w-4 h-4" />,
  "competitor-analysis": <BarChart2 className="w-4 h-4" />,
  "usp-card": <Target className="w-4 h-4" />,
  "brainstorm-list": <Layout className="w-4 h-4" />,
  "idea-voting": <CheckSquare className="w-4 h-4" />,
  "wireframe-sketch": <PenTool className="w-4 h-4" />,
  "summary-card": <FileText className="w-4 h-4" />,
  "shape": <Grid3X3 className="w-4 h-4" />,
};

function DraggablePaletteItem({ type, label, icon }: { type: CanvasComponentType; label: string; icon: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all text-left group cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : ""
        }`}
      style={{ touchAction: "none" }}
    >
      <span className="w-5 h-5 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
        {ICON_MAP[type]}
      </span>
      <span>{label}</span>
    </div>
  );
}

// Compact version for collapsed sidebar
function DraggablePaletteIcon({ type, label }: { type: CanvasComponentType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-icon-${type}`,
    data: { type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""
        }`}
      title={label}
      style={{ touchAction: "none" }}
    >
      {ICON_MAP[type]}
    </div>
  );
}

export function PaletteItemDragPreview({ type }: { type: CanvasComponentType }) {
  const def = COMPONENT_DEFAULTS[type];
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white shadow-lg border border-primary/20 text-[13px] w-48 opacity-90 cursor-grabbing z-50">
      <span className="w-5 h-5 flex items-center justify-center text-primary">
        {ICON_MAP[type]}
      </span>
      <span>{def.label}</span>
    </div>
  );
}

const CATEGORIES = [
  "1. Empathize & Analyze",
  "2. Define & Strategy",
  "3. Ideate & Brainstorm",
  "4. Prototype & Flow",
  "5. Test & Summarize",
  "Tools",
];

export function ComponentPalette({ collapsed, onToggleCollapse }: ComponentPaletteProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: Object.entries(COMPONENT_DEFAULTS).filter(([, v]) => v.category === cat),
  }));

  // Icons for Categories
  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    "1. Empathize & Analyze": <Users className="w-5 h-5" />,
    "2. Define & Strategy": <Target className="w-5 h-5" />,
    "3. Ideate & Brainstorm": <Lightbulb className="w-5 h-5" />,
    "4. Prototype & Flow": <Route className="w-5 h-5" />,
    "5. Test & Summarize": <BarChart2 className="w-5 h-5" />,
    "Tools": <Grid3X3 className="w-5 h-5" />,
    "Legacy": <Calendar className="w-5 h-5" />,
  };

  if (collapsed) {
    return (
      <aside className="w-12 bg-white border-r border-border flex flex-col items-center py-3 gap-2 shrink-0 z-20" data-html2canvas-ignore>
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground mb-2"
          title="Expand palette"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {CATEGORIES.map((cat) => (
          <div
            key={cat}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-help relative group"
            title={cat}
          >
            {CATEGORY_ICONS[cat] || <Grid3X3 className="w-5 h-5" />}

            {/* Flyout Label */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {cat}
            </div>
          </div>
        ))}
      </aside>
    );
  }

  return (
    <aside className="w-56 bg-white border-r border-border flex flex-col shrink-0 h-full" data-html2canvas-ignore>
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          <span className="text-[13px]">Components</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {grouped.map(({ category, items }) => (
          <div key={category} className="mb-1">
            <button
              onClick={() => toggleCat(category)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              {expandedCats.has(category) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {category}
            </button>
            {expandedCats.has(category) && (
              <div className="space-y-0.5 ml-1">
                {items.map(([type, def]) => (
                  <DraggablePaletteItem
                    key={type}
                    type={type as CanvasComponentType}
                    label={def.label}
                    icon={ICON_MAP[type]}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Drag to add to canvas
        </p>
      </div>
    </aside>
  );
}
