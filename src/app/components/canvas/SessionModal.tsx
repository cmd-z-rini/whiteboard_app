import { useState } from "react";
import { Clock } from "lucide-react";
import * as Modal from "../ui/alignui/modal";
import * as Button from "../ui/alignui/button";
import * as Badge from "../ui/alignui/badge";

interface Workflow {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}

const WORKFLOWS: Workflow[] = [
  {
    id: "interview-prep",
    icon: <Clock className="w-5 h-5" />,
    title: "Interview prep — 60 min",
    description:
      "7 phases · 25 components · Interrogate → Diagnose → Strategy → JTBD → Screens → Edge cases → Synthesis",
    badge: "UI/UX Design",
  },
  {
    id: "design-critique",
    icon: <Clock className="w-5 h-5" />,
    title: "Design critique",
    description: "Coming soon",
    disabled: true,
  },
];

interface SessionModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (workflowId: string) => void;
}

export function SessionModal({ open, onClose, onStart }: SessionModalProps) {
  // Card 1 is selected by default and can't be deselected (only enabled cards
  // can become the selection, so Start always has a valid workflow).
  const [selected, setSelected] = useState(WORKFLOWS[0].id);

  return (
    <Modal.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Modal.Content className="max-w-lg">
        <Modal.Header
          title="Start a session"
          description="Choose a workflow to scaffold your canvas and guide you through a structured practice session."
        />

        {/* Workflow cards */}
        <Modal.Body className="flex flex-col gap-3">
          {WORKFLOWS.map((wf) => {
            const isSelected = selected === wf.id;
            return (
              <button
                key={wf.id}
                type="button"
                disabled={wf.disabled}
                onClick={() => !wf.disabled && setSelected(wf.id)}
                className={`text-left w-full rounded-xl border p-4 transition-all ${
                  wf.disabled
                    ? "border-border bg-secondary/30 opacity-60 cursor-not-allowed"
                    : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-secondary/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected && !wf.disabled
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {wf.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-foreground">{wf.title}</h3>
                      {wf.badge && (
                        <Badge.Root variant="light" color="purple" size="small">
                          {wf.badge}
                        </Badge.Root>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {wf.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </Modal.Body>

        <Modal.Footer className="justify-end">
          <Button.Root variant="neutral" mode="ghost" size="xsmall" onClick={onClose}>
            Cancel
          </Button.Root>
          <Button.Root variant="primary" mode="filled" size="xsmall" onClick={() => onStart(selected)}>
            Start session →
          </Button.Root>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
