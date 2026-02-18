import { useState } from "react";
import { Plus, X, AlertTriangle, Zap, ArrowRight, GripVertical } from "lucide-react";

type StepFlag = "none" | "pain" | "opportunity";

interface FlowStep {
  id: string;
  label: string;
  note: string;
  flag: StepFlag;
}

interface UserFlowProps {
  initialSteps?: FlowStep[];
}

const DEFAULT_STEPS: FlowStep[] = [
  { id: "s1", label: "Entry Point", note: "User arrives via referral, search, or marketing", flag: "none" },
  { id: "s2", label: "Sign Up", note: "Email/SSO registration — keep under 30 sec", flag: "none" },
  { id: "s3", label: "Onboarding", note: "Role selection → workspace setup → first action", flag: "pain" },
  { id: "s4", label: "Core Action", note: "The primary task the user came to accomplish", flag: "none" },
  { id: "s5", label: "Value Moment", note: "User sees the first meaningful result / 'aha'", flag: "opportunity" },
  { id: "s6", label: "Return / Share", note: "User comes back or invites others", flag: "opportunity" },
];

const FLAG_STYLES: Record<StepFlag, { dot: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  none: { dot: "bg-gray-300", bg: "bg-white", border: "border-border", label: "", icon: null },
  pain: { dot: "bg-red-400", bg: "bg-red-50/60", border: "border-red-200", label: "Pain Point", icon: <AlertTriangle className="w-3 h-3 text-red-500" /> },
  opportunity: { dot: "bg-emerald-400", bg: "bg-emerald-50/60", border: "border-emerald-200", label: "Opportunity", icon: <Zap className="w-3 h-3 text-emerald-600" /> },
};

const FLAG_CYCLE: StepFlag[] = ["none", "pain", "opportunity"];

export function UserFlow({ initialSteps }: UserFlowProps) {
  const [steps, setSteps] = useState<FlowStep[]>(initialSteps ?? DEFAULT_STEPS);

  const updateStep = (id: string, field: keyof FlowStep, value: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const cycleFlag = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const idx = FLAG_CYCLE.indexOf(s.flag);
        return { ...s, flag: FLAG_CYCLE[(idx + 1) % FLAG_CYCLE.length] };
      })
    );
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, label: "New Step", note: "", flag: "none" },
    ]);
  };

  const addStepAfter = (id: string) => {
    const idx = steps.findIndex((s) => s.id === id);
    const newStep: FlowStep = { id: `s-${Date.now()}`, label: "New Step", note: "", flag: "none" };
    const next = [...steps];
    next.splice(idx + 1, 0, newStep);
    setSteps(next);
  };

  return (
    <div className="space-y-4">
      {/* Compact flow visualization */}
      <div className="flex items-center gap-1 flex-wrap py-2 px-1">
        {steps.map((step, i) => {
          const fs = FLAG_STYLES[step.flag];
          return (
            <div key={step.id} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] ${fs.border} ${fs.bg}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${fs.dot}`} />
                <span className="truncate max-w-[120px]">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed step cards */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const fs = FLAG_STYLES[step.flag];
          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {i > 0 && (
                <div className="absolute left-6 -top-2 w-px h-2 bg-border" />
              )}

              <div
                className={`group/step flex items-start gap-3 border rounded-lg p-3 transition-all ${fs.border} ${fs.bg} hover:shadow-sm`}
              >
                {/* Step number */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] border ${
                    step.flag === "pain"
                      ? "bg-red-100 border-red-200 text-red-700"
                      : step.flag === "opportunity"
                      ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                      : "bg-secondary border-border text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      value={step.label}
                      onChange={(e) => updateStep(step.id, "label", e.target.value)}
                      className="bg-transparent text-[14px] focus:outline-none w-full px-1 py-0.5 rounded hover:bg-white/60 focus:bg-white/60 transition-colors"
                      placeholder="Step name..."
                    />
                    {step.flag !== "none" && (
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                        step.flag === "pain" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {fs.icon}
                        {fs.label}
                      </span>
                    )}
                  </div>
                  <input
                    value={step.note}
                    onChange={(e) => updateStep(step.id, "note", e.target.value)}
                    className="bg-transparent text-[12px] text-muted-foreground focus:outline-none w-full px-1 py-0.5 rounded hover:bg-white/60 focus:bg-white/60 transition-colors"
                    placeholder="Quick note..."
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/step:opacity-100 transition-opacity">
                  <button
                    onClick={() => cycleFlag(step.id)}
                    className={`p-1.5 rounded-md text-[10px] transition-colors ${
                      step.flag === "none"
                        ? "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                        : step.flag === "pain"
                        ? "text-red-500 hover:bg-red-100"
                        : "text-emerald-600 hover:bg-emerald-100"
                    }`}
                    title="Toggle: None → Pain Point → Opportunity"
                  >
                    {step.flag === "none" && <AlertTriangle className="w-3.5 h-3.5" />}
                    {step.flag === "pain" && <Zap className="w-3.5 h-3.5" />}
                    {step.flag === "opportunity" && <GripVertical className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => addStepAfter(step.id)}
                    className="p-1.5 rounded-md text-muted-foreground/50 hover:bg-secondary hover:text-foreground transition-colors"
                    title="Add step after"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {steps.length > 2 && (
                    <button
                      onClick={() => removeStep(step.id)}
                      className="p-1.5 rounded-md text-muted-foreground/50 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Remove step"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add step */}
      <button
        onClick={addStep}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-[13px]"
      >
        <Plus className="w-4 h-4" />
        Add Step
      </button>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Flags:</span>
        <button
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {}}
          tabIndex={-1}
        >
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span>Pain Point</span>
        </button>
        <button
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {}}
          tabIndex={-1}
        >
          <Zap className="w-3 h-3 text-emerald-500" />
          <span>Opportunity</span>
        </button>
        <span className="text-[10px] text-muted-foreground/40 ml-auto">Click flag icon to cycle</span>
      </div>
    </div>
  );
}
