import { useState } from "react";
import { Plus, X, ArrowRight } from "lucide-react";
import type { CanvasNode } from "./types";

interface NodeProps {
  node: CanvasNode;
  onUpdate: (data: Record<string, any>) => void;
}

// Inline editable for timeline steps
function InlineEdit({
  value,
  onChange,
  className = "",
  placeholder = "Type...",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
        className={`bg-white/60 border border-primary/20 rounded px-1 py-0.5 focus:outline-none focus:border-primary/40 ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-text hover:bg-black/[0.03] rounded px-1 py-0.5 transition-colors ${className}`}
    >
      {value || <span className="text-muted-foreground/40 italic">{placeholder}</span>}
    </div>
  );
}

export function TimelineCardNode({ node, onUpdate }: NodeProps) {
  const d = node.data;
  const steps = d.steps || [];

  const addStep = () => {
    onUpdate({
      ...d,
      steps: [
        ...steps,
        { id: `t-${Date.now()}`, title: "New Step", date: "Date", description: "" },
      ],
    });
  };

  const updateStep = (id: string, field: string, value: string) => {
    onUpdate({
      ...d,
      steps: steps.map((s: any) => (s.id === id ? { ...s, [field]: value } : s)),
    });
  };

  const removeStep = (id: string) => {
    onUpdate({
      ...d,
      steps: steps.filter((s: any) => s.id !== id),
    });
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <InlineEdit
          value={d.title || "Project Timeline"}
          onChange={(v) => onUpdate({ ...d, title: v })}
          className="font-medium text-[14px]"
        />
        <button
          onClick={addStep}
          className="text-[10px] flex items-center gap-1 bg-secondary hover:bg-secondary/80 px-2 py-1 rounded text-muted-foreground transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Step
        </button>
      </div>

      <div className="relative pt-2 pb-4 overflow-x-auto">
        {/* Timeline line */}
        <div className="absolute top-[26px] left-0 w-full h-0.5 bg-border -z-10" />

        <div className="flex items-start gap-4 min-w-full">
          {steps.map((step: any, i: number) => (
            <div key={step.id} className="relative group/step flex flex-col items-center flex-shrink-0 w-32">
              {/* Dot on line */}
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm mb-2 z-10" />

              {/* Content */}
              <div className="w-full bg-white border border-border rounded-lg p-2 shadow-sm text-center">
                <InlineEdit
                  value={step.date}
                  onChange={(v) => updateStep(step.id, "date", v)}
                  className="text-[10px] text-muted-foreground mb-1 justify-center flex"
                  placeholder="Date"
                />
                <InlineEdit
                  value={step.title}
                  onChange={(v) => updateStep(step.id, "title", v)}
                  className="text-[12px] font-medium mb-1 justify-center flex"
                  placeholder="Milestone"
                />
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(step.id, "description", e.target.value)}
                  className="w-full text-[10px] resize-none bg-transparent focus:outline-none text-center h-12"
                  placeholder="Details..."
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeStep(step.id)}
                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-white shadow border border-border opacity-0 group-hover/step:opacity-100 transition-opacity hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Arrow connector */}
              {i < steps.length - 1 && (
                <ArrowRight className="absolute top-[18px] -right-[18px] w-4 h-4 text-muted-foreground/30" />
              )}
            </div>
          ))}

          {steps.length === 0 && (
            <div className="w-full text-center text-[11px] text-muted-foreground/50 py-4 italic">
              Add a step to start the timeline
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
