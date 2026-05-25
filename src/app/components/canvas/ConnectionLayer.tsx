import { useMemo } from "react";
import type { CanvasNode, Connection, CanvasViewport } from "./types";

interface ConnectionLayerProps {
  nodes: CanvasNode[];
  connections: Connection[];
  viewport: CanvasViewport;
  onConnectionUpdate?: (id: string, updates: Partial<Connection>) => void;
  selectedConnectionId?: string;
}

export function ConnectionLayer({
  nodes,
  connections,
  viewport,
  onConnectionUpdate,
  selectedConnectionId,
}: ConnectionLayerProps) {
  
  // ─────────────────────────────────────────────────────────────
  // HELPER: Get Anchor Point on Node Edge
  // ─────────────────────────────────────────────────────────────
  const getAnchorPoint = (
    node: CanvasNode,
    handle: "top" | "right" | "bottom" | "left"
  ): { x: number; y: number } => {
    const height = node.data.height || 100;
    
    switch (handle) {
      case "top":
        return { x: node.x + node.width / 2, y: node.y };
      case "right":
        return { x: node.x + node.width, y: node.y + height / 2 };
      case "bottom":
        return { x: node.x + node.width / 2, y: node.y + height };
      case "left":
        return { x: node.x, y: node.y + height / 2 };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // CORE ALGORITHM: Orthogonal (Manhattan) Pathfinding
  // ─────────────────────────────────────────────────────────────
  const calculateOrthogonalPath = (
    source: { x: number; y: number },
    target: { x: number; y: number },
    sourceHandle: "top" | "right" | "bottom" | "left",
    targetHandle: "top" | "right" | "bottom" | "left",
    sourceNode: CanvasNode,
    targetNode: CanvasNode
  ): string => {
    
    const PADDING = 24; // Minimum clearance from node edges
    const waypoints: { x: number; y: number }[] = [source];

    // ─────────────────────────────────────────────────────────
    // STRATEGY 1: Simple Horizontal Flow (Right → Left)
    // ─────────────────────────────────────────────────────────
    if (
      sourceHandle === "right" &&
      targetHandle === "left" &&
      target.x > source.x + PADDING
    ) {
      // Clean 2-segment path (no obstacles)
      const midX = source.x + (target.x - source.x) / 2;
      waypoints.push({ x: midX, y: source.y });
      waypoints.push({ x: midX, y: target.y });
      waypoints.push(target);
    }
    
    // ─────────────────────────────────────────────────────────
    // STRATEGY 2: Vertical Offset (Target Above/Below Source)
    // ─────────────────────────────────────────────────────────
    else if (
      sourceHandle === "right" &&
      targetHandle === "left" &&
      target.x <= source.x + PADDING
    ) {
      // Route around: Go right → down/up → left → target
      const sourceHeight = sourceNode.data.height || 100;
      const targetHeight = targetNode.data.height || 100;
      
      const clearRight = Math.max(
        sourceNode.x + sourceNode.width + PADDING,
        targetNode.x + targetNode.width + PADDING
      );
      
      // Vertical clearance (route above or below?)
      const routeAbove = source.y < target.y;
      const clearY = routeAbove
        ? Math.min(sourceNode.y - PADDING, targetNode.y - PADDING)
        : Math.max(sourceNode.y + sourceHeight + PADDING, targetNode.y + targetHeight + PADDING);
      
      waypoints.push({ x: clearRight, y: source.y });
      waypoints.push({ x: clearRight, y: clearY });
      waypoints.push({ x: target.x - PADDING, y: clearY });
      waypoints.push({ x: target.x - PADDING, y: target.y });
      waypoints.push(target);
    }
    
    // ─────────────────────────────────────────────────────────
    // STRATEGY 3: Vertical Connections (Top/Bottom Handles)
    // ─────────────────────────────────────────────────────────
    else if (
      (sourceHandle === "bottom" && targetHandle === "top") ||
      (sourceHandle === "top" && targetHandle === "bottom")
    ) {
      const midY = source.y + (target.y - source.y) / 2;
      waypoints.push({ x: source.x, y: midY });
      waypoints.push({ x: target.x, y: midY });
      waypoints.push(target);
    }
    
    // ─────────────────────────────────────────────────────────
    // FALLBACK: Generic 3-Segment Path
    // ─────────────────────────────────────────────────────────
    else {
      const midX = source.x + (target.x - source.x) / 2;
      const midY = source.y + (target.y - source.y) / 2;
      
      // Adaptive routing based on handle directions
      if (sourceHandle === "right" || sourceHandle === "left") {
        waypoints.push({ x: midX, y: source.y });
        waypoints.push({ x: midX, y: target.y });
      } else {
        waypoints.push({ x: source.x, y: midY });
        waypoints.push({ x: target.x, y: midY });
      }
      waypoints.push(target);
    }

    // Convert waypoints to SVG path
    return waypoints.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: Generate Path Data for All Connections
  // ─────────────────────────────────────────────────────────────
  const pathData = useMemo(() => {
    return connections.map((conn) => {
      const sourceNode = nodes.find((n) => n.id === conn.sourceId);
      const targetNode = nodes.find((n) => n.id === conn.targetId);

      if (!sourceNode || !targetNode) return null;

      const sourceHandle = conn.sourceHandle || "right";
      const targetHandle = conn.targetHandle || "left";

      const sourcePoint = getAnchorPoint(sourceNode, sourceHandle);
      const targetPoint = getAnchorPoint(targetNode, targetHandle);

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
          : calculateOrthogonalPath(
              sourcePoint,
              targetPoint,
              sourceHandle,
              targetHandle,
              sourceNode,
              targetNode
            );

      return {
        id: conn.id,
        path: pathString,
        color: conn.color || "#64748b",
        strokeWidth: conn.strokeWidth || 2,
        label: conn.label,
        targetPoint, // For arrow head
      };
    });
  }, [nodes, connections]);

  // ─────────────────────────────────────────────────────────────
  // SVG RENDERING
  // ─────────────────────────────────────────────────────────────
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

          return (
            <g key={data.id}>
              {/* Invisible Hitbox (Makes Selection Easier) */}
              <path
                d={data.path}
                stroke="transparent"
                strokeWidth={12}
                fill="none"
                className="pointer-events-auto cursor-pointer"
                onClick={() => onConnectionUpdate?.(data.id, {})}
              />

              {/* Visible Path */}
              <path
                d={data.path}
                stroke={isSelected ? "#3b82f6" : data.color}
                strokeWidth={isSelected ? data.strokeWidth + 1 : data.strokeWidth}
                fill="none"
                markerEnd="url(#arrowhead)"
                className="pointer-events-none"
                style={{ color: isSelected ? "#3b82f6" : data.color }}
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
            </g>
          );
        })}
      </g>
    </svg>
  );
}