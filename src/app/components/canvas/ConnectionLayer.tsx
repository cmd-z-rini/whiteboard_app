import { useMemo } from "react";
import type { CanvasNode, Connection, CanvasViewport } from "./types";

type Handle = "top" | "right" | "bottom" | "left";
type Point = { x: number; y: number };

/** An arrow endpoint being dragged to re-attach (owned by InfiniteCanvas). */
export interface EndpointDrag {
  connId: string;
  end: "source" | "target";
  cursor: Point;
  hoverId: string | null;
}

interface ConnectionLayerProps {
  nodes: CanvasNode[];
  connections: Connection[];
  viewport: CanvasViewport;
  onConnectionSelect?: (id: string) => void;
  selectedConnectionId?: string | null;
  /** Live rendered heights keyed by node id — most cards are height:auto and never
   * set data.height, so without this the anchor rects fall back to a flat 100px. */
  measuredHeights?: Record<string, number>;
  /** Grab an existing arrow's endpoint to re-attach it. */
  onEndpointDragStart?: (connId: string, end: "source" | "target", e: React.MouseEvent) => void;
  endpointDrag?: EndpointDrag | null;
}

const PADDING = 24; // Minimum clearance from node edges

function getRect(node: CanvasNode) {
  const height = node.data.height || 100;
  return {
    left: node.x,
    top: node.y,
    right: node.x + node.width,
    bottom: node.y + height,
    cx: node.x + node.width / 2,
    cy: node.y + height / 2,
  };
}

/**
 * Pick which sides the arrow leaves and enters, from the nodes' CURRENT geometry.
 * Recomputed on every render, so arrows re-route when nodes move — the handles
 * are never frozen at creation time.
 *
 * Uses centers and box separation, not the top-left corner deltas the old code
 * used (those point the wrong way whenever the two nodes differ much in size).
 * The chosen handles always face each other, which is what keeps routes clean.
 */
export function chooseHandles(source: CanvasNode, target: CanvasNode): { sourceHandle: Handle; targetHandle: Handle } {
  const s = getRect(source);
  const t = getRect(target);

  // Separation between the boxes on each axis (negative when they overlap).
  const sepX = Math.max(s.left - t.right, t.left - s.right);
  const sepY = Math.max(s.top - t.bottom, t.top - s.bottom);

  if (sepX >= sepY) {
    const goingRight = t.cx >= s.cx;
    return {
      sourceHandle: goingRight ? "right" : "left",
      targetHandle: goingRight ? "left" : "right",
    };
  }

  const goingDown = t.cy >= s.cy;
  return {
    sourceHandle: goingDown ? "bottom" : "top",
    targetHandle: goingDown ? "top" : "bottom",
  };
}

function getAnchorPoint(node: CanvasNode, handle: Handle): Point {
  const r = getRect(node);
  switch (handle) {
    case "top":
      return { x: r.cx, y: r.top };
    case "right":
      return { x: r.right, y: r.cy };
    case "bottom":
      return { x: r.cx, y: r.bottom };
    case "left":
      return { x: r.left, y: r.cy };
  }
}

/** Drop duplicate and collinear points, so no stray elbows or zero-length segments. */
function simplify(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.5 && Math.abs(last.y - p.y) < 0.5) continue;
    out.push(p);
  }
  for (let i = out.length - 2; i >= 1; i--) {
    const a = out[i - 1];
    const b = out[i];
    const c = out[i + 1];
    const collinear =
      (Math.abs(a.x - b.x) < 0.5 && Math.abs(b.x - c.x) < 0.5) ||
      (Math.abs(a.y - b.y) < 0.5 && Math.abs(b.y - c.y) < 0.5);
    if (collinear) out.splice(i, 1);
  }
  return out;
}

/**
 * Direction-aware Manhattan route.
 *
 * Always steps PADDING straight out of each node's face first, then joins the two
 * stubs. The old router routed through the midpoint regardless of which way the
 * handle faced, so a left-facing source with a target on its right doubled straight
 * back through its own node — the "random zigzag".
 */
