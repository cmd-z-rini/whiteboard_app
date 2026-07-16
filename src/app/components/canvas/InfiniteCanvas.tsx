import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { GripHorizontal, X, Copy } from "lucide-react";
import type { CanvasNode, CanvasViewport, ToolMode, Connection, CanvasComponentType } from "./types";
import { COMPONENT_DEFAULTS, createDefaultData, getFrameScreenSize, removeNodesCascade, canNestInFrame, usesFixedHeight } from "./types";
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
  /** Type currently being dragged from the palette, for drop-target highlighting. */
  activeDragType?: CanvasComponentType | null;
  /** Fired at the end of a mouse gesture so App's undo coalescer can close the
   *  current history entry (next change starts a fresh one). */
  onInteractionEnd?: () => void;
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
  activeDragType = null,
  onInteractionEnd,
}: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  // Group drag: `items` snapshots the start position of every node being moved
  // (the whole selection when the grabbed node is part of it, otherwise just the
  // one). Deltas are applied to these snapshots, never to live positions, so the
  // move can't compound across mousemoves.
  const dragRef = useRef<{ startX: number; startY: number; items: { id: string; x: number; y: number }[] } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Latest viewport, read by the native wheel handler. The handler is registered
  // once (empty deps) so rapid wheel bursts don't pile up against a stale closure
  // and drift the cursor anchor — it reads the freshest value through this ref.
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Add to InfiniteCanvas component state
const [connections, setConnections] = useState<Connection[]>([]);
const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
const [connectionDraft, setConnectionDraft] = useState<{
  sourceId: string;
  sourceHandle: "top" | "right" | "bottom" | "left";
  mouseX: number;
  mouseY: number;
} | null>(null);

// Re-attaching an existing arrow's endpoint (FigJam-style). Owned here because
// this component owns both `connections` and node hit-testing.
const [endpointDrag, setEndpointDrag] = useState<{
  connId: string;
  end: "source" | "target";
  cursor: { x: number; y: number };
  hoverId: string | null;
} | null>(null);

