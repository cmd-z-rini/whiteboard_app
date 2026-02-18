import { Lightbulb, X } from "lucide-react";
import { useState } from "react";
import type { Domain } from "./DomainSelector";

const DOMAIN_STYLES: Record<Domain, { bg: string; border: string; text: string; icon: string; badge: string }> = {
  edtech: { bg: "bg-blue-50/80", border: "border-blue-100", text: "text-blue-800", icon: "text-blue-500", badge: "bg-blue-100 text-blue-700" },
  "ai-ml": { bg: "bg-purple-50/80", border: "border-purple-100", text: "text-purple-800", icon: "text-purple-500", badge: "bg-purple-100 text-purple-700" },
  saas: { bg: "bg-green-50/80", border: "border-green-100", text: "text-green-800", icon: "text-green-500", badge: "bg-green-100 text-green-700" },
  enterprise: { bg: "bg-orange-50/80", border: "border-orange-100", text: "text-orange-800", icon: "text-orange-500", badge: "bg-orange-100 text-orange-700" },
};

const DOMAIN_LABELS: Record<Domain, string> = {
  edtech: "EdTech",
  "ai-ml": "AI / ML",
  saas: "SaaS",
  enterprise: "Enterprise",
};

interface DomainTipProps {
  domain: Domain;
  tips: string[];
  title?: string;
}

export function DomainTip({ domain, tips, title }: DomainTipProps) {
  const [dismissed, setDismissed] = useState(false);
  const s = DOMAIN_STYLES[domain];

  if (dismissed || tips.length === 0) return null;

  return (
    <div className={`relative rounded-lg border p-3 ${s.bg} ${s.border} transition-all`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-start gap-2.5 pr-5">
        <Lightbulb className={`w-4 h-4 mt-0.5 shrink-0 ${s.icon}`} />
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md tracking-wider uppercase ${s.badge}`}>
              {DOMAIN_LABELS[domain]}
            </span>
            {title && (
              <span className={`text-[12px] ${s.text}`}>{title}</span>
            )}
          </div>
          <ul className="space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className={`text-[12px] leading-relaxed ${s.text}`}>
                <span className="opacity-50 mr-1">&bull;</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
