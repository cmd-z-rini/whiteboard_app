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

const DOMAINS: DomainOption[] = [
  {
    id: "edtech",
    label: "EdTech",
    icon: <GraduationCap className="w-4 h-4" />,
    color: "text-blue-600",
    activeBg: "bg-blue-100",
    activeText: "text-blue-800",
    borderColor: "border-blue-300",
  },
  {
    id: "ai-ml",
    label: "AI / ML",
    icon: <Brain className="w-4 h-4" />,
    color: "text-purple-600",
    activeBg: "bg-purple-100",
    activeText: "text-purple-800",
    borderColor: "border-purple-300",
  },
  {
    id: "saas",
    label: "SaaS",
    icon: <Cloud className="w-4 h-4" />,
    color: "text-green-600",
    activeBg: "bg-green-100",
    activeText: "text-green-800",
    borderColor: "border-green-300",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    icon: <Building2 className="w-4 h-4" />,
    color: "text-orange-600",
    activeBg: "bg-orange-100",
    activeText: "text-orange-800",
    borderColor: "border-orange-300",
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
