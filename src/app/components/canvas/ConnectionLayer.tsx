import type { CanvasNode, Edge, ConnectingState } from "./types";

interface ConnectionLayerProps {
    nodes: CanvasNode[];
    edges: Edge[];
    connectingState: ConnectingState;
}

export function ConnectionLayer({ nodes, edges, connectingState }: ConnectionLayerProps) {
    const getNodeCenter = (nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        return {
            x: node.x + node.width / 2,
            y: node.y + (node.data.height || 100) / 2,
        };
    };

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: "visible" }}
        >
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <marker
                    id="arrowhead-active"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
            </defs>

            {/* Existing Edges */}
            {edges.map((edge) => {
                const start = getNodeCenter(edge.startNodeId);
                const end = getNodeCenter(edge.endNodeId);

                // Simple cubic bezier curve
                const dx = Math.abs(end.x - start.x);
                const dy = Math.abs(end.y - start.y);
                const cp1x = start.x + dx * 0.5;
                const cp1y = start.y;
                const cp2x = end.x - dx * 0.5;
                const cp2y = end.y;

                return (
                    <path
                        key={edge.id}
                        d={`M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                    />
                );
            })}

            {/* Active Connecting Line */}
            {connectingState.isConnecting && connectingState.startNodeId && connectingState.currentMousePos && (
                (() => {
                    const start = getNodeCenter(connectingState.startNodeId);
                    const end = connectingState.currentMousePos;

                    const dx = Math.abs(end.x - start.x);
                    const cp1x = start.x + dx * 0.5;
                    const cp1y = start.y;
                    const cp2x = end.x - dx * 0.5;
                    const cp2y = end.y;

                    return (
                        <path
                            d={`M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`}
                            stroke="black"
                            strokeWidth="3"
                            strokeDasharray="4 4"
                            fill="none"
                            markerEnd="url(#arrowhead-active)"
                        />
                    );
                })()
            )}
        </svg>
    );
}
