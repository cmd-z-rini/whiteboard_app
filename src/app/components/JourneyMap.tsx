import { useState } from "react";
import { X } from "lucide-react";

interface JourneyStep {
  stage: string;
  action: string;
  thought: string;
  emotion: "happy" | "neutral" | "frustrated" | "sad";
  opportunity: string;
}

const emotionIcons: Record<string, string> = {
  happy: "\u{1F60A}",
  neutral: "\u{1F610}",
  frustrated: "\u{1F624}",
  sad: "\u{1F622}",
};

const emotionColors: Record<string, string> = {
  happy: "bg-green-100 border-green-200",
  neutral: "bg-gray-100 border-gray-200",
  frustrated: "bg-orange-100 border-orange-200",
  sad: "bg-red-100 border-red-200",
};

interface JourneyMapProps {
  steps: JourneyStep[];
}

export function JourneyMap({ steps: initialSteps }: JourneyMapProps) {
  const [steps, setSteps] = useState(initialSteps);

  const updateStep = (index: number, field: keyof JourneyStep, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const cycleEmotion = (index: number) => {
    const emotions: JourneyStep["emotion"][] = ["happy", "neutral", "frustrated", "sad"];
    const current = steps[index].emotion;
    const nextIndex = (emotions.indexOf(current) + 1) % emotions.length;
    updateStep(index, "emotion", emotions[nextIndex]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        stage: "New Stage",
        action: "Describe action...",
        thought: "What are they thinking?",
        emotion: "neutral",
        opportunity: "Design opportunity...",
      },
    ]);
  };

  return (
    <div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-0 min-w-max">
          {steps.map((step, i) => (
            <div key={i} className="w-[200px] shrink-0 relative group/step">
              {/* Remove button */}
              <button
                onClick={() => removeStep(i)}
                className="absolute -top-2 right-1 z-10 w-5 h-5 rounded-full bg-white border border-border shadow-sm flex items-center justify-center opacity-0 group-hover/step:opacity-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                title="Remove stage"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Stage Header */}
              <div className="bg-primary text-primary-foreground px-3 py-2 text-center rounded-t-lg border-r border-primary-foreground/10">
                <input
                  value={step.stage}
                  onChange={(e) => updateStep(i, "stage", e.target.value)}
                  className="bg-transparent text-center focus:outline-none w-full text-[13px] text-primary-foreground"
                  style={{ fontWeight: 500 }}
                />
              </div>

              {/* Content */}
              <div className="border border-t-0 border-border p-3 space-y-3">
                {/* Action */}
                <div>
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
                    Action
                  </span>
                  <textarea
                    value={step.action}
                    onChange={(e) => updateStep(i, "action", e.target.value)}
                    className="w-full bg-transparent text-[12px] resize-none focus:outline-none mt-1 min-h-[36px]"
                  />
                </div>

                {/* Thought */}
                <div>
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
                    Thinking
                  </span>
                  <textarea
                    value={step.thought}
                    onChange={(e) => updateStep(i, "thought", e.target.value)}
                    className="w-full bg-blue-50 rounded px-2 py-1 text-[12px] resize-none focus:outline-none mt-1 italic min-h-[36px]"
                  />
                </div>

                {/* Emotion */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => cycleEmotion(i)}
                    className={`px-3 py-1.5 rounded-full border text-[13px] ${emotionColors[step.emotion]}`}
                  >
                    {emotionIcons[step.emotion]}
                  </button>
                </div>

                {/* Opportunity */}
                <div>
                  <span className="text-[10px] text-green-600 tracking-wider uppercase">
                    Opportunity
                  </span>
                  <textarea
                    value={step.opportunity}
                    onChange={(e) => updateStep(i, "opportunity", e.target.value)}
                    className="w-full bg-green-50 rounded px-2 py-1 text-[12px] resize-none focus:outline-none mt-1 min-h-[36px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={addStep}
        className="mt-2 px-4 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-[13px]"
      >
        + Add Stage
      </button>
    </div>
  );
}
