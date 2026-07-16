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
  | "problem-statement-guided"
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
  | "jtbd-table"
  | "edge-case"
  | "unsolved-problem"
  | "pencil"
  // Session Mode — 7-phase interview prep framework
  | "brief-interrogation"
  | "working-assumption"
  | "timeline-row"
  | "moment-of-truth"
  | "strategic-bet"
  | "copy-decision"
  | "trigger-action-outcome"
  | "thirty-day-arc"
  | "entry-convergence"
  | "pushback-answer"
  | "vocabulary-sheet"
  | "interviewer-lens"
  | "self-score-checklist"
  // Frame children (PRD F5 child element library)
  | "ui-nav-bar"
  | "ui-card"
  | "ui-text-block"
  | "ui-button";

export interface CanvasNode {
  id: string;
  type: CanvasComponentType;
  /**
   * When set, this node lives INSIDE a frame's screen area, and x/y are
   * frame-local coordinates (origin = top-left of the screen), not canvas
   * coordinates. Anything that reasons about canvas geometry — box select,
   * fit-to-screen, connection anchoring — must iterate roots only.
   */
  parentId?: string;
  x: number;
  y: number;
  width: number;
  zIndex: number;
  data: Record<string, any>;
}

// ─── Frame geometry ──────────────────────────────────────────────
// Shared by MobileFrameNode's chrome (as inline styles) and by the hit-testing /
// clamping / scaling math, so the two can't drift apart.
export const FRAME_BEZEL = 10;
export const FRAME_STATUS_BAR_H = 44;
export const FRAME_HOME_INDICATOR_H = 28;
export const FRAME_DEFAULT_HEIGHT = 760;

/** Screen area size for a frame of the given outer dimensions. */
export function getFrameScreenSize(width: number, height: number) {
  return {
    width: Math.max(width - FRAME_BEZEL * 2, 1),
    height: Math.max(height - FRAME_BEZEL * 2 - FRAME_STATUS_BAR_H - FRAME_HOME_INDICATOR_H, 1),
  };
}

/** Screen area of a frame in CANVAS coordinates (for drop hit-testing). */
export function getFrameScreenRect(frame: CanvasNode) {
  const size = getFrameScreenSize(frame.width, frame.data.height || FRAME_DEFAULT_HEIGHT);
  return {
    left: frame.x + FRAME_BEZEL,
    top: frame.y + FRAME_BEZEL + FRAME_STATUS_BAR_H,
    ...size,
  };
}

// Types that make no sense inside a phone screen (or would nest frames).
const NON_NESTABLE_TYPES = new Set<CanvasComponentType>([
  "mobile-frame",
  "wireframe-sketch",
  "section-header",
  "pencil",
]);

export function canNestInFrame(type: CanvasComponentType) {
  return !NON_NESTABLE_TYPES.has(type);
}

// Types whose root element is `h-full` (shapes, the phone frame, frame-child UI
// elements) and would collapse to ~40px without an explicit pixel height. For
// these, data.height is a hard size. Everything else is content-sized: the card
// grows to fit, and data.height is treated as a MINIMUM only — no card should
// ever scroll its own content on a pannable canvas.
export const FIXED_HEIGHT_TYPES = new Set<CanvasComponentType>([
  "simple-shape",
  "simple-circle",
  "pencil",
  "shape",
  "mobile-frame",
  "wireframe-sketch",
  "ui-nav-bar",
  "ui-card",
  "ui-text-block",
  "ui-button",
]);

/** Whether a node's box is a hard pixel height (true) or a content-driven minimum (false). */
export function usesFixedHeight(type: CanvasComponentType) {
  return FIXED_HEIGHT_TYPES.has(type);
}

/** Remove nodes by id, cascading to any children they own. */
export function removeNodesCascade(nodes: CanvasNode[], ids: Set<string>): CanvasNode[] {
  return nodes.filter((n) => !ids.has(n.id) && !(n.parentId && ids.has(n.parentId)));
}

/** Ids among `ids` that are frames holding at least one child. */
export function framesWithChildren(nodes: CanvasNode[], ids: Set<string>): CanvasNode[] {
  return nodes.filter(
    (n) => ids.has(n.id) && nodes.some((c) => c.parentId === n.id)
  );
}

