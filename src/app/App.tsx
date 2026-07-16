import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "lucide-react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import type { CanvasNode, CanvasViewport, ToolMode, CanvasComponentType } from "./components/canvas/types";
import {
  COMPONENT_DEFAULTS,
  createDefaultData,
  canNestInFrame,
  getFrameScreenRect,
  removeNodesCascade,
  framesWithChildren,
} from "./components/canvas/types";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";
import { ComponentPalette, PaletteItemDragPreview } from "./components/canvas/ComponentPalette";
import { CanvasToolbar } from "./components/canvas/CanvasToolbar";
import { SessionModal } from "./components/canvas/SessionModal";
import type { Domain } from "./components/DomainSelector";
import { NotificationProvider } from "./components/ui/alignui/notification-provider";
import { notification } from "./components/ui/alignui/use-notification";

// ─── Initial template layout ─────────────────────────────────────
const INITIAL_NODES: CanvasNode[] = [];

// ─── Session Mode: "Interview prep — 60 min" scaffold ─────────────
// 7 phase zones laid out left→right, each headed by a section-header node with
// its time budget as the subtitle. Zone x = START_X + i * (ZONE_W + ZONE_GAP).
const SESSION_START_X = 80;
const SESSION_START_Y = 80;
const SESSION_ZONE_W = 560;
const SESSION_ZONE_GAP = 80;
// Tall enough for the redesigned SectionHeaderNode (accent bar + pill/title row
// + subtitle + padding ≈ 100px). Too short and `overflow-hidden` clips the
// subtitle's bottom padding.
const SESSION_HEADER_H = 104;
const SESSION_NODE_GAP = 16;
const SESSION_COMP_W = 520;

const SESSION_ZONES: {
  header: { number: string; title: string; subtitle: string; color: string };
  components: CanvasComponentType[];
}[] = [
  {
    header: { number: "01", title: "Interrogate the brief", subtitle: "0–7 min", color: "bg-indigo-600" },
    components: ["brief-interrogation", "working-assumption"],
  },
  {
    header: { number: "02", title: "Diagnose the person", subtitle: "7–16 min", color: "bg-violet-600" },
    components: ["persona-card", "timeline-row", "moment-of-truth"],
  },
  {
    header: { number: "03", title: "Set strategy", subtitle: "16–24 min · Define the problem, then commit to a direction", color: "bg-blue-600" },
    components: ["problem-statement-guided", "business-goals", "strategic-bet"],
  },
  {
    header: { number: "04", title: "Map JTBD", subtitle: "24–30 min", color: "bg-cyan-600" },
    components: ["jtbd-table", "jtbd-table"],
  },
  {
    header: { number: "05", title: "Design the screens", subtitle: "30–50 min", color: "bg-teal-600" },
    components: ["wireframe-sketch", "wireframe-sketch", "trigger-action-outcome", "thirty-day-arc", "entry-convergence"],
  },
  {
    header: { number: "06", title: "Name edge cases", subtitle: "50–55 min · Name what you haven't solved", color: "bg-orange-500" },
    components: ["edge-case", "edge-case", "unsolved-problem"],
  },
  {
    header: { number: "07", title: "Synthesise + close", subtitle: "55–60 min", color: "bg-rose-600" },
    components: ["summary-card", "success-metrics", "pushback-answer"],
  },
];

// True "content" change detector for the undo coalescer: which node ids were
// added, removed, or had their geometry / data / parent / type changed. Pure
// z-index changes (bring-to-front on select) are intentionally ignored, so
// merely selecting a node never creates a history entry.
function meaningfulChangeSig(prev: CanvasNode[], next: CanvasNode[]): string {
  const prevById = new Map(prev.map((n) => [n.id, n]));
  const changed: string[] = [];
  const seen = new Set<string>();
  for (const n of next) {
    seen.add(n.id);
    const p = prevById.get(n.id);
    if (!p) { changed.push(n.id); continue; }
    if (
      p.x !== n.x || p.y !== n.y || p.width !== n.width ||
      p.parentId !== n.parentId || p.type !== n.type || p.data !== n.data
    ) {
      changed.push(n.id);
    }
  }
  for (const p of prev) if (!seen.has(p.id)) changed.push(p.id);
  return changed.sort().join("|");
}

