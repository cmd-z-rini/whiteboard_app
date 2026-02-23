import { useState, useRef, useCallback, useEffect } from "react";
import { GripHorizontal, X, Copy } from "lucide-react";
import type { CanvasNode, CanvasViewport, ToolMode, Edge, ConnectingState } from "./types";
import { COMPONENT_DEFAULTS, createDefaultData } from "./types";
import { CanvasNodeRenderer } from "./CanvasNodeRenderer";
import { ConnectionLayer } from "./ConnectionLayer";
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
  edges: Edge[];
  onEdgesChange: (edges: Edge[]) => void;
  connectingState: ConnectingState;
  onConnectingStateChange: (state: ConnectingState) => void;
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
  edges,
  onEdgesChange,
  connectingState,
  onConnectingStateChange,
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ id: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const pendingMouseX = useRef(0);
  const pendingMouseY = useRef(0);

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

  const getHandlePos = (node: CanvasNode, handle: "top" | "right" | "bottom" | "left") => {
    const width = node.width || COMPONENT_DEFAULTS[node.type]?.width || 200;
    const height = node.data.height || 100;

    switch (handle) {
      case "top": return { x: node.x + width / 2, y: node.y };
      case "right": return { x: node.x + width, y: node.y + height / 2 };
      case "bottom": return { x: node.x + width / 2, y: node.y + height };
      case "left": return { x: node.x, y: node.y + height / 2 };
    }
  };

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: "canvas-droppable",
  });

  // Wheel zoom via native event
  useEffect(() => {
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
  const getLogicPos = useCallback((e: React.MouseEvent | PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  // Mouse Up
  const handleMouseUp = useCallback(() => {
    // Connection completion
    if (connectingState.isConnecting && connectingState.startNodeId) {
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = (pendingMouseX.current - rect.left - viewport.x) / viewport.zoom;
      const mouseY = (pendingMouseY.current - rect.top - viewport.y) / viewport.zoom;

      const targetNode = nodes.find(n => {
        const nodeWidth = n.width || 200;
        const nodeHeight = n.data.height || 100;
        return mouseX >= n.x && mouseX <= n.x + nodeWidth &&
          mouseY >= n.y && mouseY <= n.y + nodeHeight;
      });

      if (targetNode && targetNode.id !== connectingState.startNodeId) {
        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          startNodeId: connectingState.startNodeId,
          endNodeId: targetNode.id,
        };
        onEdgesChange([...edges, newEdge]);
      }
      onConnectingStateChange({ isConnecting: false, startNodeId: null, currentMousePos: null });
    }

    setIsDrawing(false);
    setCurrentPath([]);
    setTempNode(null);
    setDragStart(null);
    setSelectionBox(null);
    setResizeState(null);
    isPanningRef.current = false;
    dragRef.current = null;
  }, [connectingState, nodes, viewport, edges, onEdgesChange, onConnectingStateChange]);

  // Global Connection Drawing Tracking
  useEffect(() => {
    if (!connectingState.isConnecting) return;

    const onPointerMove = (e: PointerEvent) => {
      const pos = getLogicPos(e);
      pendingMouseX.current = e.clientX;
      pendingMouseY.current = e.clientY;
      onConnectingStateChange({
        ...connectingState,
        currentMousePos: pos,
      });
    };

    const onPointerUp = () => {
      handleMouseUp();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [connectingState, getLogicPos, onConnectingStateChange, handleMouseUp]);

  // Mouse Down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getLogicPos(e);
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (effectiveMode === "eraser") return;

    if (effectiveMode === "text") {
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

    if (effectiveMode === "select" && !dragRef.current && !resizeState) {
      const rect = containerRef.current!.getBoundingClientRect();
      setSelectionBox({ x: clientX - rect.left, y: clientY - rect.top, w: 0, h: 0 });
    }
  }, [effectiveMode, getLogicPos, viewport, nodes, onNodesChange, onToolModeChange, onSelectedIdsChange, selectedColor, resizeState]);

  // Start Node Resize
  const startNodeResize = useCallback((e: React.MouseEvent, id: string, handle: "tl" | "tr" | "bl" | "br") => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === id);
    if (!node) return;
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
    pendingMouseX.current = e.clientX;
    pendingMouseY.current = e.clientY;

    if (isDrawing && effectiveMode === "draw") {
      setCurrentPath(prev => [...prev, pos]);
      return;
    }

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

    if (resizeState) {
      const { initialBounds: ib, startMouse, handle } = resizeState;
      const zoom = viewport.zoom;
      const dx = (e.clientX - startMouse.x) / zoom;
      const dy = (e.clientY - startMouse.y) / zoom;

      let newX = ib.x;
      let newY = ib.y;
      let newW = ib.w;
      let newH = ib.h;

      if (handle === "br") { newW = ib.w + dx; newH = ib.h + dy; }
      else if (handle === "bl") { newW = ib.w - dx; newH = ib.h + dy; newX = ib.x + dx; }
      else if (handle === "tr") { newW = ib.w + dx; newH = ib.h - dy; newY = ib.y + dy; }
      else if (handle === "tl") { newW = ib.w - dx; newH = ib.h - dy; newX = ib.x + dx; newY = ib.y + dy; }

      if (e.shiftKey) {
        const ar = ib.w / ib.h;
        if (Math.abs(newW / ib.w) > Math.abs(newH / ib.h)) {
          newH = newW / ar;
          if (handle.includes("t")) newY = ib.y + (ib.h - newH);
        } else {
          newW = newH * ar;
          if (handle.includes("l")) newX = ib.x + (ib.w - newW);
        }
      }

      if (newW < 20) newW = 20;
      if (newH < 20) newH = 20;

      onNodesChange(nodes.map(n => n.id === resizeState.id ? {
        ...n, x: newX, y: newY, width: Math.abs(newW), data: { ...n.data, height: Math.abs(newH) }
      } : n));
      return;
    }

    if (isPanningRef.current) {
      onViewportChange({
        ...viewport,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (connectingState.isConnecting) {
      onConnectingStateChange({ ...connectingState, currentMousePos: pos });
      return;
    }

    if (dragRef.current) {
      const { id, startX, startY, nodeStartX, nodeStartY } = dragRef.current;
      const dx = (e.clientX - startX) / viewport.zoom;
      const dy = (e.clientY - startY) / viewport.zoom;
      onNodesChange(nodes.map((n) => n.id === id ? { ...n, x: nodeStartX + dx, y: nodeStartY + dy } : n));
    }

    if (selectionBox) {
      const rect = containerRef.current!.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      setSelectionBox(prev => ({ ...prev!, w: currentX - prev!.x, h: currentY - prev!.y }));
    }
  }, [effectiveMode, isDrawing, dragStart, tempNode, viewport, getLogicPos, onViewportChange, nodes, onNodesChange, selectionBox, resizeState, connectingState, onConnectingStateChange]);

  const startNodeDrag = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (effectiveMode === "eraser") {
      onNodesChange(nodes.filter(n => n.id !== id));
      onSelectedIdsChange(new Set());
      return;
    }
    if (effectiveMode !== "select") return;
    if (!selectedIds.has(id)) onSelectedIdsChange(new Set([id]));
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, nodeStartX: node.x, nodeStartY: node.y };
  }, [effectiveMode, nodes, onNodesChange, onSelectedIdsChange, selectedIds]);

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
      id="export-canvas-container"
      style={{ cursor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(#d1d5db 1px, transparent 1px)`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 10,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <ConnectionLayer nodes={nodes} edges={edges} connectingState={connectingState} />
      </div>
      <div
        className="absolute z-20"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
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
                onStartConnection={() => {
                  const center = {
                    x: node.x + (node.width || defaults?.width || 200) / 2,
                    y: node.y + (node.data.height || 100) / 2
                  };
                  onConnectingStateChange({ isConnecting: true, startNodeId: node.id, currentMousePos: center });
                }}
              />
              {resizeState && resizeState.id === node.id && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-50 pointer-events-none">
                  {Math.round(node.width)} × {Math.round(node.data.height || 0)}
                </div>
              )}
            </div>
          );
        })}
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
      {isDrawing && currentPath.length > 1 && (
        <svg className="absolute inset-0 pointer-events-none z-50">
          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
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