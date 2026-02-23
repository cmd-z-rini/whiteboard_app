import { useState, useRef, useEffect } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import type { CanvasNode, CanvasViewport, ToolMode, CanvasComponentType } from "./components/canvas/types";
import { Toaster, toast } from "sonner";
import { COMPONENT_DEFAULTS, createDefaultData, type Edge, type ConnectingState } from "./components/canvas/types";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";
import { ComponentPalette, PaletteItemDragPreview } from "./components/canvas/ComponentPalette";
import { CanvasToolbar } from "./components/canvas/CanvasToolbar";
import type { Domain } from "./components/DomainSelector";

// ─── Initial template layout ─────────────────────────────────────
const INITIAL_NODES: CanvasNode[] = [];

export default function App() {
  const [nodes, setNodes] = useState<CanvasNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [viewport, setViewport] = useState<CanvasViewport>({ x: 40, y: 40, zoom: 1.0 });
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDomain, setSelectedDomain] = useState<Domain>("edtech");
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeDragType, setActiveDragType] = useState<CanvasComponentType | null>(null);
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");
  const [connectingState, setConnectingState] = useState<ConnectingState>({
    isConnecting: false,
    startNodeId: null,
    currentMousePos: null,
  });

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (selectedIds.size > 0) {
      setNodes((prev) => prev.map((n) => selectedIds.has(n.id) ? { ...n, data: { ...n.data, color } } : n));
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
      if (e.key === "v" || e.key === "V") setToolMode("select");
      if (e.key === "h" || e.key === "H") setToolMode("pan");
      if (e.key === "d" || e.key === "D") setToolMode("draw");
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
        setNodes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
        setEdges((prev) => prev.filter((e) => !selectedIds.has(e.startNodeId) && !selectedIds.has(e.endNodeId)));
        setSelectedIds(new Set());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds]);

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

    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type,
      // Center the new node on the drop point
      x: canvasCenterX - (defaults.width / 2),
      // Approximate vertical centering (assuming avg height ~200px?), 
      // or just align top if we prefer. Let's center vertically roughly.
      y: canvasCenterY - 100,
      width: defaults.width,
      zIndex: nodes.length + 1,
      data: createDefaultData(type),
    };

    setNodes((prev) => [...prev, newNode]);
    // Do not auto-select on drop, as per user request to avoid confusion with Delete button
    // setSelectedIds(new Set([newNode.id])); 
    setToolMode("select");
  };

  const zoomIn = () => {
    setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.2, 3) }));
  };
  const zoomOut = () => {
    setViewport((v) => ({ ...v, zoom: Math.max(v.zoom / 1.2, 0.15) }));
  };
  const fitToScreen = () => {
    if (nodes.length === 0) {
      setViewport({ x: 40, y: 40, zoom: 1 });
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + (n.width || 300)));
    const maxY = Math.max(...nodes.map((n) => n.y + 300));
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

  const deleteSelected = () => {
    setNodes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const containerEl = document.getElementById("export-canvas-container");
    if (!containerEl) {
      toast.error("Canvas container not found");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Downloading canvas...");

    try {
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(containerEl as HTMLElement, {
        backgroundColor: "#f8f8fa",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement("a");
      link.download = "whiteboard-session.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Download complete!", { id: toastId });
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed. Please try again.", { id: toastId });
    } finally {
      setIsExporting(false);
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
          isExporting={isExporting}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
        />
        <div className="flex flex-1 overflow-hidden">
          <ComponentPalette
            collapsed={paletteCollapsed}
            onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
          />
          <div className="flex-1 relative" data-canvas-container>
            <InfiniteCanvas
              nodes={nodes}
              onNodesChange={setNodes}
              viewport={viewport}
              onViewportChange={setViewport}
              toolMode={toolMode}
              onToolModeChange={setToolMode}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              drawingCanvasRef={drawingCanvasRef}
              selectedColor={selectedColor}
              edges={edges}
              onEdgesChange={setEdges}
              connectingState={connectingState}
              onConnectingStateChange={setConnectingState}
            />
          </div>
        </div>
        <DragOverlay>
          {activeDragType ? <PaletteItemDragPreview type={activeDragType} /> : null}
        </DragOverlay>
        <Toaster position="top-center" />
      </div>
    </DndContext>
  );
}
