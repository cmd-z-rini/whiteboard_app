# Product Requirements Document
## PrepSlate

**Version:** 1.0  
**Status:** Refinement & Scale Phase  
**Last Updated:** May 2026

---

## Executive Summary

**PrepSlate** is a specialized, infinite-canvas whiteboarding tool purpose-built for Product Managers and Designers preparing for technical interviews and design thinking exercises. Unlike general-purpose tools (Miro, FigJam), it focuses exclusively on the frameworks and components needed for PM/Product Design interview scenarios.

### Vision Statement
> "The most frictionless way to practice whiteboarding frameworks—built for PM and Design interviews, not enterprise collaboration."

### Core Hypothesis
Interview candidates waste valuable prep time wrestling with bloated whiteboarding tools. By stripping away collaboration features and focusing solely on solo practice workflows, we can deliver a 10x faster setup-to-practice experience.

---

## Problem Space

### User Personas

**Primary: The PM Interview Candidate**
- Preparing for FAANG/tech PM interviews
- Needs to practice frameworks (User Journey Maps, Prioritization Matrices, Product Strategy Canvases)
- Values speed over collaboration features
- Pain point: Existing tools (Miro/FigJam) require too much UI navigation to set up a simple practice session

**Secondary: The Product Designer (Portfolio Builder)**
- Building case studies for interviews
- Needs clean, exportable wireframes and design thinking artifacts
- Pain point: Tools like Figma are overkill for low-fidelity concept visualization

### Jobs to Be Done
When I'm **preparing for a PM/Design interview**, I want to **quickly sketch out a framework on an infinite canvas**, so I can **focus on practicing my thinking, not learning the tool**.

---

## Product Strategy

### In Scope (MVP → V1.5)
1. **Infinite Canvas Experience**
   - Infinite pan/zoom dot-grid workspace
   - Performant rendering (no lag on 50+ nodes)
   - Figma-level physics (smooth drag, snap-to-grid, z-index management)

2. **Design Thinking Toolkit**
   - Pre-built templates: Persona Cards, Empathy Maps, User Journey Maps, 2x2 Matrices
   - SVG mobile wireframe frames (iOS/Android device mockups)
   - Atomic elements: Sticky notes, shapes (rectangle, circle, arrow)
   - Text annotations with inline editing

3. **Connection Engine**
   - Drag-to-connect arrows between nodes
   - Smart routing (orthogonal edges with collision avoidance)
   - Arrow styles: straight, curved, elbow (90° corners)

4. **Export & Persistence**
   - Export current view to PNG
   - Browser localStorage for auto-save (no login required)

### Out of Scope (Post-V2)
- Real-time collaboration / multiplayer mode
- Cloud sync / account system
- Advanced drawing tools (freehand pen remains basic)
- Presentation mode / slide decks
- Mobile app (web-first, responsive later)

---

## User Experience Goals

### Core UX Principles

1. **"Naked Canvas" Philosophy**
   - No UI chrome on canvas elements (sticky notes should just be sticky notes, not cards with headers)
   - Tools/menus live in fixed sidebars—the canvas is sacred
   - FigJam mental model: direct manipulation over dialog boxes

2. **Zero Learning Curve**
   - User should be productive in <60 seconds
   - Keyboard shortcuts mirror Figma/FigJam (V for select, T for text, etc.)
   - Drag-and-drop from template library (no multi-step wizards)

