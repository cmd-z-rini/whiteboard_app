import { GraduationCap, Brain, Cloud, Building2 } from "lucide-react";

export type Domain = "edtech" | "ai-ml" | "saas" | "enterprise";

interface DomainOption {
  id: Domain;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeBg: string;
  activeText: string;
  borderColor: string;
}

// Domains are a 4-way category (no good/bad ordering), so they draw from the
// --category-* palette in canvas-tokens.css rather than sentiment tokens.
const DOMAINS: DomainOption[] = [
  {
    id: "edtech",
    label: "EdTech",
    icon: <GraduationCap className="w-4 h-4" />,
    color: "text-[var(--category-2-text)]",
    activeBg: "bg-[var(--category-2-surface)]",
    activeText: "text-[var(--category-2-text)]",
    borderColor: "border-[var(--category-2-border-strong)]",
  },
  {
    id: "ai-ml",
    label: "AI / ML",
    icon: <Brain className="w-4 h-4" />,
    color: "text-[var(--category-5-text)]",
    activeBg: "bg-[var(--category-5-surface)]",
    activeText: "text-[var(--category-5-text)]",
    borderColor: "border-[var(--category-5-border-strong)]",
  },
  {
    id: "saas",
    label: "SaaS",
    icon: <Cloud className="w-4 h-4" />,
    color: "text-[var(--category-1-text)]",
    activeBg: "bg-[var(--category-1-surface)]",
    activeText: "text-[var(--category-1-text)]",
    borderColor: "border-[var(--category-1-border-strong)]",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    icon: <Building2 className="w-4 h-4" />,
    color: "text-[var(--category-6-text)]",
    activeBg: "bg-[var(--category-6-surface)]",
    activeText: "text-[var(--category-6-text)]",
    borderColor: "border-[var(--category-6-border-strong)]",
  },
];

interface DomainSelectorProps {
  selected: Domain;
  onChange: (domain: Domain) => void;
}

export function DomainSelector({ selected, onChange }: DomainSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-muted-foreground tracking-wider uppercase mr-1">
        Domain Lens
      </span>
      {DOMAINS.map((d) => {
        const isActive = selected === d.id;
        return (
          <button
            key={d.id}
            onClick={() => onChange(d.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-all border ${
              isActive
                ? `${d.activeBg} ${d.activeText} ${d.borderColor}`
                : "border-transparent text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            {d.icon}
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
