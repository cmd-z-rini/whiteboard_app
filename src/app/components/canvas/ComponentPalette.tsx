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
  AlertTriangle,
  BarChart2,
  PanelTop,
  CreditCard,
  Type,
  RectangleHorizontal,
  Search,
  FlaskConical,
  Clock,
  Star,
  ArrowRight,
  GitMerge,
  Shield,
  BookOpen,
  Eye,
  Award,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { COMPONENT_DEFAULTS, type CanvasComponentType } from "./types";
import * as Badge from "../ui/alignui/badge";

interface ComponentPaletteProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  sessionActive: boolean;
  sessionStartTime: number | null;
}

// ─── Session Guide data (mirrors the App.tsx scaffold zones) ──────
interface GuidePhase {
  n: number;
  title: string;
  time: string;
  rule: string;
  components: string[];
}

const GUIDE_PHASES: GuidePhase[] = [
  {
    n: 1,
    title: "Interrogate the brief",
    time: "0–7 min",
    rule: "If you sketch before completing this phase, you're solving the wrong problem.",
    components: ["Brief Interrogation", "Working Assumption"],
  },
  {
    n: 2,
    title: "Diagnose the person",
    time: "7–16 min",
    rule: "Name a real person, not a demographic. '28-year-old teacher in Chennai' beats 'educators'.",
    components: ["Persona Card", "Timeline Row", "Moment of Truth"],
  },
  {
    n: 3,
    title: "Set strategy",
    time: "16–24 min",
    rule: "One strategic direction only. Trying to serve everyone serves no one.",
    components: ["Problem Statement", "Business Goals", "Strategic Bet"],
  },
  {
    n: 4,
    title: "Map JTBD",
    time: "24–30 min",
    rule: "Focus on the job, not the feature. Users hire products to get things done.",
    components: ["JTBD Table ×2"],
  },
  {
    n: 5,
    title: "Design the screens",
    time: "30–50 min",
    rule: "Sketch fast, annotate clearly. The interviewer needs to understand your thinking.",
    components: ["Wireframe Sketch ×2", "Trigger→Action→Outcome", "30-Day Arc", "Entry Convergence"],
  },
  {
    n: 6,
    title: "Name edge cases",
    time: "50–55 min",
    rule: "Naming what you haven't solved shows maturity, not weakness.",
    components: ["Edge Case ×2", "Unsolved Problem"],
  },
  {
    n: 7,
    title: "Synthesise + close",
    time: "55–60 min",
    rule: "Close with confidence. Summarise, measure, and anticipate the hardest question.",
    components: ["Summary Card", "Success Metrics", "Pushback + Answer"],
  },
];

/** Phase number (1–7) for the elapsed minutes, matching the zone time budgets. */
function phaseFromElapsed(min: number): number {
  if (min < 7) return 1;
  if (min < 16) return 2;
  if (min < 24) return 3;
  if (min < 30) return 4;
  if (min < 50) return 5;
  if (min < 55) return 6;
  return 7;
}