3. **Performance First**
   - Target: 60fps dragging on canvas with 100+ nodes
   - Surgical re-renders (moving one node shouldn't repaint the entire canvas)

---

## Technical Architecture

### Current Stack
- **Frontend:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS (strict design token usage)
- **Canvas Engine:** Custom SVG overlay + DOM-based node positioning
- **State:** Zustand (lightweight, performant global state)

### Key Architectural Decisions

1. **Hybrid Rendering Model**
   - Canvas grid: SVG background
   - Nodes: Absolutely positioned DOM elements (not SVG shapes)
   - Connections: SVG overlay layer
   - **Rationale:** DOM elements allow rich HTML/CSS for templates (like Empathy Maps with complex grids), while SVG handles lines/arrows efficiently

2. **Custom Resize Engine**
   - Math-based transformer (not CSS Grid resize)
   - Supports aspect-ratio locking (Shift) and center-scaling (Alt)
   - **Rationale:** Prevents CSS Grid/Flexbox components (Empathy Maps) from collapsing during resize

3. **Connection Coordinate System**
   - Absolute positioning relative to viewport, not parent containers
   - Arrows recalculate on pan/zoom/drag
   - **Rationale:** Decouples connection logic from node layout

---

## Feature Specifications

### F1: Infinite Canvas
**User Story:** As a user, I want to pan and zoom across an infinite workspace, so I can organize complex frameworks spatially.

**Acceptance Criteria:**
- Canvas supports pan (click-drag background) and zoom (scroll wheel)
- Dot grid pattern scales with zoom level
- Zoom range: 10% → 400%
- Zoom resets to 100% with keyboard shortcut (Cmd+0)

---

### F2: Node Dragging & Selection
**User Story:** As a user, I want to drag elements smoothly and select multiple nodes, so I can rearrange my whiteboard effortlessly.

**Acceptance Criteria:**
- Single-click to select a node (shows resize handles)
- Click-drag to move selected node(s)
- Bounding-box multi-select: Shift+drag creates selection rectangle
- Selected nodes move as a group
- Dragging brings selected node(s) to front (z-index auto-increment)

**Performance Target:**
- 60fps drag on canvas with 100 nodes

---

### F3: Connection Engine (Arrows)
**User Story:** As a user, I want to draw arrows between nodes to map user flows and relationships.

**Acceptance Criteria:**
- Click connection handle on node → drag to target node → release to create arrow
- Arrow types: Straight, Curved (bezier), Orthogonal (90° elbows)
- Arrows update automatically when connected nodes move
- Orthogonal arrows avoid overlapping with nodes (basic collision detection)

**Open Questions:**
- Should arrows support labels/annotations?
- Delete behavior: Delete node → connected arrows also delete?

---

### F4: Design Thinking Templates
**User Story:** As a PM candidate, I want to drag pre-built templates onto the canvas, so I can practice frameworks quickly.

**Templates:**
1. **Persona Card**
   - Photo placeholder, Name, Role, Goals, Pain Points
2. **Empathy Map**
   - 4-quadrant grid: Says, Thinks, Does, Feels
3. **User Journey Map**
   - Timeline with stages (Awareness, Consideration, Decision, Retention)
   - Rows: Actions, Touchpoints, Emotions (peaks/valleys)
4. **2x2 Prioritization Matrix**
   - Axes: Impact vs. Effort (configurable labels)

**Acceptance Criteria:**
- Templates accessible via left sidebar (drag-and-drop)
- All text fields support inline editing (click to edit, ESC to cancel, Enter to save)
- Styling follows strict Tailwind design tokens (no arbitrary values)

---

### F5: Interactive Mockup Frames (Mobile & Web)
**User Story:** As a designer, I want to drop UI elements inside mockup frames, so I can create realistic screen flows that clearly communicate my solution during interviews.

**Core Behavior:**
Mockup frames (iPhone, Android, Desktop Browser) act as **containers** — not just static illustrations. Users can:
- Drop UI cards, text blocks, buttons, icons *inside* the frame
- Child elements stay constrained to the screen area (can't drag outside)
- When frame is resized, child elements scale proportionally

**Child Element Library:**
1. **Navigation Bars**
   - Top nav with back button, title, action icons
   - Bottom tab bar (iOS/Android styles)
2. **UI Cards**
   - Content cards (image + title + description)
   - List items (icon + text + chevron)
   - CTA buttons (primary, secondary, ghost)
3. **Text Blocks**
   - Headings (H1-H4)
   - Body text (paragraph, caption)
   - Labels (tags, badges)
4. **Form Elements**
   - Input fields (text, email, password)
   - Toggles, checkboxes, radio buttons
   - Dropdowns

**Technical Architecture:**

```
<MobileFrame> (iPhone 14)
  ├─ <FrameChrome> (device bezel, notch, home indicator - static SVG)
  └─ <ScreenContainer> (the actual screen area)
       ├─ <NavBar> (user-added, draggable within screen)
       ├─ <UICard> (user-added, resizable within screen)
       └─ <TextBlock> (user-added, editable)
```

**Coordinate System:**
- Frame uses **local coordinate system** (origin at top-left of screen area)
- Child elements positioned relative to frame, not canvas
- On frame resize: `childElement.x *= scaleFactorX`, `childElement.y *= scaleFactorY`

**Acceptance Criteria:**
- User can drag UI elements from sidebar → drop into mockup frame
- Child elements cannot be dragged outside screen boundaries
- Resizing frame scales all children proportionally (aspect ratios preserved)
- Deleting frame prompts: "Delete frame and all contents?" (or convert children to canvas nodes)
- Frame supports zoom-to-fit: Double-click frame → canvas auto-zooms/pans to center it

**UX Polish:**
- Frame has subtle screen glow/shadow when hovered (indicates drop target)
- Drop zones highlight when dragging compatible element
- "Add to screen" helper tooltip on first use

**Performance Target:**
- Frame with 20 child elements resizes at 60fps

---

### F5: Export to PNG
**User Story:** As a user, I want to export my canvas to an image, so I can include it in my portfolio or interview follow-up emails.

**Acceptance Criteria:**
- Export button captures current viewport (what user sees)
- Option to "Export Full Canvas" (all nodes, not just viewport)
- Downloaded file naming: `whiteboard-YYYY-MM-DD-HH-MM.png`
- No watermarks or branding

**Tech Note:** Uses `html2canvas` library

---

## Refinement Roadmap (Next 4 Sprints)

### Sprint 1: Interaction Physics Polish
**Goal:** Make dragging feel like Figma/FigJam, not like moving HTML divs.

- [ ] Implement z-index auto-increment on selection
- [ ] Bounding-box multi-select (Shift+drag)
- [ ] Group drag (move selected nodes together)
- [ ] Reduce drag lag (optimize re-render logic)

**Success Metric:** User testing shows <100ms perceived lag on drag

---

### Sprint 2: Connection Engine 2.0
**Goal:** Upgrade arrows from basic lines to intelligent orthogonal routing.

- [ ] Implement orthogonal (90° elbow) edge routing algorithm
- [ ] Basic collision detection (arrows avoid node bounding boxes)
- [ ] Arrow style picker (straight, curved, orthogonal)
- [ ] Connection handle visual polish (larger hit targets)

**Success Metric:** Users can draw complex user flows without manual arrow adjustment

---

### Sprint 3: Component Architecture & UX Polish
**Goal:** Refine templates to feel production-grade, not MVP prototypes.

- [ ] Inline text editing UX improvements (auto-focus, resize on content)
- [ ] Standardize spacing/padding across all templates (Tailwind tokens only)
- [ ] Add keyboard shortcuts reference modal (? key)
- [ ] Implement "Delete" key behavior (delete selected nodes + connections)

**Success Metric:** Users can complete a User Journey Map exercise in <5 minutes

---
**Goal:** Optimize re-renders and add undo/redo.

- [ ] Audit canvas state management (prevent full re-renders on single node move)
- [ ] Implement Undo/Redo stack (20-step history)
- [ ] Add performance monitoring (log FPS during drag operations)
- [ ] Lazy-load off-screen nodes (virtualization for 500+ node canvases)

**Success Metric:** 60fps maintained with 200+ nodes on canvas

---

## Success Metrics (Post-Launch)

### Primary Metrics
1. **Time to First Framework:** <60 seconds from landing → drawing first connection
2. **Session Duration:** Avg. 15+ minutes (indicates depth of practice)
3. **Export Rate:** 40%+ of sessions result in PNG export (indicates value capture)

### Secondary Metrics
4. **Repeat Usage:** 3+ sessions per user in first week
5. **NPS from PM/Design candidates:** Target >50

---

## Open Questions & Risks

### Technical Risks
1. **Performance at Scale:** Will the hybrid SVG+DOM model handle 500+ nodes?
   - **Mitigation:** Implement viewport-based virtualization in Sprint 4
   
2. **Browser Compatibility:** Does the canvas work on Safari/Firefox?
   - **Mitigation:** Add cross-browser testing in Sprint 2

### UX Risks
1. **Discoverability:** Will users find the template library without onboarding?
   - **Mitigation:** Add animated "first-run" guide (skippable)

2. **Export Quality:** Will `html2canvas` handle complex CSS Grid templates?
   - **Mitigation:** Test with all templates, consider fallback to SVG export

---

## Appendix

### Competitive Landscape
| Tool | Strength | Weakness |
|------|----------|----------|
| Miro | Enterprise features, collaboration | Slow setup, bloated for solo use |
| FigJam | Polished UX, jam-style interaction | Requires Figma account, not PM-focused |
| Whimsical | Clean, fast | Lacks connection routing, limited templates |
| **PrepSlate** | **Interview-specific, zero setup** | **No collaboration (by design)** |

### Inspiration & Design References
- FigJam: Node dragging physics, connection handles
- Excalidraw: Minimal UI, fast setup
- Notion: Inline editing UX for text blocks

---

**Document Owner:** Engineering & Design Lead  
**Stakeholders:** Product (Interviews), Engineering (Frontend)  
**Next Review:** Post-Sprint 1 (June 2026)