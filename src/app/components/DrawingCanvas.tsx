import { useRef, useState, useEffect } from "react";
import { Pencil, Eraser, RotateCcw, Square, Circle, Minus } from "lucide-react";

type Tool = "pen" | "eraser" | "rectangle" | "circle" | "line";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#1a1a2e");
  const [lineWidth, setLineWidth] = useState(2);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const colors = [
    "#1a1a2e",
    "#e74c3c",
    "#2ecc71",
    "#3498db",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
  ];

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e0e0e0";
    for (let x = 20; x < w; x += 20) {
      for (let y = 20; y < h; y += 20) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      // Preserve existing drawing during resize
      const tempCanvas = document.createElement("canvas");
      const oldW = canvas.width;
      const oldH = canvas.height;
      if (oldW > 0 && oldH > 0) {
        tempCanvas.width = oldW;
        tempCanvas.height = oldH;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawGrid(ctx, w, h);
        if (oldW > 0 && oldH > 0) {
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);

    setIsDrawing(true);
    startPointRef.current = pos;

    if (tool === "rectangle" || tool === "circle" || tool === "line") {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (tool === "pen" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#fafafa" : color;
      ctx.lineWidth = tool === "eraser" ? 20 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    const start = startPointRef.current;

    if (tool === "pen" || tool === "eraser") {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (snapshotRef.current && start) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (tool === "rectangle") {
        ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
      } else if (tool === "circle") {
        const rx = Math.abs(pos.x - start.x) / 2;
        const ry = Math.abs(pos.y - start.y) / 2;
        const cx = start.x + (pos.x - start.x) / 2;
        const cy = start.y + (pos.y - start.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    startPointRef.current = null;
    snapshotRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGrid(ctx, canvas.width, canvas.height);
  };

  const toolList: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "pen", icon: <Pencil className="w-4 h-4" />, label: "Pen" },
    { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Eraser" },
    { id: "rectangle", icon: <Square className="w-4 h-4" />, label: "Rectangle" },
    { id: "circle", icon: <Circle className="w-4 h-4" />, label: "Circle" },
    { id: "line", icon: <Minus className="w-4 h-4" />, label: "Line" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          {toolList.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-2 rounded-md transition-all ${
                tool === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-primary/10 text-muted-foreground"
              }`}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                color === c ? "border-primary scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Size:</span>
          <input
            type="range"
            min="1"
            max="8"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20 accent-primary"
          />
        </div>

        <button
          onClick={clearCanvas}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-[13px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded-xl border border-border overflow-hidden"
        style={{ height: 400 }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair block"
        />
      </div>
    </div>
  );
}