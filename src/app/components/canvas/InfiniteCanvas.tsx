import { useState, useRef, useCallback, useEffect } from "react";
import { GripHorizontal, X, Copy } from "lucide-react";
import type { CanvasNode, CanvasViewport, ToolMode } from "./types";
import { COMPONENT_DEFAULTS, createDefaultData } from "./types";
import { CanvasNodeRenderer } from "./CanvasNodeRenderer";
import { useDroppable } from "@dnd-kit/core";

interface InfiniteCanvasProps {
  nodes: CanvasNode[];
  onNodesChange: (nodes: CanvasNode[]) => void;
  viewport: CanvasViewport;
  onViewportChange: (vp: CanvasViewport) => void;
  toolMode: ToolMode;
  onToolModeChange?: (mode: ToolMode) => void;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  selectedColor?: string;
}

export function InfiniteCanvas({
  nodes,
  onNodesChange,
  viewport,
  onViewportChange,
  toolMode,
  onToolModeChange,
  selectedIds,
  onSelectedIdsChange,
  drawingCanvasRef, // Kept for prop compatibility but unused
  selectedColor = "bg-blue-500",
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ id: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState("#1a1a2e");
  const [drawWidth, setDrawWidth] = useState(4);

  // Shape/Selection State
  const [tempNode, setTempNode] = useState<CanvasNode | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeState, setResizeState] = useState<{
    id: string;
    initialBounds: { x: number; y: number; w: number; h: number };
    startMouse: { x: number; y: number };
    handle: "tl" | "tr" | "bl" | "br";
  } | null>(null);

  const zCounterRef = useRef(nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) + 1 : 1);

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: "canvas-droppable",
  });

  // Wheel zoom via native event
  useEffect(() => {
    // ... (existing wheel logic)
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      if (e.deltaY > 0) {
        onViewportChange({
          x: mouseX - (mouseX - viewport.x) * (1 / 1.08),
          y: mouseY - (mouseY - viewport.y) * (1 / 1.08),
          zoom: Math.max(viewport.zoom / 1.08, 0.15),
        });
      } else {
        onViewportChange({
          x: mouseX - (mouseX - viewport.x) * 1.08,
          y: mouseY - (mouseY - viewport.y) * 1.08,
          zoom: Math.min(viewport.zoom * 1.08, 3),
        });
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [viewport, onViewportChange]);

  // Space key and V shortcut
  useEffect(() => {
    // ... (existing key logic)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.key === "v" || e.key === "V") {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          onToolModeChange?.("select");
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [onToolModeChange]);

  const effectiveMode = spaceHeld ? "pan" : toolMode;

  // Helper to get logic coordinates
  const getLogicPos = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  // Mouse Down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // ... (existing mouse down logic)
    const pos = getLogicPos(e);
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (effectiveMode === "eraser") return;

    if (effectiveMode === "text") {
      // ... (existing text logic)
      const defaults = COMPONENT_DEFAULTS["simple-text"];
      const newNode: CanvasNode = {
        id: `node-${Date.now()}`,
        type: "simple-text",
        x: pos.x,
        y: pos.y - 10,
        width: defaults.width,
        zIndex: nodes.length + 1,
        data: { ...createDefaultData("simple-text"), color: selectedColor },
      };
      onNodesChange([...nodes, newNode]);
      onSelectedIdsChange(new Set([newNode.id]));
      onToolModeChange?.("select");
      return;
    }

    if (effectiveMode === "shape" || effectiveMode === "circle") {
      setDragStart(pos);
      setTempNode({
        id: `temp-${Date.now()}`,
        type: effectiveMode === "circle" ? "simple-circle" : "simple-shape",
        x: pos.x,
        y: pos.y,
        width: 0,
        zIndex: 9999,
        data: { ...createDefaultData(effectiveMode === "circle" ? "simple-circle" : "simple-shape"), height: 0 },
      });
      return;
    }

    if (effectiveMode === "draw") {
      setIsDrawing(true);
      setCurrentPath([pos]);
      return;
    }

    if (effectiveMode === "pan" || e.button === 1) {
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { x: clientX - viewport.x, y: clientY - viewport.y };
      return;
    }

    if (effectiveMode === "select" && !dragRef.current && !resizeState) { // Only box select if not resizing/dragging
      const rect = containerRef.current!.getBoundingClientRect();
      setSelectionBox({ x: clientX - rect.left, y: clientY - rect.top, w: 0, h: 0 });
    }
  }, [effectiveMode, getLogicPos, viewport, nodes, onNodesChange, onToolModeChange, onSelectedIdsChange, selectedColor, resizeState]);

  // Start Node Resize
  const startNodeResize = useCallback((e: React.MouseEvent, id: string, handle: "tl" | "tr" | "bl" | "br") => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    // Ensure height is set for logic
    const height = node.data.height || 100;

    setResizeState({
      id,
      initialBounds: { x: node.x, y: node.y, w: node.width, h: height },
      startMouse: { x: e.clientX, y: e.clientY },
      handle,
    });
  }, [nodes]);


  // Mouse Move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getLogicPos(e);

    // Drawing
    if (isDrawing && effectiveMode === "draw") {
      setCurrentPath(prev => [...prev, pos]);
      return;
    }

    // Shape Resize (User Creating Shape)
    if (tempNode && dragStart) {
      let width = pos.x - dragStart.x;
      let height = pos.y - dragStart.y;

      if (e.shiftKey) {
        const size = Math.max(Math.abs(width), Math.abs(height));
        width = width < 0 ? -size : size;
        height = height < 0 ? -size : size;
      }

      setTempNode({
        ...tempNode,
        width: Math.abs(width),
        x: width < 0 ? pos.x : dragStart.x,
        y: height < 0 ? pos.y : dragStart.y,
        data: { ...tempNode.data, height: Math.abs(height) }
      });
      return;
    }

    // Interactive Node Resizing
    if (resizeState) {
      const { initialBounds: ib, startMouse, handle } = resizeState;
      const zoom = viewport.zoom;
      const dx = (e.clientX - startMouse.x) / zoom;
      const dy = (e.clientY - startMouse.y) / zoom;

      let newX = ib.x;
      let newY = ib.y;
      let newW = ib.w;
      let newH = ib.h;

      // Logic per handle
      if (handle === "br") { newW = ib.w + dx; newH = ib.h + dy; }
      else if (handle === "bl") { newW = ib.w - dx; newH = ib.h + dy; newX = ib.x + dx; }
      else if (handle === "tr") { newW = ib.w + dx; newH = ib.h - dy; newY = ib.y + dy; }
      else if (handle === "tl") { newW = ib.w - dx; newH = ib.h - dy; newX = ib.x + dx; newY = ib.y + dy; }

      // Aspect Ratio (Shift)
      if (e.shiftKey) {
        // This is tricky for non-br handles, but simple approximation:
        // Use the dominant dimension change
        const ar = ib.w / ib.h;
        if (handle === "br" || handle === "tl") {
          // For simplicity, just sync width/height change if creating from scratch or use AR
          // Let's just create a square change if no prior AR, but we have existing AR.
          // If we want perfect square, we force AR=1? FigJam keeps AR usually.
          // Let's force AR.
          if (Math.abs(newW / ib.w) > Math.abs(newH / ib.h)) {
            newH = newW / ar;
            if (handle.includes("t")) newY = ib.y + (ib.h - newH); // fix top anchor
          } else {
            newW = newH * ar;
            if (handle.includes("l")) newX = ib.x + (ib.w - newW); // fix left anchor
          }
        }
        // Similar logic for other handles... simplified "square" resizing often suffices for MVP.
        // Let's stick to the simple square/circle logic which is aspect ratio 1:1 if it was 1:1
      }

      // Center Resize (Alt)
      if (e.altKey) {
        // This is complex to combine with handles. 
        // Simple center resize:
        // double the delta applies to WH, and XY moves by delta (inv)
        // MVP: Skip Alt for now to reduce risk, focus on Handles working perfectly first.
      }

      // Min Size
      if (newW < 20) newW = 20;
      if (newH < 20) newH = 20;

      onNodesChange(nodes.map(n => n.id === resizeState.id ? {
        ...n,
        x: newX,
        y: newY,
        width: Math.abs(newW),
        data: { ...n.data, height: Math.abs(newH) }
      } : n));

      return;
    }

    // Panning
    if (isPanningRef.current) {
      onViewportChange({
        ...viewport,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    // Dragging Nodes
    if (dragRef.current) {
      const { id, startX, startY, nodeStartX, nodeStartY } = dragRef.current;
      const dx = (e.clientX - startX) / viewport.zoom;
      const dy = (e.clientY - startY) / viewport.zoom;
      onNodesChange(
        nodes.map((n) =>
          n.id === id ? { ...n, x: nodeStartX + dx, y: nodeStartY + dy } : n
        )
      );
    }

    // Selection Box
    if (selectionBox) {
      const rect = containerRef.current!.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      setSelectionBox(prev => ({
        ...prev!,
        w: currentX - prev!.x,
        h: currentY - prev!.y
      }));
    }
  }, [effectiveMode, isDrawing, dragStart, tempNode, viewport, getLogicPos, onViewportChange, dragRef, nodes, onNodesChange, selectionBox, resizeState]);

  // Mouse Up
  const handleMouseUp = useCallback(() => {
    // ... (Drawing/Shape/Box completion logic same as before)
    if (isDrawing && currentPath.length > 2) {
      const xs = currentPath.map(p => p.x);
      const ys = currentPath.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const width = maxX - minX;
      const height = maxY - minY;
      const svgPath = `M ${currentPath.map(p => `${p.x - minX} ${p.y - minY}`).join(" L ")}`;

      const newNode: CanvasNode = {
        id: `pencil-${Date.now()}`,
        type: "pencil",
        x: minX,
        y: minY,
        width: Math.max(width, 10),
        zIndex: zCounterRef.current++,
        data: {
          path: svgPath,
          height: Math.max(height, 10),
          color: drawColor,
          strokeWidth: drawWidth
        },
      };
      onNodesChange([...nodes, newNode]);
    }

    if (tempNode && tempNode.width > 5) {
      onNodesChange([...nodes, tempNode]);
      onToolModeChange?.("select");
    }

    if (selectionBox) {
      const selLeft = Math.min(selectionBox.x, selectionBox.x + selectionBox.w) / viewport.zoom - viewport.x / viewport.zoom;
      const selTop = Math.min(selectionBox.y, selectionBox.y + selectionBox.h) / viewport.zoom - viewport.y / viewport.zoom;
      const selRight = Math.max(selectionBox.x, selectionBox.x + selectionBox.w) / viewport.zoom - viewport.x / viewport.zoom;
      const selBottom = Math.max(selectionBox.y, selectionBox.y + selectionBox.h) / viewport.zoom - viewport.y / viewport.zoom;

      const intersectingNodes = nodes.filter(n => {
        const nRight = n.x + (n.width || 300);
        const nBottom = n.y + (n.data.height || 200);
        return n.x < selRight && nRight > selLeft && n.y < selBottom && nBottom > selTop;
      });

      const newIds = new Set(intersectingNodes.map(n => n.id));
      onSelectedIdsChange(newIds);
    }

    setIsDrawing(false);
    setCurrentPath([]);
    setTempNode(null);
    setDragStart(null);
    setSelectionBox(null);
    setResizeState(null); // Clear resize
    isPanningRef.current = false;
    dragRef.current = null;
  }, [isDrawing, currentPath, tempNode, nodes, onNodesChange, toolMode, drawColor, drawWidth, selectionBox, viewport, onSelectedIdsChange]);


  // Node Interaction Handlers
  const startNodeDrag = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (effectiveMode === "eraser") {
      onNodesChange(nodes.filter(n => n.id !== id));
      onSelectedIdsChange(new Set());
      return;
    }

    if (effectiveMode !== "select") return;

    // If resizing, ignore drag (though onResize prop stopPropagation should handle this)

    // Select node if not selected
    if (!selectedIds.has(id)) {
      // If shift is held, toggle selection? For now simple select.
      onSelectedIdsChange(new Set([id]));
    }

    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    // Bring to front
    // zCounterRef.current += 1;
    // onNodesChange(nodes.map((n) => n.id === id ? { ...n, zIndex: zCounterRef.current } : n));
    // Actually bringing to front on every click is annoying for layout, maybe only on actual drag start?
    // Let's keep it for now as it's standard drawing app behavior.

    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    };
  }, [effectiveMode, nodes, onNodesChange, onSelectedIdsChange, selectedIds]);


  // Cursor Style
  let cursor = "default";
  if (effectiveMode === "pan") cursor = isPanningRef.current ? "grabbing" : "grab";
  else if (effectiveMode === "draw") cursor = "crosshair";
  else if (effectiveMode === "shape" || effectiveMode === "text" || effectiveMode === "circle") cursor = "text";
  else if (effectiveMode === "eraser") cursor = "alias";

  return (
    <div
      ref={(node) => {
        // @ts-ignore
        containerRef.current = node;
        setDroppableRef(node);
      }}
      className="flex-1 w-full h-full min-h-screen overflow-hidden relative bg-[#f8f8fa]"
      style={{ cursor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(#d1d5db 1px, transparent 1px)`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* Main Content Layer */}
      <div
        className="absolute z-10"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedIds.has(node.id);
          const defaults = COMPONENT_DEFAULTS[node.type];
          return (
            <div
              key={node.id}
              className={`absolute group/node ${effectiveMode === "draw" || effectiveMode === "shape" ? "pointer-events-none" : ""}`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width || defaults?.width || 200,
                height: node.data.height ? node.data.height : "auto",
                minHeight: node.data.height || 40,
                zIndex: node.zIndex,
              }}
              onMouseDown={(e) => startNodeDrag(e, node.id)}
            >
              <CanvasNodeRenderer
                node={node}
                onUpdate={(data) => onNodesChange(nodes.map(n => n.id === node.id ? { ...n, data } : n))}
                isSelected={isSelected}
                onStartDrag={(e) => startNodeDrag(e, node.id)}
                onResizeStart={(e, h) => startNodeResize(e, node.id, h)}
                onDelete={() => onNodesChange(nodes.filter(n => n.id !== node.id))}
                onDuplicate={() => {/* duplicate */ }}
              />

              {/* Resize Label Overlay (Optimization: Only show for resizing node) */}
              {resizeState && resizeState.id === node.id && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-50 pointer-events-none">
                  {Math.round(node.width)} × {Math.round(node.data.height || 0)}
                </div>
              )}
            </div>
          );
        })}

        {/* Temp Shape */}
        {tempNode && (
          <div
            className="absolute border-2 border-slate-400 border-dashed pointer-events-none"
            style={{
              left: tempNode.x,
              top: tempNode.y,
              width: tempNode.width,
              height: tempNode.data.height,
              zIndex: 9999
            }}
          />
        )}
      </div>

      {/* Active Drawing SVG Overlay */}
      {isDrawing && currentPath.length > 1 && (
        <svg className="absolute inset-0 pointer-events-none z-50">
          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
            {/* Same path rendering */}
            <path
              d={`M ${currentPath.map(p => `${p.x} ${p.y}`).join(" L ")}`}
              stroke={drawColor}
              strokeWidth={drawWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      )}

      {/* Selection Box */}
      {selectionBox && (
        <div
          className="absolute bg-blue-500/10 border border-blue-400 pointer-events-none z-50"
          style={{
            left: Math.min(selectionBox.x, selectionBox.x + selectionBox.w),
            top: Math.min(selectionBox.y, selectionBox.y + selectionBox.h),
            width: Math.abs(selectionBox.w),
            height: Math.abs(selectionBox.h),
          }}
        />
      )}

      {/* Drawing Toolbar */}
      {effectiveMode === "draw" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-xl shadow-lg border border-border px-4 py-2 z-50">
          {["#1a1a2e", "#e74c3c", "#2ecc71", "#3498db"].map((c) => (
            <button
              key={c}
              onClick={() => setDrawColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${drawColor === c ? "border-primary" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}