import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface WhiteboardSectionProps {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

export function WhiteboardSection({
  id,
  number,
  title,
  subtitle,
  icon,
  children,
  defaultOpen = true,
  accentColor = "bg-primary",
}: WhiteboardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section id={id} className="scroll-mt-24">
      <div
        className="flex items-center gap-3 cursor-pointer group mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`w-8 h-8 rounded-lg ${accentColor} text-white flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground tracking-wider uppercase">
              Step {number}
            </span>
          </div>
          <h2 className="truncate">{title}</h2>
        </div>
        <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity text-[12px] mr-2">
          {subtitle}
        </span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </div>

      {isOpen && (
        <div className="ml-11 pb-8 border-l-2 border-border/50 pl-6">
          {children}
        </div>
      )}
    </section>
  );
}
