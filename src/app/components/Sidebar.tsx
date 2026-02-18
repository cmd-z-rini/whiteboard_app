import {
  FileText,
  Users,
  UserCircle,
  Route,
  Lightbulb,
  PenTool,
  Target,
  BarChart3,
  Clock,
  Compass,
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

const sections = [
  { id: "brief", label: "Brief", icon: FileText },
  { id: "understand", label: "Understand", icon: Compass },
  { id: "research", label: "Users", icon: Users },
  { id: "personas", label: "Personas", icon: UserCircle },
  { id: "journey", label: "User Flow", icon: Route },
  { id: "ideation", label: "Ideation", icon: Lightbulb },
  { id: "wireframes", label: "Wireframes", icon: PenTool },
  { id: "principles", label: "Principles", icon: Target },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
  { id: "next-steps", label: "Next Steps", icon: Clock },
];

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <aside className="w-16 lg:w-56 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <PenTool className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="hidden lg:block">
            <h3 className="text-[14px] leading-tight">Design</h3>
            <span className="text-[11px] text-muted-foreground">Whiteboard</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <div className="flex items-center justify-center w-5">
                <Icon className="w-4 h-4" />
              </div>
              <span className="hidden lg:block text-[13px]">
                <span className="text-muted-foreground mr-1.5">{index + 1}.</span>
                {section.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border hidden lg:block">
        <div className="text-[11px] text-muted-foreground text-center">
          Click any text to edit
        </div>
      </div>
    </aside>
  );
}