export type ToolMode = "select" | "pan" | "draw" | "text" | "shape" | "circle" | "eraser";
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
  "persona-card": { width: 480, label: "Persona Card", emoji: "👤", category: "Empathize & Analyze" },
  "who-what-why": { width: 800, label: "Empathy Map", emoji: "❤️", category: "Empathize & Analyze" },
  "user-context": { width: 360, label: "User Journey", emoji: "🗺️", category: "Empathize & Analyze" }, // Mapping 'User Journey' to 'user-context' or 'user-flow'? User Flow is in 4. Let's use user-context or creating a journey map. User said 'User Journey' in 1 and 'User Flow' in 4. I'll use user-context for Journey for now.
  "competitor-analysis": { width: 600, label: "Competitor Analysis", emoji: "📊", category: "Empathize & Analyze" },

  // 2. Define & Strategy (Maps to Steps 5-6)
  "problem-brief": { width: 600, label: "Problem Statement", emoji: "📄", category: "Define & Strategy" },
  "problem-statement-guided": { width: 560, label: "Problem Statement", emoji: "🎯", category: "Define & Strategy" },
  "hmw-card": { width: 400, label: "HMW Statement", emoji: "💡", category: "Define & Strategy" },
  "business-goals": { width: 800, label: "Business Goals", emoji: "🎯", category: "Define & Strategy" },
  "usp-card": { width: 400, label: "USP Card", emoji: "💎", category: "Define & Strategy" },
  "jtbd-table": { width: 600, label: "JTBD Table", emoji: "📋", category: "Define & Strategy" },
  "principle-card": { width: 400, label: "Design Principle", emoji: "⚡", category: "Define & Strategy" }, // Kept for completeness

  // 3. Ideate & Brainstorm (Maps to Steps 7)
  "brainstorm-list": { width: 360, label: "Brainstorm List", emoji: "🌪️", category: "Ideate & Brainstorm" },
  "idea-voting": { width: 400, label: "Idea Voting", emoji: "🗳️", category: "Ideate & Brainstorm" },
  "sticky-note": { width: 240, label: "Sticky Note", emoji: "🟨", category: "Ideate & Brainstorm" },
  "text-card": { width: 400, label: "Text Card", emoji: "📝", category: "Ideate & Brainstorm" },
  "prioritization-matrix": { width: 800, label: "Prioritization Matrix", emoji: "田", category: "Ideate & Brainstorm" },
  "matrix": { width: 600, label: "Feedback Grid", emoji: "▦", category: "Ideate & Brainstorm" }, // Moved from Test to Ideate

  // 4. Prototype & Flow (Maps to Steps 8-10)
  "user-flow": { width: 600, label: "User Flow", emoji: "🔀", category: "Prototype & Flow" },
  "mobile-frame": { width: 375, label: "Mobile Frame", emoji: "📱", category: "Prototype & Flow" },
  "wireframe-sketch": { width: 500, label: "Wireframe Sketch", emoji: "✏️", category: "Prototype & Flow" },
  "flow-step": { width: 220, label: "Flow Step", emoji: "➡️", category: "Prototype & Flow" },

  // Frame children — drag these INTO a Mobile Frame's screen (PRD F5).
  // Widths fit a default 375px frame's 355px screen.
  "ui-nav-bar": { width: 355, label: "Nav Bar", emoji: "▤", category: "Frame Elements" },
  "ui-card": { width: 315, label: "UI Card", emoji: "🗂️", category: "Frame Elements" },
  "ui-text-block": { width: 315, label: "Text Block", emoji: "🅣", category: "Frame Elements" },
  "ui-button": { width: 200, label: "Button", emoji: "🔘", category: "Frame Elements" },

  // 5. Test & Summarize (Maps to Step 11)
  "success-metrics": { width: 400, label: "Success Metrics", emoji: "📈", category: "Test & Summarize" },
  "summary-card": { width: 500, label: "Summary Card", emoji: "📋", category: "Test & Summarize" },
  "key-insights": { width: 600, label: "Key Insights", emoji: "🧠", category: "Test & Summarize" },
  "edge-case": { width: 420, label: "Edge Case", emoji: "⚠️", category: "Test & Summarize" },
  "unsolved-problem": { width: 420, label: "Unsolved Problem", emoji: "❓", category: "Test & Summarize" },
  "checklist": { width: 360, label: "Checklist", emoji: "✅", category: "Test & Summarize" },

  // Tools / Misc
  "section-header": { width: 340, label: "Section Header", emoji: "🏷️", category: "Tools" },
  "shape": { width: 100, label: "Shape", emoji: "🟦", category: "Tools" },
  "clarifying-questions": { width: 500, label: "Clarifying Questions", emoji: "❓", category: "Tools" },
  // "Hidden" is not in ComponentPalette's CATEGORIES list, so these never appear
  // in the sidebar — they're redundant with the main toolbar's tools. The entries
  // MUST stay: the toolbar creates these types at runtime and reads their width
  // and default data from this table.
  "simple-text": { width: 200, label: "Text", emoji: "T", category: "Hidden" },
  "simple-shape": { width: 100, label: "Square", emoji: "🟦", category: "Hidden" },
  "simple-circle": { width: 100, label: "Circle", emoji: "🔴", category: "Hidden" },
  "pencil": { width: 200, label: "Pencil", emoji: "✏️", category: "Hidden" },
  "crazy-8s": { width: 800, label: "Crazy 8s", emoji: "🎱", category: "Ideate & Brainstorm" },

  // ─── Session Mode (7-phase interview prep framework) ──────────────
  // Phase 01–02 — Interrogate the brief / diagnose the person
  "brief-interrogation": { width: 560, label: "Brief Interrogation", emoji: "🔍", category: "Empathize & Analyze" },
  "working-assumption": { width: 420, label: "Working Assumption", emoji: "🧪", category: "Empathize & Analyze" },
  "timeline-row": { width: 800, label: "Timeline Row", emoji: "🛤️", category: "Empathize & Analyze" },
  "moment-of-truth": { width: 380, label: "Moment of Truth", emoji: "⭐", category: "Empathize & Analyze" },

  // Phase 03 — Set strategy
  "strategic-bet": { width: 420, label: "Strategic Bet", emoji: "♟️", category: "Define & Strategy" },

  // Phase 05 — Design the screens
  "copy-decision": { width: 420, label: "Copy Decision", emoji: "✍️", category: "Prototype & Flow" },
  "trigger-action-outcome": { width: 600, label: "Trigger → Action → Outcome", emoji: "🔁", category: "Prototype & Flow" },
  "thirty-day-arc": { width: 700, label: "30-Day Arc", emoji: "📅", category: "Prototype & Flow" },
  "entry-convergence": { width: 560, label: "Entry Convergence", emoji: "🧲", category: "Prototype & Flow" },

  // Phase 07 — Synthesise + close
  "pushback-answer": { width: 560, label: "Pushback + Answer", emoji: "🛡️", category: "Test & Summarize" },

  // Always-on reference cards
  "vocabulary-sheet": { width: 400, label: "Vocabulary Sheet", emoji: "📖", category: "Tools" },
  "interviewer-lens": { width: 400, label: "Interviewer Lens", emoji: "👁️", category: "Tools" },
  "self-score-checklist": { width: 420, label: "Self-Score Checklist", emoji: "🏁", category: "Tools" },

  // Legacy — kept registered (existing canvases may still contain them) but
  // hidden from the sidebar via the "Hidden" category, like the other tools.
  "timeline": { width: 600, label: "Timeline", emoji: "📅", category: "Hidden" },
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
    case "problem-statement-guided":
      return {
        height: 480,
        user: "A first-time user",
        needs: "a way to quickly plan their commute",
        because: "existing apps require too many steps before showing a route",
        observation: "",
        impact: "",
        outcome: "",
        showTips: true,
      };
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
        height: 300,
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
        height: 320,
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
        height: 380,
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
      // Explicit height is load-bearing: the frame renders h-full, and without a
      // height in `data` the node wrapper falls back to `auto` and collapses.
      return { height: FRAME_DEFAULT_HEIGHT };

    // ─── Frame children ───────────────────────────────────────────
    case "ui-nav-bar":
      return { title: "Screen Title", height: 56 };
    case "ui-card":
      return { title: "Card title", body: "Supporting copy goes here.", height: 132 };
    case "ui-text-block":
      return { text: "Add your copy here.", variant: "body", height: 64 };
    case "ui-button":
      return { label: "Continue", variant: "primary", height: 44 };
    case "success-metrics":
      return {
        metrics: [
          { id: "m1", label: "Activation Rate", value: "20%", target: "30%" },
          { id: "m2", label: "Retention (D30)", value: "15%", target: "25%" },
        ],
        height: 300,
      };
    case "clarifying-questions":
      return {
        questions: [
          { id: "q1", text: "Who is the primary end user?", answered: false },
          { id: "q2", text: "What is the core business goal?", answered: false },
        ],
        height: 340,
      };
    case "business-goals":
      return {
        business: "Increase user engagement by 40%",
        user: "Complete tasks faster with less friction",
        tech: "Scalable, API-first architecture",
        height: 320,
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
      return { shapeType: "rectangle", color: "bg-blue-500", height: 100 };
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
      return { height: 400 };
    case "jtbd-table":
      return {
        height: 380,
        title: "Jobs to Be Done",
        jobs: [
          {
            id: "j1",
            situation: "When I'm preparing for a design interview...",
            functional: "I want to practice structured whiteboarding",
            emotional: "So I feel confident and prepared",
            social: "And appear competent to the interviewer",
            outcome: "Nail the whiteboarding round",
          },
          {
            id: "j2",
            situation: "",
            functional: "",
            emotional: "",
            social: "",
            outcome: "",
          },
        ],
      };
    case "edge-case":
      return {
        height: 280,
        scenario: "What happens when...",
        impact: "This matters because...",
        mitigation: "We could handle this by...",
        severity: "medium", // low | medium | high
      };
    case "unsolved-problem":
      return {
        height: 260,
        problem: "A problem I haven't solved yet...",
        why_unsolved: "I didn't address this because...",
        future_approach: "Given more time, I would...",
      };
    case "summary-card":
      return { label: "Summary", text: "Reflecting on the process...", height: 280 };
    case "simple-text":
      return { text: "Type here...", fontSize: 16 };
    case "simple-shape":
      return { shapeType: "rectangle", color: "bg-white border-2 border-slate-300" };

    // ─── Session Mode ─────────────────────────────────────────────
    case "brief-interrogation":
      return {
        prompt: "Design a feature to help commuters plan their daily journey.",
        what_is_asked: "A planning feature for a daily, repeated commute.",
        what_is_NOT_asked: "A one-off trip planner or a maps replacement.",
        constraints: ["Mobile-first", "Works offline on the platform", "Launch in one quarter"],
        success_looks_like: "Commuters plan tomorrow's trip in under 30 seconds.",
        height: 420,
      };
    case "working-assumption":
      return {
        assumption: "Users abandon onboarding because it asks for too much up front.",
        because: "Support tickets and drop-off analytics both spike on the profile step.",
        validate_by: "A/B test a 2-field signup vs. the current 6-field form.",
        height: 320,
      };
    case "timeline-row":
      return {
        title: "User Journey",
        stages: [
          { id: "s1", label: "Discover", emotion: "neutral", note: "Hears about it from a colleague." },
          { id: "s2", label: "Sign up", emotion: "negative", note: "Long form, unclear value." },
          { id: "s3", label: "First win", emotion: "positive", note: "Completes a task fast." },
          { id: "s4", label: "Habit", emotion: "positive", note: "Returns daily." },
        ],
        height: 280,
      };
    case "moment-of-truth":
      return {
        moment: "The first time the user hits 'Send' and waits for a reply.",
        why_critical: "It's the make-or-break trust moment — does the product deliver?",
        emotion: "frustration",
        current_experience: "A blank spinner with no feedback.",
        ideal_experience: "Instant optimistic UI with a clear status.",
        height: 380,
      };
    case "strategic-bet":
      return {
        we_believe: "adding a guided first-run checklist",
        for_user: "first-time solo users",
        will_achieve: "a 15% lift in week-1 activation",
        because: "activated users all completed 3+ core actions in their first session.",
        riskiest_assumption: "Users will follow a checklist rather than dismiss it.",
        height: 380,
      };
    case "copy-decision":
      return {
        screen_moment: "Which screen or state?",
        headline: "Your headline copy here",
        cta_text: "Action label",
        microcopy: "Supporting text...",
        why_this_copy: "Why did you choose these words?",
        height: 360,
      };
    case "trigger-action-outcome":
      return {
        trigger: "Push notification: 'Your report is ready.'",
        action: "User taps in and reviews the summary.",
        outcome: "Shares the report with their team.",
        loop_back: true,
        loop_text: "Teammates open it, which triggers their own reports.",
        height: 280,
      };
    case "thirty-day-arc":
      return {
        title: "First 30 Days",
        milestones: [
          { id: "d1", day_label: "Day 1", headline: "Completes first core action", action: "Guided setup + a quick win", feel: "Capable" },
          { id: "w1", day_label: "Week 1", headline: "Builds a small habit", action: "Nudges at the right moments", feel: "In control" },
          { id: "w24", day_label: "Week 2–4", headline: "Invites a teammate", action: "Surfaces collaboration value", feel: "Connected" },
          { id: "d30", day_label: "Day 30", headline: "Relies on it weekly", action: "Recap of value delivered", feel: "Invested" },
        ],
        height: 400,
      };
    case "entry-convergence":
      return {
        core_action: "Create a new note",
        entry_points: [
          { id: "e1", channel: "Home FAB", description: "Primary button on the main screen." },
          { id: "e2", channel: "Share sheet", description: "Send text/links from other apps." },
          { id: "e3", channel: "Widget", description: "One-tap capture from the home screen." },
          { id: "e4", channel: "Search", description: "'New note' as the first result." },
        ],
        convergence_note: "Every path lands in the same fast, focused editor.",
        height: 440,
      };
    case "pushback-answer":
      return {
        pushbacks: [
          { id: "p1", objection: "This adds friction to signup.", answer: "It replaces a longer form — net steps go down, not up.", confidence: "high" },
          { id: "p2", objection: "Engineering cost is too high for the quarter.", answer: "We can ship a rules-based v1 before the ML version.", confidence: "medium" },
        ],
        height: 400,
      };
    case "vocabulary-sheet":
      return {
        domain: "EdTech",
        terms: [
          { id: "v1", term: "LMS", definition: "Learning Management System — where courses live." },
          { id: "v2", term: "Activation", definition: "A learner completing their first lesson." },
          { id: "v3", term: "Cohort", definition: "A group of learners moving through together." },
        ],
        height: 360,
      };
    case "interviewer-lens":
      // Static reference card — content is fixed in the renderer, so no editable data.
      return { height: 380 };
    case "self-score-checklist":
      return {
        items: [
          { id: "sc1", label: "Did I interrogate the brief before sketching?", done: false },
          { id: "sc2", label: "Did I name a specific user?", done: false },
          { id: "sc3", label: "Did I identify at least one moment of truth?", done: false },
          { id: "sc4", label: "Did I set a single strategic direction?", done: false },
          { id: "sc5", label: "Did I complete at least one JTBD?", done: false },
          { id: "sc6", label: "Did I sketch at least 2 screens with annotations?", done: false },
          { id: "sc7", label: "Did I name a specific piece of UI copy?", done: false },
          { id: "sc8", label: "Did I map a retention loop?", done: false },
          { id: "sc9", label: "Did I name at least one edge case?", done: false },
          { id: "sc10", label: "Did I name one unsolved problem?", done: false },
          { id: "sc11", label: "Did I deliver a synthesis statement?", done: false },
          { id: "sc12", label: "Did I anticipate at least one pushback?", done: false },
        ],
        height: 460,
      };

    default:
      return {};
  }
}

/**
 * Routing is fully automatic: ConnectionLayer derives which sides the arrow
 * leaves and enters from the nodes' live geometry on every render. There are
 * deliberately no stored `sourceHandle`/`targetHandle` — freezing them at
 * creation is what produced the zigzag routes (the arrow kept entering from the
 * side that was correct when it was drawn, not the side that's correct now).
 */
export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  style?: "orthogonal" | "straight" | "curved";
  color?: string;
  strokeWidth?: number;
  label?: string;
}

export interface ConnectionHandle {
  id: string;
  position: "top" | "right" | "bottom" | "left";
  type: "source" | "target" | "both";
}
