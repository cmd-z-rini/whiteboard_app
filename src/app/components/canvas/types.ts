export type CanvasComponentType =
  | "section-header"
  | "sticky-note"
  | "text-card"
  | "persona-card"
  | "user-flow"
  | "hmw-card"
  | "checklist"
  | "matrix" // Using this for Feedback Grid
  | "principle-card"
  | "timeline"
  | "user-context-card" // Legacy
  | "who-what-why" // Using for Empathy Map placeholder or similar
  | "problem-brief"
  | "user-context"
  | "crazy-8s"
  | "mobile-frame"
  | "success-metrics"
  | "flow-step"
  | "clarifying-questions"
  | "business-goals"
  | "key-insights"
  | "prioritization-matrix"
  | "summary-card"
  | "simple-text"
  | "simple-shape"
  | "simple-circle"
  | "shape"
  | "competitor-analysis"
  | "brainstorm-list"
  | "idea-voting"
  | "usp-card"
  | "wireframe-sketch"
  | "pencil";

export interface CanvasNode {
  id: string;
  type: CanvasComponentType;
  x: number;
  y: number;
  width: number;
  zIndex: number;
  data: Record<string, any>;
}

export interface Edge {
  id: string;
  startNodeId: string;
  endNodeId: string;
}

export interface ConnectingState {
  isConnecting: boolean;
  startNodeId: string | null;
  currentMousePos: { x: number; y: number } | null;
}

export type ToolMode = "select" | "pan" | "draw" | "text" | "shape" | "circle" | "arrow" | "eraser";
export type ShapeType = "rectangle" | "circle" | "diamond";

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export const COMPONENT_DEFAULTS: Record<
  CanvasComponentType,
  { width: number; label: string; emoji: string; category: string }
> = {
  // 1. Empathize & Analyze (Maps to Steps 1-4)
  "persona-card": { width: 480, label: "Persona Card", emoji: "👤", category: "1. Empathize & Analyze" },
  "who-what-why": { width: 800, label: "Empathy Map", emoji: "❤️", category: "1. Empathize & Analyze" },
  "user-context": { width: 360, label: "User Journey", emoji: "🗺️", category: "1. Empathize & Analyze" },
  "competitor-analysis": { width: 600, label: "Competitor Analysis", emoji: "📊", category: "1. Empathize & Analyze" },

  // 2. Define & Strategy (Maps to Steps 5-6)
  "problem-brief": { width: 600, label: "Problem Statement", emoji: "📄", category: "2. Define & Strategy" },
  "hmw-card": { width: 400, label: "HMW Statement", emoji: "💡", category: "2. Define & Strategy" },
  "business-goals": { width: 800, label: "Business Goals", emoji: "🎯", category: "2. Define & Strategy" },
  "usp-card": { width: 400, label: "USP Card", emoji: "💎", category: "2. Define & Strategy" },
  "principle-card": { width: 400, label: "Design Principle", emoji: "⚡", category: "2. Define & Strategy" },

  // 3. Ideate & Brainstorm (Maps to Steps 7)
  "brainstorm-list": { width: 360, label: "Brainstorm List", emoji: "🌪️", category: "3. Ideate & Brainstorm" },
  "idea-voting": { width: 400, label: "Idea Voting", emoji: "🗳️", category: "3. Ideate & Brainstorm" },
  "sticky-note": { width: 240, label: "Sticky Note", emoji: "🟨", category: "3. Ideate & Brainstorm" },
  "text-card": { width: 400, label: "Text Card", emoji: "📝", category: "3. Ideate & Brainstorm" },
  "prioritization-matrix": { width: 800, label: "Prioritization Matrix", emoji: "田", category: "3. Ideate & Brainstorm" },
  "matrix": { width: 600, label: "Feedback Grid", emoji: "▦", category: "3. Ideate & Brainstorm" },
  "crazy-8s": { width: 800, label: "Crazy 8s", emoji: "🎱", category: "3. Ideate & Brainstorm" },

  // 4. Prototype & Flow (Maps to Steps 8-10)
  "user-flow": { width: 600, label: "User Flow", emoji: "🔀", category: "4. Prototype & Flow" },
  "mobile-frame": { width: 375, label: "Mobile Frame", emoji: "📱", category: "4. Prototype & Flow" },
  "wireframe-sketch": { width: 500, label: "Wireframe Sketch", emoji: "✏️", category: "4. Prototype & Flow" },
  "flow-step": { width: 220, label: "Flow Step", emoji: "➡️", category: "4. Prototype & Flow" },

  // 5. Test & Summarize (Maps to Step 11)
  "success-metrics": { width: 400, label: "Success Metrics", emoji: "📈", category: "5. Test & Summarize" },
  "summary-card": { width: 500, label: "Summary Card", emoji: "📋", category: "5. Test & Summarize" },
  "key-insights": { width: 600, label: "Key Insights", emoji: "🧠", category: "5. Test & Summarize" },
  "checklist": { width: 360, label: "Checklist", emoji: "✅", category: "5. Test & Summarize" },

  // Tools / Misc
  "section-header": { width: 340, label: "Section Header", emoji: "🏷️", category: "Tools" },
  "clarifying-questions": { width: 500, label: "Clarifying Questions", emoji: "❓", category: "Tools" },
  "timeline": { width: 600, label: "Timeline", emoji: "📅", category: "Planning" },
  "shape": { width: 100, label: "Shape", emoji: "🟦", category: "Hidden" },
  "simple-text": { width: 200, label: "Text", emoji: "T", category: "Hidden" },
  "simple-shape": { width: 100, label: "Square", emoji: "🟦", category: "Hidden" },
  "simple-circle": { width: 100, label: "Circle", emoji: "🔴", category: "Hidden" },
  "pencil": { width: 200, label: "Pencil", emoji: "✏️", category: "Hidden" },
  "user-context-card": { width: 320, label: "User Context (Old)", emoji: "📋", category: "Hidden" },
};