function buildSessionNodes(): CanvasNode[] {
  const ts = Date.now();
  const out: CanvasNode[] = [];
  let z = 1;
  SESSION_ZONES.forEach((zone, zi) => {
    const x = SESSION_START_X + zi * (SESSION_ZONE_W + SESSION_ZONE_GAP);
    out.push({
      id: `session-Z${zi + 1}-header-${ts}`,
      type: "section-header",
      x,
      y: SESSION_START_Y,
      width: SESSION_COMP_W,
      zIndex: z++,
      data: {
        ...createDefaultData("section-header"),
        number: zone.header.number,
        title: zone.header.title,
        subtitle: zone.header.subtitle,
        color: zone.header.color,
        height: SESSION_HEADER_H,
      },
    });
    let y = SESSION_START_Y + SESSION_HEADER_H + SESSION_NODE_GAP;
    zone.components.forEach((type, ci) => {
      // Let each component carry its own default height (from createDefaultData)
      // so it renders the same as a palette-dragged node. Stack the next node by
      // that actual height, falling back to a comfortable minimum.
      const data = createDefaultData(type);
      const h = typeof data.height === "number" ? data.height : 240;
      out.push({
        id: `session-Z${zi + 1}-${ci}-${ts}`,
        type,
        x,
        y,
        width: SESSION_COMP_W,
        zIndex: z++,
        data,
      });
      y += h + SESSION_NODE_GAP;
    });
  });
  return out;
}

