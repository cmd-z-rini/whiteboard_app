import type { Domain } from "../components/DomainSelector";

// Domain-specific guidance organized by whiteboard section
// Each section has tips for every domain that explain HOW the methodology
// adapts to that industry's unique constraints, users, and patterns.

export interface DomainSectionData {
  tips: string[];
  title: string;
}

type SectionId =
  | "brief"
  | "understand"
  | "research"
  | "personas"
  | "journey"
  | "ideation"
  | "wireframes"
  | "principles"
  | "metrics"
  | "next-steps";

export const DOMAIN_KNOWLEDGE: Record<Domain, Record<SectionId, DomainSectionData>> = {
  edtech: {
    brief: {
      title: "Problem Framing in EdTech",
      tips: [
        "Define which learning taxonomy (Bloom's) level you're targeting — recall, application, or creation",
        "Clarify if this is K-12, higher-ed, or corporate training — regulatory and compliance needs differ drastically",
        "Ask about LMS integration (Canvas, Blackboard, Moodle) — most EdTech doesn't live in isolation",
        "Consider both synchronous (live class) and asynchronous (self-paced) modes of learning",
      ],
    },
    understand: {
      title: "Clarifying for Education",
      tips: [
        "Ask: Is the buyer the same as the end user? (Admin buys, teacher uses, student consumes)",
        "Understand academic calendar constraints — launches tied to semesters, not sprints",
        "Probe for accessibility mandates: Section 508, WCAG 2.1 AA are often legally required",
        "Check for COPPA / FERPA compliance if involving minors' data",
        "Ask about digital divide — what % of users have reliable internet / devices?",
      ],
    },
    research: {
      title: "Research in Education Contexts",
      tips: [
        "Classroom observation > surveys — watch how teachers actually manage tech in noisy environments",
        "Student attention spans and multitasking behavior are key observables",
        "Include parents/guardians as a stakeholder in K-12 — they influence adoption",
        "Pilot programs at 2-3 schools before scaling — EdTech has long feedback cycles",
        "Look at learning outcomes data (test scores, completion rates) not just engagement",
      ],
    },
    personas: {
      title: "EdTech User Archetypes",
      tips: [
        "Teacher persona: distinguish between tech-savvy early adopter vs. reluctant late adopter",
        "Student persona: consider age-appropriate cognitive abilities and attention spans",
        "Admin persona: focuses on cost, compliance, reporting — rarely uses the product daily",
        "Parent persona (K-12): wants visibility into progress without complexity",
        "IT coordinator: gate-keeper for deployment, cares about SSO, data exports, uptime",
      ],
    },
    journey: {
      title: "EdTech User Flow Considerations",
      tips: [
        "Core loop: Discover content → Engage with lesson → Practice/assess → Review results → Next step",
        "Teacher flow branches: content creation vs. student monitoring — keep them separate",
        "Flag onboarding as a pain point — September spikes mean 100s of users hitting setup at once",
        "The 'homework gap' is a real flow-breaker — offline/low-bandwidth steps need a fallback",
        "Student drop-off typically happens after step 3-4 — mark that as a key opportunity",
      ],
    },
    ideation: {
      title: "EdTech Solution Patterns",
      tips: [
        "Gamification works for K-8 but can feel patronizing in higher-ed — calibrate carefully",
        "Adaptive learning paths (AI-driven) are high-impact but require content taxonomy upfront",
        "Offline-first mode is critical for schools with unreliable connectivity",
        "Batch operations for teachers (assign to 150 students at once) save enormous time",
        "Peer learning features (forums, study groups) often outperform solo content delivery",
      ],
    },
    wireframes: {
      title: "EdTech Screen Priorities",
      tips: [
        "Teacher dashboard: class overview, at-risk students, upcoming deadlines at a glance",
        "Student view: progress tracker, next recommended activity, streak/motivation widget",
        "Assessment flow: timer, question navigation, review-before-submit pattern",
        "Content creation tool: template-based, drag-and-drop, preview-before-publish",
        "Parent portal: simplified read-only view of child's progress and upcoming work",
      ],
    },
    principles: {
      title: "EdTech Design Principles",
      tips: [
        "Pedagogy before technology — the learning model drives the UX, not the reverse",
        "Progressive complexity — scaffold features as users become more proficient",
        "Reduce cognitive load during learning — minimize UI chrome when content is active",
        "Design for the worst connection — 3G on a shared Chromebook is the real baseline",
        "Make data actionable — don't just show charts, surface 'Student X needs help with Y'",
      ],
    },
    metrics: {
      title: "Learning-Centric Metrics",
      tips: [
        "Learning outcomes (test score improvement, skill mastery) > time-on-platform",
        "Course/module completion rate — more meaningful than DAU in education",
        "Teacher adoption rate — if teachers don't use it, students won't either",
        "Content creation velocity — how fast can teachers build/adapt materials?",
        "Accessibility score — WCAG compliance %, screen reader compatibility rate",
      ],
    },
    "next-steps": {
      title: "EdTech Rollout Considerations",
      tips: [
        "Pilot with 2-3 schools first — gather teacher feedback before district-wide rollout",
        "Train-the-trainer model works better than documentation in education",
        "Plan for back-to-school and mid-year onboarding spikes",
        "Include a 'district admin' view for aggregate reporting across schools",
        "Budget for ongoing pedagogical review — content needs regular academic validation",
      ],
    },
  },

  "ai-ml": {
    brief: {
      title: "Problem Framing for AI Products",
      tips: [
        "Distinguish: Is AI the product (ML platform) or a feature within a product (AI-assisted search)?",
        "Clarify the model's maturity — prototype, production, or fine-tuned? This affects UX confidence levels",
        "Ask about explainability requirements — regulated industries need transparent AI decisions",
        "Define the human-in-the-loop vs. fully automated spectrum for this use case",
      ],
    },
    understand: {
      title: "Clarifying AI/ML Requirements",
      tips: [
        "Ask: What happens when the model is wrong? Design for error states and graceful degradation",
        "Probe for data sensitivity — PII, health data, financial data have different handling rules",
        "Understand training data biases — the model's limitations become the product's limitations",
        "Ask about latency expectations — real-time inference vs. batch processing changes UX entirely",
        "Check: Do users need to understand WHY the AI made a decision, or just trust the output?",
      ],
    },
    research: {
      title: "Research for AI Products",
      tips: [
        "Study mental models — how do users think the AI works? Misaligned expectations cause distrust",
        "Conduct 'Wizard of Oz' tests — simulate AI behavior with human operators before building",
        "Measure trust calibration — do users over-rely on AI or under-trust it?",
        "Interview both technical (data scientists) and non-technical (business) users separately",
        "Analyze error patterns — which mistakes do users find acceptable vs. unacceptable?",
      ],
    },
    personas: {
      title: "AI Product User Archetypes",
      tips: [
        "Data scientist / ML engineer: wants raw control, custom models, API access, notebook integration",
        "Business analyst: needs plain-language insights, visualizations, export-to-PowerPoint",
        "Domain expert: has subject knowledge but not ML expertise — needs guided model building",
        "Compliance officer: needs audit trails, model versioning, bias detection reports",
        "End consumer: interacts with AI indirectly — chatbot, recommendation, auto-complete",
      ],
    },
    journey: {
      title: "AI Product Flow Patterns",
      tips: [
        "Core flow: Input data → AI processes → Review output → Accept/correct → Iterate",
        "Always include a 'verify/trust' step after AI output — users need to validate before acting",
        "Flag the cold-start step (first use with no data) as a pain point — AI is weakest here",
        "The correction loop (AI wrong → user fixes → AI learns) is a separate flow worth mapping",
        "Batch vs. real-time flows are fundamentally different — pick the right one for your problem",
      ],
    },
    ideation: {
      title: "AI-Specific Solution Patterns",
      tips: [
        "Confidence scores on predictions help users calibrate trust (show 87% vs. 52% confidence)",
        "'Explain this result' as a core feature — not an afterthought",
        "Progressive automation: start with suggestions, let users promote to auto-actions over time",
        "Comparison views: 'AI recommendation vs. your manual choice' builds understanding",
        "Fallback patterns: what does the UI look like when the model can't produce a result?",
      ],
    },
    wireframes: {
      title: "AI Interface Priorities",
      tips: [
        "Dashboard: model performance overview, recent predictions, alerts for anomalies",
        "Prediction/result screen: output + confidence + explanation + feedback mechanism",
        "Data input/upload: drag-and-drop, format validation, preview before processing",
        "Model comparison: side-by-side outputs from different models or parameters",
        "Feedback loop UI: 'Was this helpful?' / 'Correct this' patterns for model improvement",
      ],
    },
    principles: {
      title: "AI Design Principles",
      tips: [
        "Transparency — always communicate what the AI is doing and why, in language users understand",
        "Controllability — users must be able to override, correct, or disable AI behavior",
        "Graceful degradation — design for model failures as a normal state, not an edge case",
        "Progressive disclosure of complexity — hide model internals by default, reveal on demand",
        "Bias awareness — surface potential biases in data/models proactively, don't wait for complaints",
      ],
    },
    metrics: {
      title: "AI Product Metrics",
      tips: [
        "Model accuracy/F1 score AND user-perceived accuracy — they often differ significantly",
        "Trust calibration: % of users who follow AI recommendations vs. override them",
        "Correction rate: how often users modify AI outputs — high is bad OR means good UX (depends)",
        "Time-to-insight: how fast can a non-technical user go from data to actionable finding?",
        "Fairness metrics: disparate impact across demographic groups in model outputs",
      ],
    },
    "next-steps": {
      title: "AI Product Rollout",
      tips: [
        "Shadow mode launch: run AI alongside human decisions without acting on outputs initially",
        "A/B test AI-assisted vs. manual workflows to prove value before full rollout",
        "Establish a model monitoring dashboard for the ops team from day one",
        "Plan for model retraining cycles — the UX around 'model updated' matters",
        "Create an AI ethics review checklist for the client's governance process",
      ],
    },
  },

  saas: {
    brief: {
      title: "Problem Framing for SaaS",
      tips: [
        "Clarify the SaaS model: self-serve (PLG) vs. sales-led — this fundamentally changes onboarding UX",
        "Ask about multi-tenancy: do different orgs need custom branding, permissions, or data isolation?",
        "Identify the 'aha moment' — the single action that correlates with long-term retention",
        "Determine pricing tier impact on features — which capabilities are gated behind upgrades?",
      ],
    },
    understand: {
      title: "Clarifying SaaS Context",
      tips: [
        "Ask: Is this B2B, B2C, or B2B2C? Each has different decision-maker and end-user dynamics",
        "Probe for competitive landscape — SaaS users compare alternatives constantly (G2, Capterra)",
        "Understand the integration ecosystem — Zapier, API, webhooks, SSO are table-stakes expectations",
        "Ask about free trial / freemium strategy — trial-to-paid conversion is the core business metric",
        "Check for data portability requirements — users want to know they can export and leave",
      ],
    },
    research: {
      title: "SaaS Research Methods",
      tips: [
        "Funnel analytics (signup → activation → retention → referral) reveal exactly where users drop off",
        "Cohort analysis by signup source — users from different channels behave differently",
        "Churn interviews are more valuable than active-user interviews — understand why people leave",
        "Feature request voting (Canny, ProductBoard) quantifies demand but beware vocal minority bias",
        "Session recordings on key flows reveal friction points no survey will surface",
      ],
    },
    personas: {
      title: "SaaS User Archetypes",
      tips: [
        "Champion / buyer: the internal advocate who discovers and pushes for adoption — key for B2B",
        "Power user: 10% of users who generate 80% of value — design for their efficiency",
        "Casual user: logs in weekly, needs progressive onboarding — most of your user base",
        "Admin: manages billing, seats, permissions, SSO — not glamorous but critical for retention",
        "Decision maker (B2B): rarely uses the product but approves budget — needs ROI dashboards",
      ],
    },
    journey: {
      title: "SaaS User Flow Priorities",
      tips: [
        "Signup → Activation is the single most important flow — optimize every step relentlessly",
        "Map the 'aha moment' step explicitly — what action makes users realize the product's value?",
        "Flag the paywall/upgrade step — it's both a pain point AND an opportunity depending on UX",
        "Include the 'invite teammate' branch — viral expansion within orgs happens here",
        "The re-engagement flow (churned user returns) is often overlooked but highly impactful",
      ],
    },
    ideation: {
      title: "SaaS Solution Patterns",
      tips: [
        "Interactive product tours (not videos) for onboarding — let users learn by doing",
        "Empty states that guide action: 'No projects yet — Create your first one' with CTA",
        "Templates/presets that let new users see value in under 60 seconds",
        "In-app upgrade prompts at natural moments (not pop-ups) — contextual upselling",
        "Collaborative features (comments, sharing, @mentions) drive viral expansion within orgs",
      ],
    },
    wireframes: {
      title: "SaaS Screen Priorities",
      tips: [
        "Onboarding: role selection → workspace setup → first value action (3 steps max)",
        "Dashboard: key metrics, recent activity, quick actions, upgrade nudge if on free tier",
        "Core workflow: the primary repeating action users perform daily — optimize for speed",
        "Settings: billing, team management, integrations, API keys, data export",
        "Collaboration: shared workspace, permissions, activity feed, notifications center",
      ],
    },
    principles: {
      title: "SaaS Design Principles",
      tips: [
        "Time-to-value — every design decision should reduce the time from signup to first 'aha'",
        "Scalable complexity — simple for 1 user, powerful for 1000 — same product",
        "Self-serve first — if a user needs support docs, the UX has already failed",
        "Predictable pricing UX — users should never be surprised by what a feature costs",
        "Cross-platform consistency — web, mobile, API should feel like the same product",
      ],
    },
    metrics: {
      title: "SaaS North Star Metrics",
      tips: [
        "Activation rate: % of signups who complete the 'aha moment' action within first session",
        "Net Revenue Retention (NRR): measures expansion + churn — the single best SaaS health metric",
        "Time-to-value: minutes from signup to first meaningful action — lower is better",
        "Feature adoption rate: % of users engaging with a new feature within 30 days of launch",
        "NPS by cohort: track satisfaction across different user segments and plan tiers",
      ],
    },
    "next-steps": {
      title: "SaaS Launch Strategy",
      tips: [
        "Soft launch with design partners (5-10 companies) who get early access for feedback",
        "Build a public changelog/roadmap to signal momentum and retain trust",
        "Instrument every flow from day one — you can't optimize what you don't measure",
        "Plan for pricing page iteration — it's the highest-leverage page on the site",
        "Set up automated onboarding emails triggered by user behavior, not time-based drip",
      ],
    },
  },

  enterprise: {
    brief: {
      title: "Problem Framing for Enterprise",
      tips: [
        "Enterprise deals involve 6-12 month sales cycles — the product must demo well to executives",
        "Ask about procurement process: security reviews, SOC 2, vendor assessments gate everything",
        "Clarify: is this greenfield or replacing a legacy system? Migration UX is often the real challenge",
        "Understand org chart impact — who has authority to mandate usage across departments?",
      ],
    },
    understand: {
      title: "Clarifying Enterprise Context",
      tips: [
        "Ask about IT governance: on-prem vs. cloud, VPN requirements, data residency (GDPR, CCPA)",
        "Probe for change management — enterprise users resist new tools regardless of UX quality",
        "Understand approval workflows — enterprise features often need multi-level sign-off chains",
        "Ask about SSO/SAML/SCIM — IT won't approve without centralized identity management",
        "Check for audit trail requirements — every action may need to be logged and exportable",
      ],
    },
    research: {
      title: "Enterprise Research Approach",
      tips: [
        "Access is hard — negotiate research sessions into the contract, users are behind firewalls",
        "Shadow users in their actual environment — enterprise workflows are messier than described",
        "Interview IT admins separately from end users — their needs actively conflict",
        "Study the 'workaround economy' — Excel sheets and email threads that bypass existing tools",
        "Benchmark against existing tools (SAP, Salesforce, ServiceNow) — users compare to what they know",
      ],
    },
    personas: {
      title: "Enterprise User Archetypes",
      tips: [
        "Executive sponsor: cares about ROI dashboards, board-ready reports, strategic alignment",
        "Department manager: needs team visibility, approval workflows, resource allocation",
        "Individual contributor: daily user who wants efficiency — least say in purchasing, most affected by UX",
        "IT administrator: SSO, SCIM provisioning, audit logs, uptime SLAs, security posture",
        "Compliance officer: data governance, retention policies, export capabilities, access controls",
      ],
    },
    journey: {
      title: "Enterprise Flow Complexity",
      tips: [
        "Map admin setup flow separately from end-user flow — they're completely different experiences",
        "Approval chains (request → review → approve → execute) are enterprise-specific flow steps",
        "Flag 'legacy data migration' as a critical pain point — users won't adopt without their old data",
        "Include the 'IT security review' step for the buyer flow — it gates everything else",
        "Phased rollout means mapping pilot team flow vs. org-wide flow as separate paths",
      ],
    },
    ideation: {
      title: "Enterprise Solution Patterns",
      tips: [
        "Role-based dashboards — executives, managers, and ICs see completely different home screens",
        "Configurable workflows — every enterprise wants to customize approval chains and notifications",
        "Bulk operations + CSV import/export — enterprise users manage data in spreadsheets",
        "Scheduled reports (auto-email PDF to stakeholders) — not everyone logs into the tool",
        "Sandbox/staging environments — enterprise clients test changes before deploying to production",
      ],
    },
    wireframes: {
      title: "Enterprise Screen Priorities",
      tips: [
        "Admin console: user management (SCIM), role permissions, SSO config, usage analytics",
        "Executive dashboard: KPI cards, trend charts, drill-down capability, export-to-PDF",
        "Workflow builder: drag-and-drop approval chains, conditional logic, notification rules",
        "Data table view: sortable, filterable, bulk-selectable, inline-editable, exportable",
        "Audit log: searchable activity history with user, action, timestamp, and affected entity",
      ],
    },
    principles: {
      title: "Enterprise Design Principles",
      tips: [
        "Configurability over customization — let admins adjust without developer involvement",
        "Density is a feature — enterprise users prefer information-dense UIs over whitespace",
        "Permissioning as a first-class concept — every feature needs role-based access control",
        "Backward compatibility — enterprises can't retrain 10,000 users when you change the UI",
        "Offline resilience — field workers and factory floors don't have reliable connectivity",
      ],
    },
    metrics: {
      title: "Enterprise Success Metrics",
      tips: [
        "License utilization: % of purchased seats actively used — low utilization kills renewals",
        "Workflow completion rate: % of processes that complete without manual intervention/workaround",
        "Admin ticket volume: support burden per 1000 users — lower means better self-serve UX",
        "Time-to-deploy: how long from contract signing to org-wide rollout — enterprises measure this",
        "Compliance audit pass rate: % of regulatory checks the platform satisfies out-of-the-box",
      ],
    },
    "next-steps": {
      title: "Enterprise Delivery Model",
      tips: [
        "Assign a dedicated CSM (Customer Success Manager) during onboarding — not just docs",
        "Create a 'deployment playbook' for IT teams with SSO setup guides and data migration scripts",
        "Build an ROI calculator that champions can share internally to justify the investment",
        "Plan quarterly business reviews (QBRs) with stakeholders to review adoption metrics",
        "Establish an enterprise advisory board (5-8 clients) for roadmap co-creation",
      ],
    },
  },
};