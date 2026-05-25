import { useState, useRef, useCallback, useEffect } from "react";
import { GripHorizontal, X, Copy } from "lucide-react";
import type { CanvasNode, CanvasViewport, ToolMode, Connection } from "./types";
import { COMPONENT_DEFAULTS, createDefaultData } from "./types";
import { CanvasNodeRenderer } from "./CanvasNodeRenderer";
import { useDroppable } from "@dnd-kit/core";
import { ConnectionLayer } from "./ConnectionLayer";

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

  // Add to InfiniteCanvas component state
const [connections, setConnections] = useState<Connection[]>([]);
const [connectionDraft, setConnectionDraft] = useState<{
  sourceId: string;
  sourceHandle: "top" | "right" | "bottom" | "left";
  mouseX: number;
  mouseY: number;
} | null>(null);

// Add connection mode to toolbar (in parent App component)
// toolMode can now be: "select" | "draw" | "shape" | "text" | "connect" | ...

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

// 2. ADD INTERACTION HANDLER 
  const startConnection = useCallback((
    sourceId: string,
    handle: "top" | "right" | "bottom" | "left"
  ) => {
    setConnectionDraft({ sourceId, sourceHandle: handle, mouseX: 0, mouseY: 0 });
  }, []);

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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
  const pos = getLogicPos(e);

  // 3. ADD MOUSEMOVE TRACKER 
    if (connectionDraft) {
      const pos = getLogicPos(e);
      setConnectionDraft({ ...connectionDraft, mouseX: pos.x, mouseY: pos.y });
      return;
    }

  // ─────────────────────────────────────────────────────────────
  // 1. DRAWING MODE (Pencil Tool)
  // ─────────────────────────────────────────────────────────────
  if (isDrawing && effectiveMode === "draw") {
    setCurrentPath(prev => [...prev, pos]);
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SHAPE CREATION (Rectangle/Circle Dragging)
  // ─────────────────────────────────────────────────────────────
  if (tempNode && dragStart) {
    // Delta in logic space (already handled by getLogicPos)
    let width = pos.x - dragStart.x;
    let height = pos.y - dragStart.y;

    // Shift: Lock aspect ratio to 1:1 (square/circle)
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

  // ─────────────────────────────────────────────────────────────
  // 3. NODE RESIZE (8-Handle Transformer)
  // ─────────────────────────────────────────────────────────────
  if (resizeState) {
    const { id, initialBounds: ib, startMouse, handle } = resizeState;
    
    // Calculate screen-space delta, then convert to logic space
    const screenDx = e.clientX - startMouse.x;
    const screenDy = e.clientY - startMouse.y;
    const dx = screenDx / viewport.zoom;
    const dy = screenDy / viewport.zoom;

    let newX = ib.x;
    let newY = ib.y;
    let newW = ib.w;
    let newH = ib.h;

    // Apply delta based on handle direction
    switch (handle) {
      case "br": // Bottom-Right (standard resize)
        newW = ib.w + dx;
        newH = ib.h + dy;
        break;
      case "bl": // Bottom-Left
        newW = ib.w - dx;
        newH = ib.h + dy;
        newX = ib.x + dx;
        break;
      case "tr": // Top-Right
        newW = ib.w + dx;
        newH = ib.h - dy;
        newY = ib.y + dy;
        break;
      case "tl": // Top-Left
        newW = ib.w - dx;
        newH = ib.h - dy;
        newX = ib.x + dx;
        newY = ib.y + dy;
        break;
    }

    // Shift: Preserve aspect ratio
    if (e.shiftKey) {
      const aspectRatio = ib.w / ib.h;
      
      // Use dominant axis (larger change) to drive the resize
      if (Math.abs(newW - ib.w) > Math.abs(newH - ib.h)) {
        // Width changed more → height follows
        newH = newW / aspectRatio;
        
        // Fix anchor point for top handles
        if (handle === "tl" || handle === "tr") {
          newY = ib.y + ib.h - newH;
        }
      } else {
        // Height changed more → width follows
        newW = newH * aspectRatio;
        
        // Fix anchor point for left handles
        if (handle === "tl" || handle === "bl") {
          newX = ib.x + ib.w - newW;
        }
      }
    }

    // Alt: Center-origin resize (scale from center, not corner)
    if (e.altKey) {
      const wDelta = newW - ib.w;
      const hDelta = newH - ib.h;
      
      newW = ib.w + wDelta * 2;
      newH = ib.h + hDelta * 2;
      newX = ib.x - wDelta;
      newY = ib.y - hDelta;
    }

    // Enforce minimum size (prevent negative/collapsed nodes)
    const MIN_SIZE = 20;
    if (newW < MIN_SIZE) {
      if (handle.includes("l")) newX = ib.x + ib.w - MIN_SIZE;
      newW = MIN_SIZE;
    }
    if (newH < MIN_SIZE) {
      if (handle.includes("t")) newY = ib.y + ib.h - MIN_SIZE;
      newH = MIN_SIZE;
    }

    // Update node (surgical re-render: only the resizing node)
    onNodesChange(nodes.map(n => n.id === id ? {
      ...n,
      x: newX,
      y: newY,
      width: newW,
      data: { ...n.data, height: newH }
    } : n));

    return;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. CANVAS PANNING (Space Key / Middle Mouse)
  // ─────────────────────────────────────────────────────────────
  if (isPanningRef.current) {
    // Pan operates in SCREEN space (viewport.x/y are screen pixels)
    onViewportChange({
      ...viewport,
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. NODE DRAGGING (Move Selected Elements)
  // ─────────────────────────────────────────────────────────────
  if (dragRef.current) {
    const { id, startX, startY, nodeStartX, nodeStartY } = dragRef.current;
    
    // Calculate screen delta, convert to logic space
    const screenDx = e.clientX - startX;
    const screenDy = e.clientY - startY;
    const logicDx = screenDx / viewport.zoom;
    const logicDy = screenDy / viewport.zoom;
    
    // Apply delta to initial position (not current position!)
    onNodesChange(
      nodes.map((n) =>
        n.id === id ? { 
          ...n, 
          x: nodeStartX + logicDx, 
          y: nodeStartY + logicDy 
        } : n
      )
    );
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // 6. BOX SELECTION (Shift+Drag Multi-Select)
  // ─────────────────────────────────────────────────────────────
  if (selectionBox) {
    const rect = containerRef.current!.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    // Selection box operates in SCREEN space (rendered on top of canvas)
    setSelectionBox(prev => ({
      ...prev!,
      w: currentX - prev!.x,
      h: currentY - prev!.y
    }));
    return;
  }
}, [
  effectiveMode, 
  isDrawing, 
  dragStart, 
  tempNode, 
  viewport, 
  getLogicPos, 
  onViewportChange, 
  dragRef, 
  nodes, 
  onNodesChange, 
  selectionBox, 
  resizeState
]);


  // Mouse Up
const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // ... (Drawing/Shape/Box completion logic same as before)

    // Update handleMouseUp to finalize connection
if (connectionDraft) {
  // Check if mouse is over a node (target)
  const pos = getLogicPos(e);
  const targetNode = nodes.find(n => {
    const height = n.data.height || 100;
    return pos.x >= n.x && pos.x <= n.x + n.width &&
           pos.y >= n.y && pos.y <= n.y + height;
  });
  
  if (targetNode && targetNode.id !== connectionDraft.sourceId) {
// Smart handle detection based on relative position
        const dx = targetNode.x - nodes.find(n => n.id === connectionDraft.sourceId)!.x;
        const dy = targetNode.y - nodes.find(n => n.id === connectionDraft.sourceId)!.y;
        let detectedTargetHandle: "top" | "right" | "bottom" | "left" = "left";

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal bias: Check if target is to the left or right
          detectedTargetHandle = dx > 0 ? "left" : "right";
        } else {
          // Vertical bias: Check if target is above or below
          detectedTargetHandle = dy > 0 ? "top" : "bottom";
        }

        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          sourceId: connectionDraft.sourceId,
          targetId: targetNode.id,
          sourceHandle: connectionDraft.sourceHandle,
          targetHandle: detectedTargetHandle,
          style: "orthogonal",
        };
    setConnections([...connections, newConnection]);
  }
  
  setConnectionDraft(null);
  return;
}


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

      {/* Connection Layer (renders BELOW nodes so handles are clickable) */}
      <ConnectionLayer
        nodes={nodes}
        connections={connections}
        viewport={viewport}
        onConnectionUpdate={(id, updates) => {
          setConnections(connections.map(c => 
            c.id === id ? { ...c, ...updates } : c
          ));
        }}
        selectedConnectionId={undefined}
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

              {/* Connection Handles (Show when node is selected or in select mode) */}
              {isSelected && effectiveMode === "select" && (
                <>
                  {(["top", "right", "bottom", "left"] as const).map((pos) => {
                    const handleClass = 
                      pos === "top" ? "-top-1.5 left-1/2 -translate-x-1/2" :
                      pos === "right" ? "-right-1.5 top-1/2 -translate-y-1/2" :
                      pos === "bottom" ? "-bottom-1.5 left-1/2 -translate-x-1/2" :
                      "-left-1.5 top-1/2 -translate-y-1/2";
                    
                    return (
                      <div
                        key={pos}
                        className={`absolute w-3 h-3 rounded-full bg-blue-500 border-2 border-white cursor-crosshair hover:scale-125 transition-transform z-50 ${handleClass}`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          startConnection(node.id, pos);
                        }}
                      />
                    );
                  })}
                </>
              )}

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

      {/* Draft Connection Preview (while dragging) */}
      {connectionDraft && (
        <svg className="absolute inset-0 pointer-events-none z-30">
          <defs>
            <marker
              id="draft-arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
            </marker>
          </defs>
          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
            {(() => {
              const sourceNode = nodes.find(n => n.id === connectionDraft.sourceId);
              if (!sourceNode) return null;
              
              // Calculate source anchor point
              const height = sourceNode.data.height || 100;
              let sourceX = sourceNode.x;
              let sourceY = sourceNode.y;
              
              switch (connectionDraft.sourceHandle) {
                case "top":
                  sourceX += sourceNode.width / 2;
                  break;
                case "right":
                  sourceX += sourceNode.width;
                  sourceY += height / 2;
                  break;
                case "bottom":
                  sourceX += sourceNode.width / 2;
                  sourceY += height;
                  break;
                case "left":
                  sourceY += height / 2;
                  break;
              }
              
              return (
                <line
                  x1={sourceX}
                  y1={sourceY}
                  x2={connectionDraft.mouseX}
                  y2={connectionDraft.mouseY}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  markerEnd="url(#draft-arrowhead)"
                />
              );
            })()}
          </g>
        </svg>
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