function SessionGuide({ sessionStartTime }: { sessionStartTime: number | null }) {
  // Recompute elapsed time every 30s (plus immediately on (re)start).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!sessionStartTime) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [sessionStartTime]);

  const elapsedMin = sessionStartTime ? (now - sessionStartTime) / 60000 : 0;
  const currentPhase = phaseFromElapsed(elapsedMin);
  const overtime = elapsedMin > 60;

  // Current phase starts expanded; others collapsed. As the timer advances the
  // newly-current phase auto-expands, but manual toggles are preserved.
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([currentPhase]));
  useEffect(() => {
    setExpanded((prev) => new Set(prev).add(currentPhase));
  }, [currentPhase]);

  const toggle = (n: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  return (
    <div className="flex-1 overflow-y-auto py-2 px-2">
      {overtime && (
        <div className="bg-warning/10 text-warning text-xs px-3 py-2 rounded-lg mb-2">
          Session overtime — wrap up and close.
        </div>
      )}
      {GUIDE_PHASES.map((phase) => {
        const isCurrent = phase.n === currentPhase;
        const isPast = phase.n < currentPhase;
        const isOpen = expanded.has(phase.n);
        return (
          <div key={phase.n} className="mb-0.5">
            <button
              onClick={() => toggle(phase.n)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <Badge.Root
                square
                size="medium"
                variant={isCurrent ? "filled" : "light"}
                color={isCurrent ? "purple" : isPast ? "green" : "gray"}
                className="size-6 shrink-0 rounded-full text-label-xs"
              >
                {isPast ? <Check className="w-3.5 h-3.5" /> : phase.n}
              </Badge.Root>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground truncate">
                  {phase.title}
                </span>
                <span className="block text-xs text-muted-foreground">{phase.time}</span>
              </span>
            </button>
            {isOpen && (
              <div>
                <p className="text-xs italic text-muted-foreground pl-8 py-1 pr-2">{phase.rule}</p>
                <div className="text-xs text-muted-foreground pl-8 pr-2 pb-2">
                  {phase.components.map((c) => (
                    <div key={c}>· {c}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
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
  "problem-statement-guided": <Target className="w-4 h-4" />,
  "user-context": <Users className="w-5 h-5" />,
  "flow-step": <ChevronRight className="w-5 h-5" />,
  "crazy-8s": <Grid3X3 className="w-5 h-5" />,
  "mobile-frame": <Layout className="w-5 h-5" />,
  "ui-nav-bar": <PanelTop className="w-4 h-4" />,
  "ui-card": <CreditCard className="w-4 h-4" />,
  "ui-text-block": <Type className="w-4 h-4" />,
  "ui-button": <RectangleHorizontal className="w-4 h-4" />,
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
  "jtbd-table": <FileText className="w-4 h-4" />,
  "edge-case": <AlertTriangle className="w-4 h-4" />,
  "unsolved-problem": <HelpCircle className="w-4 h-4" />,
  "shape": <Grid3X3 className="w-4 h-4" />,
  // Session Mode
  "brief-interrogation": <Search className="w-4 h-4" />,
  "brief-interrogation-guided": <Search className="w-4 h-4" />,
  "working-assumption": <FlaskConical className="w-4 h-4" />,
  "timeline-row": <Clock className="w-4 h-4" />,
  "moment-of-truth": <Star className="w-4 h-4" />,
  "strategic-bet": <Target className="w-4 h-4" />,
  "copy-decision": <Type className="w-4 h-4" />,
  "trigger-action-outcome": <ArrowRight className="w-4 h-4" />,
  "thirty-day-arc": <Calendar className="w-4 h-4" />,
  "entry-convergence": <GitMerge className="w-4 h-4" />,
  "pushback-answer": <Shield className="w-4 h-4" />,
  "vocabulary-sheet": <BookOpen className="w-4 h-4" />,
  "interviewer-lens": <Eye className="w-4 h-4" />,
  "self-score-checklist": <Award className="w-4 h-4" />,
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-sm text-text-sub-600 hover:text-text-strong-950 hover:bg-bg-weak-50 transition duration-200 ease-out text-left group cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : ""
        }`}
      style={{ touchAction: "none" }}
    >
      <span className="w-5 h-5 flex items-center justify-center text-text-soft-400 group-hover:text-text-strong-950 transition-colors">
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
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface shadow-lg border border-primary/20 text-base w-48 opacity-90 cursor-grabbing z-50">
      <span className="w-5 h-5 flex items-center justify-center text-primary">
        {ICON_MAP[type]}
      </span>
      <span>{def.label}</span>
    </div>
  );
}

const CATEGORIES = [
  "Empathize & Analyze",
  "Define & Strategy",
  "Ideate & Brainstorm",
  "Prototype & Flow",
  "Frame Elements",
  "Test & Summarize",
  "Tools",
];

export function ComponentPalette({
  collapsed,
  onToggleCollapse,
  sessionActive,
  sessionStartTime,
}: ComponentPaletteProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES));
  const [activeTab, setActiveTab] = useState<"components" | "guide">("components");

  // Auto-switch to Guide when a session starts, back to Components when it ends.
  useEffect(() => {
    setActiveTab(sessionActive ? "guide" : "components");
  }, [sessionActive]);

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
    "Empathize & Analyze": <Users className="w-5 h-5" />,
    "Define & Strategy": <Target className="w-5 h-5" />,
    "Ideate & Brainstorm": <Lightbulb className="w-5 h-5" />,
    "Prototype & Flow": <Route className="w-5 h-5" />,
    "Test & Summarize": <BarChart2 className="w-5 h-5" />,
    "Tools": <Grid3X3 className="w-5 h-5" />,
  };

  if (collapsed) {
    return (
      <aside className="w-12 bg-background border-r border-border flex flex-col items-center py-3 gap-2 shrink-0 z-20">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground mb-2"
          title="Expand palette"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative group"
            title={cat}
          >
            {CATEGORY_ICONS[cat] || <Grid3X3 className="w-5 h-5" />}

            {/* Flyout Label */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {cat}
            </div>
          </button>
        ))}
      </aside>
    );
  }

  const showGuide = sessionActive && activeTab === "guide";

  return (
    <aside className="w-56 bg-background border-r border-border flex flex-col shrink-0 h-full">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-primary" />
          <span className="text-base">Components</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      {/* Session Mode tab bar */}
      {sessionActive && (
        <div className="flex items-center gap-1 px-2 pt-2 border-b border-border">
          {(["components", "guide"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm font-medium capitalize px-3 py-2 rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {showGuide ? (
        <SessionGuide sessionStartTime={sessionStartTime} />
      ) : (
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {grouped.map(({ category, items }) => (
            <div key={category} className="mb-1">
              <button
                onClick={() => toggleCat(category)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-subheading-xs uppercase text-text-soft-400 hover:text-text-strong-950 transition-colors"
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
      )}

      <div className="px-3 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground/60 text-center">
          {showGuide ? "Follow the phases as the timer runs" : "Drag to add to canvas"}
        </p>
      </div>
    </aside>
  );
}