export function routeOrthogonal(
  sourceNode: CanvasNode,
  targetNode: CanvasNode,
  sourceHandle: Handle,
  targetHandle: Handle
): string {
  const s0 = getAnchorPoint(sourceNode, sourceHandle);
  const t0 = getAnchorPoint(targetNode, targetHandle);
  const sr = getRect(sourceNode);
  const tr = getRect(targetNode);

  const horizontal = sourceHandle === "left" || sourceHandle === "right";
  let waypoints: Point[];

  if (horizontal) {
    // Is there a corridor between the two FACES? Test the faces, not padded stubs:
    // when the gap is narrower than PADDING the stubs overshoot each other, and a
    // stub-based test would wrongly detour a pair of nodes that are simply close.
    const roomBetween = sourceHandle === "right" ? t0.x >= s0.x : t0.x <= s0.x;

    if (roomBetween) {
      // The corridor between the faces is empty by construction, so a mid-corridor
      // Z can't clip either node — no stub needed.
      const midX = (s0.x + t0.x) / 2;
      waypoints = [s0, { x: midX, y: s0.y }, { x: midX, y: t0.y }, t0];
    } else {
      // Faces point away from each other: the boxes overlap on this axis. Route
      // around the UNION of both boxes so the long runs clear both, not just one.
      const above = Math.min(sr.top, tr.top) - PADDING;
      const below = Math.max(sr.bottom, tr.bottom) + PADDING;
      const clearY = Math.abs(s0.y - above) <= Math.abs(below - s0.y) ? above : below;
      const outX =
        sourceHandle === "right"
          ? Math.max(sr.right, tr.right) + PADDING
          : Math.min(sr.left, tr.left) - PADDING;
      const inX =
        targetHandle === "left"
          ? Math.min(sr.left, tr.left) - PADDING
          : Math.max(sr.right, tr.right) + PADDING;

      waypoints = [
        s0,
        { x: outX, y: s0.y },
        { x: outX, y: clearY },
        { x: inX, y: clearY },
        { x: inX, y: t0.y },
        t0,
      ];
    }
  } else {
    const roomBetween = sourceHandle === "bottom" ? t0.y >= s0.y : t0.y <= s0.y;

    if (roomBetween) {
      const midY = (s0.y + t0.y) / 2;
      waypoints = [s0, { x: s0.x, y: midY }, { x: t0.x, y: midY }, t0];
    } else {
      const leftOf = Math.min(sr.left, tr.left) - PADDING;
      const rightOf = Math.max(sr.right, tr.right) + PADDING;
      const clearX = Math.abs(s0.x - leftOf) <= Math.abs(rightOf - s0.x) ? leftOf : rightOf;
      const outY =
        sourceHandle === "bottom"
          ? Math.max(sr.bottom, tr.bottom) + PADDING
          : Math.min(sr.top, tr.top) - PADDING;
      const inY =
        targetHandle === "top"
          ? Math.min(sr.top, tr.top) - PADDING
          : Math.max(sr.bottom, tr.bottom) + PADDING;

      waypoints = [
        s0,
        { x: s0.x, y: outY },
        { x: clearX, y: outY },
        { x: clearX, y: inY },
        { x: t0.x, y: inY },
        t0,
      ];
    }
  }

  return simplify(waypoints)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
}