export default function App() {
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    try {
      const saved = localStorage.getItem("prepslate-nodes");
      if (!saved) return INITIAL_NODES;
      const parsed = JSON.parse(saved) as CanvasNode[];
      // Migrate legacy session zone-headers to the taller box the redesigned
      // SectionHeaderNode needs, so the node box (and its selection outline +
      // connection handles) matches the rendered card instead of clipping under it.
      return parsed.map((n) =>
        n.type === "section-header" &&
        typeof n.data?.height === "number" &&
        n.data.height < SESSION_HEADER_H
          ? { ...n, data: { ...n.data, height: SESSION_HEADER_H } }
          : n
      );
    } catch {
      return INITIAL_NODES;
    }
  });
  const [viewport, setViewport] = useState<CanvasViewport>(() => {
    try {
      const saved = localStorage.getItem("prepslate-viewport");
      return saved ? (JSON.parse(saved) as CanvasViewport) : { x: 40, y: 40, zoom: 1.0 };
    } catch {
      return { x: 40, y: 40, zoom: 1.0 };
    }
  });
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDomain, setSelectedDomain] = useState<Domain>("edtech");
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeDragType, setActiveDragType] = useState<CanvasComponentType | null>(null);
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");

  // ─── Session Mode state ─────────────────────────────────────────
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionWorkflow, setSessionWorkflow] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Timer lifted out of CanvasToolbar so Session Mode can reset + start it.
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setTimerSeconds((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  // ─── Undo / redo history ────────────────────────────────────────
  // User node mutations flow through `commitNodes`, which snapshots the
  // pre-change state onto `history`. The canvas calls onNodesChange on every
  // drag mousemove and every keystroke, so a naive "push on every change" stack
  // would record hundreds of micro-steps per gesture. Instead changes are
  // COALESCED by a signature of which nodes meaningfully changed: consecutive
  // changes with the same signature fold into one entry, and `endInteraction`
  // (fired on mouse-up) resets the key so the next gesture is a fresh entry.
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const [history, setHistory] = useState<CanvasNode[][]>([]);
  const [future, setFuture] = useState<CanvasNode[][]>([]);
  const changeKeyRef = useRef<string | null>(null);

  const commitNodes = useCallback(
    (updater: CanvasNode[] | ((prev: CanvasNode[]) => CanvasNode[])) => {
      setNodes((prev) => {
        const next = typeof updater === "function"
          ? (updater as (p: CanvasNode[]) => CanvasNode[])(prev)
          : updater;
        const sig = meaningfulChangeSig(prev, next);
        if (sig && sig !== changeKeyRef.current) {
          setHistory((h) => [...h.slice(-29), prev]); // keep 30 steps
          setFuture([]); // any fresh action invalidates the redo stack
          changeKeyRef.current = sig;
        }
        return next;
      });
    },
    []
  );

  // Gesture boundary: force the next change to open a new history entry, so
  // moving the same node twice in a row is two undo steps, not one coalesced one.
  const endInteraction = useCallback(() => {
    changeKeyRef.current = null;
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [nodesRef.current, ...f.slice(0, 29)]);
      setNodes(prev);
      return h.slice(0, -1);
    });
    changeKeyRef.current = null;
  }, []);

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory((h) => [...h.slice(-29), nodesRef.current]);
      setNodes(next);
      return f.slice(1);
    });
    changeKeyRef.current = null;
  }, []);

  // Persist canvas + viewport so a refresh doesn't lose the board.
  useEffect(() => {
    try { localStorage.setItem("prepslate-nodes", JSON.stringify(nodes)); } catch { /* quota / private mode */ }
  }, [nodes]);
  useEffect(() => {
    try { localStorage.setItem("prepslate-viewport", JSON.stringify(viewport)); } catch { /* quota / private mode */ }
  }, [viewport]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (nodesRef.current.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleStartSession = (workflowId: string) => {
    // Replacing `nodes` wholesale (all-new ids) makes InfiniteCanvas's prune
    // effect drop every existing connection — the canvas is effectively cleared.
    // Guard against silently destroying existing work (P0-1).
    if (nodesRef.current.length > 0) {
      const ok = window.confirm(
        "Starting a session will replace your current canvas with the 7-phase scaffold. Your work will be lost. Continue?"
      );
      if (!ok) {
        setShowSessionModal(false);
        return;
      }
    }
    // Plain setNodes: the scaffold is not an undoable user action. Clear history
    // too, so undo can't reach across into the pre-session canvas.
    setNodes(buildSessionNodes());
    setHistory([]);
    setFuture([]);
    changeKeyRef.current = null;
    setSelectedIds(new Set());
    setViewport({ x: -40, y: -40, zoom: 0.4 });
    setTimerSeconds(0);
    setTimerRunning(true);
    setSessionActive(true);
    setSessionWorkflow(workflowId);
    setSessionStartTime(Date.now());
    setShowSessionModal(false);
  };

  const handleEndSession = () => {
    const ok = window.confirm("End this session? Your canvas stays intact.");
    if (!ok) return;
    setSessionActive(false);
    setSessionWorkflow(null);
    setSessionStartTime(null);
    setTimerRunning(false);
    notification({
      variant: "filled",
      status: "success",
      title: "Session complete",
      description: "Your canvas is saved.",
    });
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (selectedIds.size > 0) {
      commitNodes((prev) => prev.map((n) => selectedIds.has(n.id) ? { ...n, data: { ...n.data, color } } : n));
      changeKeyRef.current = null; // each color click is its own undo step
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Undo / redo (checked first so Cmd/Ctrl+Z isn't shadowed by tool shortcuts).
      if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && ((e.key === "y" || e.key === "Y") || ((e.key === "z" || e.key === "Z") && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.metaKey || e.ctrlKey) return; // don't hijack other browser shortcuts as tools
      if (e.key === "v" || e.key === "V") setToolMode("select");
      if (e.key === "h" || e.key === "H") setToolMode("pan");
      if (e.key === "d" || e.key === "D") setToolMode("draw");
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // `nodes` is needed too: deleteSelected reads it to decide whether deleting a
    // frame would destroy children. Without it the handler confirms against a
    // stale snapshot. (Depending on deleteSelected itself would hit a TDZ — it's
    // declared below this effect.)
  }, [selectedIds, nodes]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragType(event.active.data.current?.type as CanvasComponentType);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragType(null);
    const { active, over } = event;

    // Use a more permissible check. If we are over ANY droppable, or if we have valid coordinates within the container.
    // If over is null, it might mean we dropped outside the window or valid area.
    const containerEl = document.querySelector("[data-canvas-container]");
    if (!containerEl) return;

    // We only proceed if we actually have a valid active type
    const type = active.data.current?.type as CanvasComponentType;
    if (!type) return;

    const rect = containerEl.getBoundingClientRect();
    const finalRect = active.rect.current.translated;

    if (!finalRect) return;

    // Check if the drop is somewhat within the canvas area
    // (optional, but good to prevent dropping back onto the palette if that's somehow possible)
    const isOverCanvas =
      finalRect.left + finalRect.width > rect.left &&
      finalRect.left < rect.right &&
      finalRect.top + finalRect.height > rect.top &&
      finalRect.top < rect.bottom;

    if (!isOverCanvas && !over) return;

    // Calculate center of the dropped item (the drag overlay)
    const dropCenterX = finalRect.left + finalRect.width / 2;
    const dropCenterY = finalRect.top + finalRect.height / 2;

    // Convert to canvas coordinates: (ScreenPx - ContainerTopLeft - PanOffset) / Zoom
    const canvasCenterX = (dropCenterX - rect.left - viewport.x) / viewport.zoom;
    const canvasCenterY = (dropCenterY - rect.top - viewport.y) / viewport.zoom;

    const defaults = COMPONENT_DEFAULTS[type];
    const data = createDefaultData(type);

    // ─── Drop into a frame? (PRD F5) ──────────────────────────────
    // Hit-test the drop point against every frame's SCREEN area, topmost first.
    // A hit re-parents the node and converts its position to frame-local coords.
    const targetFrame = canNestInFrame(type)
      ? [...nodes]
          .filter((n) => n.type === "mobile-frame")
          .sort((a, b) => b.zIndex - a.zIndex)
          .find((f) => {
            const s = getFrameScreenRect(f);
            return (
              canvasCenterX >= s.left && canvasCenterX <= s.left + s.width &&
              canvasCenterY >= s.top && canvasCenterY <= s.top + s.height
            );
          })
      : undefined;

    let newNode: CanvasNode;

    if (targetFrame) {
      const screen = getFrameScreenRect(targetFrame);
      const width = Math.min(defaults.width, screen.width);
      const height = data.height || 60;

      // Center on the cursor, then clamp fully inside the screen.
      const localX = canvasCenterX - screen.left - width / 2;
      const localY = canvasCenterY - screen.top - height / 2;

      newNode = {
        id: `node-${Date.now()}`,
        type,
        parentId: targetFrame.id,
        x: Math.min(Math.max(localX, 0), Math.max(screen.width - width, 0)),
        y: Math.min(Math.max(localY, 0), Math.max(screen.height - height, 0)),
        width,
        zIndex: nodes.length + 1,
        data,
      };
    } else {
      newNode = {
        id: `node-${Date.now()}`,
        type,
        // Center the new node on the drop point
        x: canvasCenterX - (defaults.width / 2),
        // Approximate vertical centering (assuming avg height ~200px?),
        // or just align top if we prefer. Let's center vertically roughly.
        y: canvasCenterY - 100,
        width: defaults.width,
        zIndex: nodes.length + 1,
        data,
      };
    }

    commitNodes((prev) => [...prev, newNode]);
    changeKeyRef.current = null; // the drop is a discrete undo step
    // Do not auto-select on drop, as per user request to avoid confusion with Delete button
    // setSelectedIds(new Set([newNode.id]));
    setToolMode("select");
  };

  // Zoom toward the center of the visible canvas, keeping that point fixed —
  // otherwise the +/- buttons scale toward the origin (0,0) and the content slides
  // off. Mirrors the cursor-anchored wheel zoom in InfiniteCanvas.
  const zoomAtCenter = (mult: number) => {
    setViewport((v) => {
      const zoom = Math.min(Math.max(v.zoom * mult, 0.15), 3);
      const rect = document.querySelector("[data-canvas-container]")?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 : 0;
      const cy = rect ? rect.height / 2 : 0;
      const ratio = zoom / v.zoom;
      return {
        x: cx - (cx - v.x) * ratio,
        y: cy - (cy - v.y) * ratio,
        zoom,
      };
    });
  };
  const zoomIn = () => zoomAtCenter(1.2);
  const zoomOut = () => zoomAtCenter(1 / 1.2);
  const fitToScreen = () => {
    // Roots only: frame children carry frame-local coords, which would drag the
    // bounding box toward the origin and zoom to the wrong place.
    const rootNodes = nodes.filter((n) => !n.parentId);
    if (rootNodes.length === 0) {
      setViewport({ x: 40, y: 40, zoom: 1 });
      return;
    }
    const minX = Math.min(...rootNodes.map((n) => n.x));
    const minY = Math.min(...rootNodes.map((n) => n.y));
    const maxX = Math.max(...rootNodes.map((n) => n.x + (n.width || 300)));
    const maxY = Math.max(...rootNodes.map((n) => n.y + (n.data.height || 300)));
    const containerEl = document.querySelector("[data-canvas-container]");
    const rect = containerEl?.getBoundingClientRect() || { width: 1200, height: 800 };
    const padding = 80;
    const scaleX = (rect.width - padding * 2) / (maxX - minX);
    const scaleY = (rect.height - padding * 2) / (maxY - minY);
    const zoom = Math.min(scaleX, scaleY, 1.5);
    setViewport({
      x: padding - minX * zoom,
      y: padding - minY * zoom,
      zoom,
    });
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Deleting a frame takes its children with it — otherwise they linger in the
  // array, invisible but still exported. Confirm first when contents would be lost.
  const deleteSelected = () => {
    const doomedFrames = framesWithChildren(nodes, selectedIds);
    if (doomedFrames.length > 0) {
      const count = nodes.filter((n) => n.parentId && selectedIds.has(n.parentId)).length;
      const ok = window.confirm(
        `Delete frame and all contents? ${count} element${count === 1 ? "" : "s"} inside will be deleted.`
      );
      if (!ok) return;
    }
    commitNodes((prev) => removeNodesCascade(prev, selectedIds));
    changeKeyRef.current = null; // discrete delete step
    setSelectedIds(new Set());
  };

  const handleExport = async () => {
    const containerEl = document.querySelector("[data-canvas-container]");
    if (!containerEl) return;

    try {
      // Dynamically import html2canvas to avoid SSR issues if any, though this is SPA
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(containerEl as HTMLElement, {
        backgroundColor: "#f8f8fa", // Match canvas background
        scale: 2, // Higher quality
        logging: false,
        ignoreElements: (element: Element) => {
          // Ignore the drawing canvas if it's empty or other UI elements if needed
          return element.classList.contains("pointer-events-none") && element.tagName === "CANVAS";
          // Actually we want to capture the drawing canvas!
          // But maybe we want to ignore the grid background if html2canvas captures it poorly?
          // For now, capture everything.
          return false;
        }
      });

      const date = new Date().toISOString().split("T")[0];
      const link = document.createElement("a");
      link.download = `whiteboard-export-${date}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <CanvasToolbar
          toolMode={toolMode}
          onToolModeChange={setToolMode}
          viewport={viewport}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitToScreen={fitToScreen}
          onClearDrawing={clearDrawing}
          selectedDomain={selectedDomain}
          onDomainChange={setSelectedDomain}
          selectedCount={selectedIds.size}
          onDeleteSelected={deleteSelected}
          onExport={handleExport}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          timerSeconds={timerSeconds}
          timerRunning={timerRunning}
          onToggleTimer={() => setTimerRunning((r) => !r)}
          sessionActive={sessionActive}
          onStartSession={() => setShowSessionModal(true)}
          onEndSession={handleEndSession}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
        />
        <div className="flex flex-1 overflow-hidden">
          <ComponentPalette
            collapsed={paletteCollapsed}
            onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
            sessionActive={sessionActive}
            sessionStartTime={sessionStartTime}
          />
          <div className="flex-1 relative" data-canvas-container>
            <InfiniteCanvas
              nodes={nodes}
              onNodesChange={commitNodes}
              onInteractionEnd={endInteraction}
              viewport={viewport}
              onViewportChange={setViewport}
              toolMode={toolMode}
              onToolModeChange={setToolMode}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              drawingCanvasRef={drawingCanvasRef}
              selectedColor={selectedColor}
              activeDragType={activeDragType}
            />

            {/* First-run empty state (P0-5). Non-blocking: the wrapper ignores
                pointer events so the canvas stays pannable; only the buttons
                are interactive. Vanishes the moment a node exists. */}
            {nodes.length === 0 && !sessionActive && (
              <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center text-center max-w-sm px-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4">
                    <Layout className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Your canvas is empty</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Drag a component from the sidebar, or start a structured session to begin.
                  </p>
                  <div className="mt-5 flex items-center gap-2 pointer-events-auto">
                    <button
                      onClick={() => setPaletteCollapsed(false)}
                      className="px-4 py-2 rounded-md text-sm font-medium border border-border text-foreground hover:bg-secondary transition-colors"
                    >
                      Browse components
                    </button>
                    <button
                      onClick={() => setShowSessionModal(true)}
                      className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Start session →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DragOverlay>
          {activeDragType ? <PaletteItemDragPreview type={activeDragType} /> : null}
        </DragOverlay>

        <SessionModal
          open={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          onStart={handleStartSession}
        />

        {/* AlignUI notification host — fired via notification() (e.g. session end). */}
        <NotificationProvider />
      </div>
    </DndContext>
  );
}