// Live rendered heights per node id. Most cards are height:auto and never set
// data.height, so connection anchoring would otherwise fall back to a flat 100px
// and arrows would attach at the wrong vertical spot ("random"-looking routes).
const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
const nodeElsRef = useRef(new Map<string, HTMLElement>());

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
    // Snapshot of child geometry at resize start. Scaling must be derived from
    // this, not from current positions — otherwise each mousemove compounds the
    // scale factor and children fly off the screen.
    initialChildren?: { id: string; x: number; y: number; width: number; height: number }[];
  } | null>(null);

  const zCounterRef = useRef(nodes.length > 0 ? Math.max(...nodes.map((n) => n.zIndex)) + 1 : 1);

  // ─── Roots vs. frame children ───────────────────────────────────
  // Children live inside a frame's screen with FRAME-LOCAL x/y. Every piece of
  // canvas-space geometry below (box select, connection hit-testing, the node
  // map) must iterate roots only, or it will treat local coords as canvas coords.
  const rootNodes = useMemo(() => nodes.filter((n) => !n.parentId), [nodes]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, CanvasNode[]>();
    for (const n of nodes) {
      if (!n.parentId) continue;
      const siblings = map.get(n.parentId) || [];
      siblings.push(n);
      map.set(n.parentId, siblings);
    }
    return map;
  }, [nodes]);

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
      const vp = viewportRef.current;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Normalize the wheel delta across devices (pixels / lines / pages) so the
      // same physical scroll zooms the same amount everywhere.
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;                // lines → ~px
      else if (e.deltaMode === 2) delta *= rect.height;  // pages → viewport height

      // Exponential mapping keeps the zoom *rate* uniform — every event scales by
      // a ratio proportional to how far it scrolled. The constant sets sensitivity:
      // 0.0015 was over-damped, leaving a trackpad's small per-event deltas (~1-15px)
      // barely zooming. 0.01 restores responsiveness there; the tight [0.8, 1.25]
      // clamp (max ±25% per event) keeps a mouse wheel's large deltas from jumping.
      const factor = Math.min(Math.max(Math.exp(-delta * 0.01), 0.8), 1.25);
      const zoom = Math.min(Math.max(vp.zoom * factor, 0.15), 3);

      // Keep the logic point under the cursor fixed. Derive the shift from the
      // *actual* zoom change (ratio), so at the 0.15/3 clamp the pan doesn't drift.
      const ratio = zoom / vp.zoom;
      onViewportChange({
        x: mouseX - (mouseX - vp.x) * ratio,
        y: mouseY - (mouseY - vp.y) * ratio,
        zoom,
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [onViewportChange]);

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
      // Delete the selected connection. Selecting a connection clears the node
      // selection (and vice versa), so App's node-delete handler and this one can
      // never both fire on the same keypress.
      if ((e.key === "Delete" || e.key === "Backspace") && selectedConnectionId) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setConnections((prev) => prev.filter((c) => c.id !== selectedConnectionId));
        setSelectedConnectionId(null);
      }
      if (e.key === "Escape") setSelectedConnectionId(null);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [onToolModeChange, selectedConnectionId]);

  // Cascade: drop connections whose endpoints no longer exist.
  //
  // Nodes are deleted from three places (App's Delete key, the eraser, a node's X
  // button) but `connections` lives here, so App can't prune them at the source.
  // Reconciling against `nodes` catches every path at once.
  useEffect(() => {
    const ids = new Set(nodes.map((n) => n.id));
    setConnections((prev) => {
      const kept = prev.filter((c) => ids.has(c.sourceId) && ids.has(c.targetId));
      return kept.length === prev.length ? prev : kept; // same ref = no re-render
    });
  }, [nodes]);

  // Measure each root node's real rendered height (offsetHeight is layout height,
  // unaffected by the content layer's CSS scale — so it's already in logic units).
  // Feeds ConnectionLayer so arrows anchor to the box the user actually sees.
  useEffect(() => {
    const measure = () => {
      setMeasuredHeights((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, el] of nodeElsRef.current) {
          const h = el.offsetHeight;
          if (h && Math.abs((prev[id] ?? 0) - h) > 0.5) {
            next[id] = h;
            changed = true;
          }
        }
        // Drop stale ids so a deleted-then-re-added node can't read an old height.
        for (const id of Object.keys(next)) {
          if (!nodeElsRef.current.has(id)) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };
    const ro = new ResizeObserver(measure);
    for (const el of nodeElsRef.current.values()) ro.observe(el);
    measure(); // initial pass (also catches nodes added since the last run)
    return () => ro.disconnect();
    // Keyed on the set of root ids, not the node objects — so this re-subscribes
    // when nodes are added/removed, not on every position change during a drag.
  }, [rootNodes.map((n) => n.id).join("|")]);

  const effectiveMode = spaceHeld ? "pan" : toolMode;

  // Helper to get logic coordinates
  const getLogicPos = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  const startEndpointDrag = useCallback((connId: string, end: "source" | "target", e: React.MouseEvent) => {
    // Seed the cursor from the grab point, not (0,0) — otherwise the preview snaps
    // to the logic-space origin (top-left corner) until the first mousemove.
    setEndpointDrag({ connId, end, cursor: getLogicPos(e), hoverId: null });
  }, [getLogicPos]);

// 2. ADD INTERACTION HANDLER
  const startConnection = useCallback((
    sourceId: string,
    handle: "top" | "right" | "bottom" | "left",
    e: React.MouseEvent
  ) => {
    // Seed from the grab point so the draft line doesn't flash to the top-left
    // corner (0,0) before the first mousemove.
    const p = getLogicPos(e);
    setConnectionDraft({ sourceId, sourceHandle: handle, mouseX: p.x, mouseY: p.y });
  }, [getLogicPos]);

  // Mouse Down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // ... (existing mouse down logic)
    const pos = getLogicPos(e);
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Reached only when the click missed every node AND every connection (the
    // connection hitbox stops propagation), so this is a click on bare canvas.
    setSelectedConnectionId(null);

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

  // Duplicate a node (and, for a frame, its children) offset by 24px. A child
  // duplicate stays in its parent and is clamped inside the screen.
  const onDuplicateNode = useCallback((id: string) => {
    const src = nodes.find((n) => n.id === id);
    if (!src) return;

    const stamp = Date.now();
    const copyId = `node-${stamp}`;
    let x = src.x + 24;
    let y = src.y + 24;

    if (src.parentId) {
      const parent = nodes.find((n) => n.id === src.parentId);
      if (parent) {
        const screen = getFrameScreenSize(parent.width, parent.data.height || 0);
        x = Math.min(x, Math.max(screen.width - src.width, 0));
        y = Math.min(y, Math.max(screen.height - (src.data.height || 0), 0));
      }
    }

    const copy: CanvasNode = {
      ...src,
      id: copyId,
      x,
      y,
      zIndex: zCounterRef.current++,
      data: { ...src.data },
    };

    // A frame brings its contents along.
    const childCopies = nodes
      .filter((n) => n.parentId === id)
      .map((c, i) => ({
        ...c,
        id: `node-${stamp}-${i}`,
        parentId: copyId,
        data: { ...c.data },
      }));

    onNodesChange([...nodes, copy, ...childCopies]);
    onSelectedIdsChange(new Set([copyId]));
  }, [nodes, onNodesChange, onSelectedIdsChange]);

  // Delete a node, cascading to frame children. PRD F5 asks for a confirmation
  // when the frame isn't empty, so contents aren't silently destroyed.
  const onDeleteNode = useCallback((id: string) => {
    const childCount = nodes.filter((n) => n.parentId === id).length;
    if (childCount > 0) {
      const ok = window.confirm(
        `Delete frame and all contents? ${childCount} element${childCount === 1 ? "" : "s"} inside will be deleted.`
      );
      if (!ok) return;
    }
    onNodesChange(removeNodesCascade(nodes, new Set([id])));
    onSelectedIdsChange(new Set());
  }, [nodes, onNodesChange, onSelectedIdsChange]);

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
      initialChildren: nodes
        .filter((n) => n.parentId === id)
        .map((n) => ({
          id: n.id,
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.data.height || 40,
        })),
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

    // Re-attaching an existing arrow endpoint: follow the cursor and hit-test for a
    // snap target (roots only — children aren't connectable; never the other end).
    if (endpointDrag) {
      const p = getLogicPos(e);
      const conn = connections.find((c) => c.id === endpointDrag.connId);
      const otherId = conn ? (endpointDrag.end === "source" ? conn.targetId : conn.sourceId) : null;
      const hover = rootNodes.find((n) => {
        if (n.id === otherId) return false;
        const h = measuredHeights[n.id] ?? n.data.height ?? 100;
        return p.x >= n.x && p.x <= n.x + n.width && p.y >= n.y && p.y <= n.y + h;
      });
      setEndpointDrag({ ...endpointDrag, cursor: p, hoverId: hover ? hover.id : null });
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

    // Frame resize scales its children proportionally (PRD F5). Scale factors are
    // computed from the SCREEN area, not the outer frame — the bezel, status bar
    // and home indicator are fixed chrome and don't scale with the device.
    const kids = resizeState.initialChildren;
    let scaledChildren: Map<string, { x: number; y: number; width: number; height: number }> | null = null;

    if (kids && kids.length > 0) {
      const oldScreen = getFrameScreenSize(ib.w, ib.h);
      const newScreen = getFrameScreenSize(newW, newH);
      const sx = newScreen.width / oldScreen.width;
      const sy = newScreen.height / oldScreen.height;

      scaledChildren = new Map(
        kids.map((c) => [
          c.id,
          { x: c.x * sx, y: c.y * sy, width: c.width * sx, height: c.height * sy },
        ])
      );
    }

    onNodesChange(nodes.map(n => {
      if (n.id === id) {
        return { ...n, x: newX, y: newY, width: newW, data: { ...n.data, height: newH } };
      }
      const scaled = scaledChildren?.get(n.id);
      if (scaled) {
        return {
          ...n,
          x: scaled.x,
          y: scaled.y,
          width: scaled.width,
          data: { ...n.data, height: scaled.height },
        };
      }
      return n;
    }));

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
    const { startX, startY, items } = dragRef.current;

    // Calculate screen delta, convert to logic space. A frame child's x/y are
    // frame-local, but the frame itself isn't scaled — so a delta in canvas space
    // equals a delta in local space, and the same math applies to both.
    const logicDx = (e.clientX - startX) / viewport.zoom;
    const logicDy = (e.clientY - startY) / viewport.zoom;

    // Start positions snapshotted at mousedown, keyed by id (applying the delta to
    // live positions would compound it every frame).
    const starts = new Map(items.map((it) => [it.id, it]));

    // Apply the same delta to every dragged node.
    onNodesChange(
      nodes.map((n) => {
        const start = starts.get(n.id);
        if (!start) return n;

        let nextX = start.x + logicDx;
        let nextY = start.y + logicDy;

        // Children are constrained to their frame's screen area (PRD F5).
        const parent = n.parentId ? nodes.find((p) => p.id === n.parentId) : undefined;
        if (parent) {
          const screen = getFrameScreenSize(parent.width, parent.data.height || 0);
          const maxX = Math.max(screen.width - n.width, 0);
          const maxY = Math.max(screen.height - (n.data.height || 0), 0);
          nextX = Math.min(Math.max(nextX, 0), maxX);
          nextY = Math.min(Math.max(nextY, 0), maxY);
        }

        return { ...n, x: nextX, y: nextY };
      })
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
  resizeState,
  connectionDraft,
  endpointDrag,
  connections,
  rootNodes,
  measuredHeights
]);


  // Mouse Up
const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // ... (Drawing/Shape/Box completion logic same as before)

    // Finalize an endpoint re-attach: snap to the hovered node, else leave the
    // arrow as it was (drop on empty space reverts).
    if (endpointDrag) {
      if (endpointDrag.hoverId) {
        const hoverId = endpointDrag.hoverId;
        setConnections((prev) =>
          prev.map((c) =>
            c.id !== endpointDrag.connId
              ? c
              : endpointDrag.end === "source"
              ? { ...c, sourceId: hoverId }
              : { ...c, targetId: hoverId }
          )
        );
      }
      setEndpointDrag(null);
      return;
    }

    // Update handleMouseUp to finalize connection
if (connectionDraft) {
  // Check if mouse is over a node (target)
  const pos = getLogicPos(e);
  // Roots only — children are not connectable (deferred; would need absolute
  // anchors computed as frame.x + child.x throughout ConnectionLayer).
  const targetNode = rootNodes.find(n => {
    const height = n.data.height || 100;
    return pos.x >= n.x && pos.x <= n.x + n.width &&
           pos.y >= n.y && pos.y <= n.y + height;
  });
  
  if (targetNode && targetNode.id !== connectionDraft.sourceId) {
        // No handles are stored: ConnectionLayer derives both sides from live
        // geometry every render, so the arrow re-routes as the nodes move. The
        // dot you grabbed only starts the connection; it doesn't pin the exit side.
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          sourceId: connectionDraft.sourceId,
          targetId: targetNode.id,
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

      // Roots only: a child's x/y are frame-local and would hit-test nonsensically.
      const intersectingNodes = rootNodes.filter(n => {
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

    // Close the current undo history entry so the next gesture opens a fresh one.
    onInteractionEnd?.();
  }, [isDrawing, currentPath, tempNode, nodes, onNodesChange, toolMode, drawColor, drawWidth, selectionBox, viewport, onSelectedIdsChange, connectionDraft, connections, endpointDrag, rootNodes, getLogicPos, onInteractionEnd]);


  // Node Interaction Handlers
  const startNodeDrag = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedConnectionId(null); // selecting a node drops any connection selection

    if (effectiveMode === "eraser") {
      // Erasing a non-empty frame destroys its children too — confirm first, same
      // as the Delete key and the X button (P0-4).
      const target = nodes.find((n) => n.id === id);
      const childCount = nodes.filter((n) => n.parentId === id).length;
      if (target?.type === "mobile-frame" && childCount > 0) {
        const ok = window.confirm(
          `Delete frame and all ${childCount} elements inside? This cannot be undone.`
        );
        if (!ok) return;
      }
      // Cascade: erasing a frame takes its children with it, or they'd be orphaned
      // in the array forever (invisible, but still exported and still counted).
      onNodesChange(removeNodesCascade(nodes, new Set([id])));
      onSelectedIdsChange(new Set());
      return;
    }

    if (effectiveMode !== "select") return;

    // If resizing, ignore drag (though onResize prop stopPropagation should handle this)

    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    // A grab on a node that's already part of a multi-selection drags the whole
    // selection; grabbing an unselected node collapses the selection to just it.
    let dragIds: Set<string>;
    if (selectedIds.has(id)) {
      dragIds = selectedIds;
    } else {
      dragIds = new Set([id]);
      onSelectedIdsChange(dragIds);
    }

    // Snapshot start positions BEFORE the bring-to-front rewrite (which only
    // touches zIndex, not x/y — but snapshot from the same array for clarity).
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      items: nodes
        .filter((n) => dragIds.has(n.id))
        .map((n) => ({ id: n.id, x: n.x, y: n.y })),
    };

    // Bring-to-front on selection (F2). Raise the grabbed node — and the rest of a
    // multi-selection with it — above everything, preserving their relative order.
    const raised = nodes
      .filter((n) => dragIds.has(n.id))
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((n) => n.id);
    if (raised.length > 0) {
      const base = zCounterRef.current;
      const zById = new Map(raised.map((rid, i) => [rid, base + i]));
      zCounterRef.current = base + raised.length;
      onNodesChange(nodes.map((n) => (zById.has(n.id) ? { ...n, zIndex: zById.get(n.id)! } : n)));
    }
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
      className="flex-1 w-full h-full min-h-screen overflow-hidden relative"
      style={{ cursor, backgroundColor: "var(--canvas-bg)" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
{/* Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(var(--canvas-grid-dot) 1px, transparent 1px)`,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* Connection Layer (renders BELOW nodes so handles are clickable) */}
      <ConnectionLayer
        nodes={rootNodes}
        connections={connections}
        viewport={viewport}
        onConnectionSelect={(id) => {
          // A connection and nodes are never selected at once — otherwise one
          // Delete keypress would remove both.
          setSelectedConnectionId(id);
          onSelectedIdsChange(new Set());
        }}
        selectedConnectionId={selectedConnectionId}
        measuredHeights={measuredHeights}
        onEndpointDragStart={startEndpointDrag}
        endpointDrag={endpointDrag}
      />

      {/* Main Content Layer */}
      <div
        className="absolute z-10"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Nodes — ROOTS ONLY. Frame children are mounted inside their frame's
            screen area below, in frame-local coordinates. */}
        {rootNodes.map((node) => {
          const isSelected = selectedIds.has(node.id);
          const defaults = COMPONENT_DEFAULTS[node.type];

          // Build this frame's children as DOM inside its screen. Nesting is what
          // makes "frame moves ⇒ children move" free — no group-drag needed.
          const kids = childrenByParent.get(node.id);
          const screenChildren = kids?.map((child) => {
            const childDefaults = COMPONENT_DEFAULTS[child.type];
            return (
              <div
                key={child.id}
                className="absolute group/node"
                style={{
                  left: child.x,
                  top: child.y,
                  width: child.width || childDefaults?.width || 200,
                  height: child.data.height ? child.data.height : "auto",
                  zIndex: child.zIndex,
                }}
                onMouseDown={(e) => startNodeDrag(e, child.id)}
              >
                <CanvasNodeRenderer
                  node={child}
                  onUpdate={(data) => onNodesChange(nodes.map(n => n.id === child.id ? { ...n, data } : n))}
                  isSelected={selectedIds.has(child.id)}
                  onStartDrag={(e) => startNodeDrag(e, child.id)}
                  onResizeStart={(e, h) => startNodeResize(e, child.id, h)}
                  onDelete={() => onNodesChange(removeNodesCascade(nodes, new Set([child.id])))}
                  onDuplicate={() => onDuplicateNode(child.id)}
                />
              </div>
            );
          });

          return (
            <div
              key={node.id}
              ref={(el) => {
                if (el) nodeElsRef.current.set(node.id, el);
                else nodeElsRef.current.delete(node.id);
              }}
              className={`absolute group/node ${effectiveMode === "draw" || effectiveMode === "shape" ? "pointer-events-none" : ""}`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width || defaults?.width || 200,
                // Content-sized cards grow to fit: data.height is a minimum, the
                // box auto-grows so nothing scrolls inside it. Only h-full types
                // (shapes, frames, frame-children) take data.height as a hard size.
                height: usesFixedHeight(node.type) && node.data.height ? node.data.height : "auto",
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
                onDelete={() => onDeleteNode(node.id)}
                onDuplicate={() => onDuplicateNode(node.id)}
                screenChildren={screenChildren}
                isDropTarget={
                  node.type === "mobile-frame" &&
                  !!activeDragType &&
                  canNestInFrame(activeDragType)
                }
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
                          startConnection(node.id, pos, e);
                        }}
                      />
                    );
                  })}
                </>
              )}

              {/* Resize Label Overlay (Optimization: Only show for resizing node) */}
              {resizeState && resizeState.id === node.id && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-50 pointer-events-none">
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