const STICKY_COLORS = ["yellow", "blue", "green", "pink", "purple", "orange", "red", "teal"];
const SECTION_COLORS = ["bg-blue-600", "bg-indigo-600", "bg-violet-600", "bg-orange-500", "bg-yellow-500", "bg-green-600", "bg-red-500", "bg-teal-600"];
const PRINCIPLE_COLORS = [
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-purple-50 border-purple-200",
  "bg-orange-50 border-orange-200",
  "bg-rose-50 border-rose-200",
  "bg-teal-50 border-teal-200",
];

export function createDefaultData(type: CanvasComponentType): Record<string, any> {
  switch (type) {
    case "section-header":
      return {
        number: "01",
        title: "Section Title",
        subtitle: "Describe this section",
        color: SECTION_COLORS[Math.floor(Math.random() * SECTION_COLORS.length)],
      };
    case "text-card":
      return { label: "Notes", text: "Click to type your notes here..." };
    case "who-what-why":
      return {
        who: "• Says: ...\n• Thinks: ...",
        what: "• Does: ...\n• Feels: ...",
        why: "Empathy Map",
      };
    case "sticky-note":
      return {
        text: "",
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      };
    case "hmw-card":
      return {
        items: [
          { id: "1", text: "How might we reduce onboarding time from 10 min to under 3 min?" },
          { id: "2", text: "How might we help teachers personalize content without extra effort?" },
          { id: "3", text: "How might we make AI insights accessible to non-technical users?" },
        ],
      };
    case "matrix":
      // Feedback Grid Defaults
      return {
        items: [
          { id: "m1", text: "What worked well?", quadrant: "topLeft" },
          { id: "m2", text: "What needs improvement?", quadrant: "topRight" },
          { id: "m3", text: "Questions?", quadrant: "bottomLeft" },
          { id: "m4", text: "New ideas?", quadrant: "bottomRight" },
        ],
      };
    case "persona-card":
      return {
        name: "User Name",
        role: "Role / Title",
        age: "Age 30",
        avatar: ["👩‍🏫", "👨‍💻", "👩‍💼", "🧑‍🎨", "👨‍🔬"][Math.floor(Math.random() * 5)],
        bio: "Brief description of this persona...",
        goals: ["Goal 1", "Goal 2"],
        painPoints: ["Pain point 1", "Pain point 2"],
      };
    case "user-flow":
      return {};
    case "checklist":
      return {
        title: "Checklist",
        items: [
          { id: "c1", text: "Item 1", checked: false },
          { id: "c2", text: "Item 2", checked: false },
        ],
      };
    case "principle-card":
      return {
        title: "Design Principle",
        description: "Describe the principle and how it applies...",
        color: PRINCIPLE_COLORS[Math.floor(Math.random() * PRINCIPLE_COLORS.length)],
      };

    case "timeline":
      return {
        title: "Project Timeline",
        steps: [
          { id: "t1", title: "Kickoff", date: "Week 1", description: "Initial meeting" },
          { id: "t2", title: "Research", date: "Week 2", description: "User interviews" },
          { id: "t3", title: "Design", date: "Week 3-4", description: "Wireframes & UI" },
        ],
      };
    case "user-context-card":
      return { label: "User Context", text: "Describe the target user base..." };

    case "problem-brief":
      return {
        context: "Background information...",
        problem: "The core problem is...",
        goals: "Success looks like...",
      };
    case "user-context":
      return {
        users: [
          { id: "u1", name: "Students", count: "Primary" },
          { id: "u2", name: "Teachers", count: "Secondary" },
          { id: "u3", name: "Admins", count: "Tertiary" },
        ]
      };
    case "flow-step":
      return { label: "Step Name", type: "action" };
    case "crazy-8s":
      return { grids: Array(8).fill("") };
    case "mobile-frame":
      return {};
    case "success-metrics":
      return {
        metrics: [
          { id: "m1", label: "Activation Rate", value: "20%", target: "30%" },
          { id: "m2", label: "Retention (D30)", value: "15%", target: "25%" },
        ]
      };
    case "clarifying-questions":
      return {
        questions: [
          { id: "q1", text: "Who is the primary end user?", answered: false },
          { id: "q2", text: "What is the core business goal?", answered: false },
        ]
      };
    case "business-goals":
      return {
        business: "Increase user engagement by 40%",
        user: "Complete tasks faster with less friction",
        tech: "Scalable, API-first architecture"
      };
    case "key-insights":
      return {
        insights: [
          { id: "i1", text: "Users drop off during onboarding", type: "problem" },
          { id: "i2", text: "Mobile usage is 65%", type: "stat" },
          { id: "i3", text: "Accessibility is a major gap", type: "finding" }
        ]
      };
    case "prioritization-matrix":
      return {};
    case "shape":
      return { shapeType: "rectangle", color: "bg-blue-500" };
    case "competitor-analysis":
      return {
        title: "Competitor Analysis",
        items: [
          { id: "1", text: "Competitor A: Strengths/Weaknesses", checked: false },
          { id: "2", text: "Competitor B: Strengths/Weaknesses", checked: false },
        ]
      };
    case "usp-card":
      return { label: "USP", text: "Unique Selling Proposition:\n\n1. " };
    case "brainstorm-list":
      return { title: "Brainstorming", items: [{ id: "1", text: "Idea 1", checked: false }] };
    case "idea-voting":
      return { title: "Idea Voting", items: [{ id: "1", text: "Idea A", checked: false }] };
    case "wireframe-sketch":
      return { shapeType: "rectangle", color: "bg-white border-2 border-slate-300" };
    case "summary-card":
      return { label: "Summary", text: "Reflecting on the process..." };
    case "simple-text":
      return { text: "Type here...", fontSize: 16 };
    case "simple-shape":
      return { shapeType: "rectangle", color: "bg-white border-2 border-slate-300" };
    default:
      return {};
  }
}