export function ConnectionLayer({
  nodes,
  connections,
  viewport,
  onConnectionSelect,
  selectedConnectionId,
  measuredHeights,
  onEndpointDragStart,
  endpointDrag,
}: ConnectionLayerProps) {
  const pathData = useMemo(() => {
    // Prefer the live-measured height so arrows anchor to the box the user
    // actually sees, not the flat 100px fallback.
    const heightOf = (n: CanvasNode) => measuredHeights?.[n.id] ?? n.data.height ?? 100;
    const withH = (n: CanvasNode): CanvasNode => ({ ...n, data: { ...n.data, height: heightOf(n) } });

    return connections.map((conn) => {
      const drag = endpointDrag && endpointDrag.connId === conn.id ? endpointDrag : null;

      const rawSource = nodes.find((n) => n.id === conn.sourceId);
      const rawTarget = nodes.find((n) => n.id === conn.targetId);

      // Free re-attach into empty space: draw straight from the fixed end to the
      // cursor (no snap target yet).
      if (drag && !drag.hoverId) {
        const fixedNode = drag.end === "source" ? rawTarget : rawSource;
        if (!fixedNode) return null;
        const f = withH(fixedNode);
        // Choose the fixed node's exit side by treating the cursor as a 0-size node.
        const cursorNode: CanvasNode = {
          ...f,
          id: "__cursor__",
          x: drag.cursor.x,
          y: drag.cursor.y,
          width: 0,
          data: { ...f.data, height: 0 },
        };
        const { sourceHandle: fixedHandle } = chooseHandles(f, cursorNode);
        const fixedPoint = getAnchorPoint(f, fixedHandle);
        const sPt = drag.end === "source" ? drag.cursor : fixedPoint;
        const tPt = drag.end === "source" ? fixedPoint : drag.cursor;
        return {
          id: conn.id,
          path: `M ${sPt.x} ${sPt.y} L ${tPt.x} ${tPt.y}`,
          color: conn.color || "var(--connection-color)",
          strokeWidth: conn.strokeWidth || 2,
          label: undefined as string | undefined,
          sourcePoint: sPt,
          targetPoint: tPt,
          highlightRect: null as ReturnType<typeof getRect> | null,
          dragging: true,
        };
      }

      // Snap preview: the dragged end follows the hovered node.
      let effSource = rawSource;
      let effTarget = rawTarget;
      let highlightId: string | null = null;
      if (drag && drag.hoverId) {
        const hoverNode = nodes.find((n) => n.id === drag.hoverId);
        if (drag.end === "source") effSource = hoverNode;
        else effTarget = hoverNode;
        highlightId = drag.hoverId;
      }

      if (!effSource || !effTarget) return null;

      const s = withH(effSource);
      const t = withH(effTarget);

      // Handles are always derived from live geometry — never read off the
      // connection. Routing is fully automatic.
      const { sourceHandle, targetHandle } = chooseHandles(s, t);
      const sourcePoint = getAnchorPoint(s, sourceHandle);
      const targetPoint = getAnchorPoint(t, targetHandle);

      const pathString =
        conn.style === "straight"
          ? `M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`
          : conn.style === "curved"
          ? `M ${sourcePoint.x} ${sourcePoint.y} Q ${
              sourcePoint.x + (targetPoint.x - sourcePoint.x) / 2
            } ${sourcePoint.y}, ${
              sourcePoint.x + (targetPoint.x - sourcePoint.x) / 2
            } ${
              sourcePoint.y + (targetPoint.y - sourcePoint.y) / 2
            } T ${targetPoint.x} ${targetPoint.y}`
          : routeOrthogonal(s, t, sourceHandle, targetHandle);

      return {
        id: conn.id,
        path: pathString,
        color: conn.color || "var(--connection-color)",
        strokeWidth: conn.strokeWidth || 2,
        label: conn.label,
        sourcePoint,
        targetPoint,
        highlightRect: highlightId ? getRect(withH(nodes.find((n) => n.id === highlightId)!)) : null,
        dragging: !!drag,
      };
    });
  }, [nodes, connections, endpointDrag, measuredHeights]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Arrow Marker */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
        </marker>
      </defs>

      <g
        transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
      >
        {pathData.map((data) => {
          if (!data) return null;

          const isSelected = data.id === selectedConnectionId;
          const stroke = isSelected ? "var(--connection-color-selected)" : data.color;
          const showHandles = isSelected || data.dragging;
          const hr = data.highlightRect;

          return (
            <g key={data.id}>
              {/* Valid-drop highlight around the node the endpoint would snap to */}
              {hr && (
                <rect
                  x={hr.left - 2}
                  y={hr.top - 2}
                  width={hr.right - hr.left + 4}
                  height={hr.bottom - hr.top + 4}
                  rx={12}
                  fill="none"
                  stroke="var(--connection-color-selected)"
                  strokeWidth={2}
                  className="pointer-events-none"
                />
              )}

              {/* Invisible hitbox — a 2px line is near-impossible to click */}
              <path
                d={data.path}
                stroke="transparent"
                strokeWidth={12}
                fill="none"
                className="pointer-events-auto cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onConnectionSelect?.(data.id);
                }}
              />

              {/* Visible Path */}
              <path
                d={data.path}
                stroke={stroke}
                strokeWidth={isSelected ? data.strokeWidth + 1 : data.strokeWidth}
                fill="none"
                markerEnd="url(#arrowhead)"
                strokeDasharray={data.dragging ? "6,4" : undefined}
                className="pointer-events-none"
                style={{ color: stroke }}
              />

              {/* Connection Label */}
              {data.label && (
                <text
                  x={data.targetPoint.x - 20}
                  y={data.targetPoint.y - 10}
                  className="text-xs fill-slate-600 pointer-events-none"
                  style={{ fontSize: "12px" }}
                >
                  {data.label}
                </text>
              )}

              {/* Grabbable endpoints (FigJam-style re-attach). Shown when the arrow
                  is selected or being dragged; sit above nodes (z-20 svg) so they
                  stay grabbable even over another node. */}
              {showHandles && (
                <>
                  <circle
                    cx={data.sourcePoint.x}
                    cy={data.sourcePoint.y}
                    r={6}
                    fill="#ffffff"
                    stroke="var(--connection-color-selected)"
                    strokeWidth={2}
                    className="pointer-events-auto cursor-grab"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onEndpointDragStart?.(data.id, "source", e);
                    }}
                  />
                  <circle
                    cx={data.targetPoint.x}
                    cy={data.targetPoint.y}
                    r={6}
                    fill="#ffffff"
                    stroke="var(--connection-color-selected)"
                    strokeWidth={2}
                    className="pointer-events-auto cursor-grab"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onEndpointDragStart?.(data.id, "target", e);
                    }}
                  />
                </>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
