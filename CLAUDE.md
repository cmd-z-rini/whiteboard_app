# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A FigJam-style infinite-canvas whiteboard for practicing Product Design / PM interview frameworks (personas, empathy maps, user flows, prioritization matrices). Originally scaffolded by Figma Make (hence `@figma/my-make-file` in package.json and the shadcn/ui drop-in under `src/app/components/ui/`), then heavily rewritten by hand and by AI agents. See [README.md](README.md).

## Product spec

**[docs/PRD.md](docs/PRD.md) is the source of truth for feature specs.** Read it before designing or changing a feature — acceptance criteria, the template list, the "naked canvas" UX philosophy, and the mockup-frame container model all live there. When code and PRD disagree about *intent*, the PRD wins; raise the conflict rather than silently following the code.

But the PRD describes the **target** state, not the current one, and parts of its Technical Architecture section are simply wrong about this codebase. Do not "fix" code to match these — the code is what it is:

| PRD claims | Reality |
| --- | --- |
| State: Zustand | Plain `useState` in App.tsx; no store, no persistence |
| localStorage auto-save | No persistence at all — refresh loses the board |
| Zoom range 10% → 400% | Clamped 0.15–3 (15%–300%) |
| Mockup frames are containers with child elements (F5) | Not implemented; `MobileFrameNode` is a bare bezel |
| Naked-canvas: "sticky notes should just be sticky notes, not cards with headers" | Violated — `StandardCardWrapper` wraps every non-raw node |
| Arrow styles: straight, curved, orthogonal | Only orthogonal is reachable from the UI |

Also note the PRD numbers two different sections "F5" (Interactive Mockup Frames, and Export to PNG). Cite by name, not number.

## Commands

```bash
npm install     # first run; or ./setup.sh which does install + dev
npm run dev     # Vite dev server
npm run build   # Vite production build
```

That is the complete set of scripts. **There is no test suite, no linter, and no `tsconfig.json`** — Vite/esbuild strips TypeScript types without checking them, so type errors do not fail the build and there is no `typecheck` command to run. Verify changes by driving the app in the browser.

Two repo hygiene facts worth knowing before you touch git: there is no `.gitignore`, and `node_modules/` (~65k files) is committed. Expect `git status` to be noisy and avoid `git add -A`.

## Architecture

### State lives in two places, and that split matters

[App.tsx](src/app/App.tsx) is the single owner of `nodes`, `viewport`, `toolMode`, `selectedIds`, and `selectedColor` — plain `useState`, no store, no persistence. Refreshing the page loses the board.

The exception: `connections` state is held *inside* [InfiniteCanvas.tsx:41](src/app/components/canvas/InfiniteCanvas.tsx#L41), not in App. Anything at the App level (export, future save/load) can't see connections without lifting that state up first.

### Two coordinate spaces

Everything on the canvas depends on getting this conversion right. `viewport.x/y` are **screen pixels** (a pan offset), `viewport.zoom` is a scale factor:

```
logic = (screenPx - containerRect.topLeft - viewport.xy) / viewport.zoom
```

That's [`getLogicPos`](src/app/components/canvas/InfiniteCanvas.tsx#L128), and the same math is inlined in App's drop handler. The content layer applies `translate(viewport.x, viewport.y) scale(viewport.zoom)` with `transformOrigin: 0 0`; the SVG layers apply the equivalent `<g transform>`. Mouse deltas during drag/resize are captured in screen space and divided by `zoom` before being applied to node coordinates. Zoom clamps to 0.15–3.

Layer z-order inside the canvas: dot grid `z-0` → nodes `z-10` → connections `z-20` → draft connection `z-30` → selection box, live pencil stroke, drawing toolbar `z-50`.

### Node model — note the missing height

```ts
interface CanvasNode { id; type; parentId?; x; y; width; zIndex; data: Record<string, any> }
```

There is **no `height` field**. Height lives in the untyped `data.height` bag, and callers fall back to different defaults when it's absent — `100` for connection anchoring, `200` for box-select hit-testing. Most card nodes never set it (they size to content, `height: "auto"`); only resizable nodes do. If you add geometry-dependent logic, handle `data.height === undefined`.

A node with no `data.height` renders at `height: auto` with `minHeight: 40`. **Any node whose root element is `h-full` will therefore collapse to ~40px unless its `createDefaultData` sets a height.** This is what broke `mobile-frame` (it rendered as a formless dark sliver); if a new node type looks squashed, check this first.

`data` is deliberately untyped and shaped per node type by `createDefaultData(type)`.

### The nodes array is flat, but frame children are not

`nodes` is a single flat array, but a node with `parentId` set lives **inside a Mobile Frame's screen area, and its `x`/`y` are frame-local** (origin = top-left of the screen), not canvas coordinates. Children are rendered as DOM *inside* the frame's subtree — which is what makes "move the frame, children follow" work without any group-drag logic, and makes `overflow-hidden` the entire implementation of "children can't leave the screen."

The cost: **anything reasoning about canvas geometry must iterate roots only** (`!n.parentId`), or it will read local coords as canvas coords. The places that must stay roots-only are the node map, box-select, connection hit-testing, `ConnectionLayer`'s `nodes` prop (all in InfiniteCanvas), and `fitToScreen` (App). Children are deliberately **not connectable** — they get no connection handles, since anchoring would need `frame.x + child.x` computed throughout ConnectionLayer.

Frame geometry (`FRAME_BEZEL`, `FRAME_STATUS_BAR_H`, `FRAME_HOME_INDICATOR_H`, `getFrameScreenSize`, `getFrameScreenRect`) lives in [types.ts](src/app/components/canvas/types.ts) and is shared by the frame's chrome (as inline styles) and by the drop/clamp/scale math, so the two can't drift. Deleting a frame cascades to its children (`removeNodesCascade`) after a confirm — orphaned children would stay in the array, invisible but still exported.

Frame resize scales children proportionally from a snapshot taken at resize start (`resizeState.initialChildren`). It must be a snapshot: deriving the scale from current positions compounds it on every mousemove.

### Drag: dnd-kit for the palette only

`@dnd-kit` handles exactly one gesture — dragging a component from the palette onto the canvas (`DndContext` in App, `useDraggable` in ComponentPalette, `useDroppable` in InfiniteCanvas). **Everything else is hand-rolled mouse events** in InfiniteCanvas's `handleMouseDown/Move/Up`: node dragging, resizing, panning, box selection, pencil drawing, and shape creation. Don't reach for dnd-kit to fix a canvas interaction; those live in the mouse handlers, dispatched on `effectiveMode` (`toolMode`, overridden to `"pan"` while Space is held).

### The component registry: one type, five places

[types.ts](src/app/components/canvas/types.ts) is the source of truth. Adding a canvas component means touching all of these:

1. `CanvasComponentType` union — the type string
2. `COMPONENT_DEFAULTS` — default width, label, emoji, and **`category`**, which is what groups it in the palette sidebar
3. `createDefaultData()` — the initial `data` shape
4. `CanvasNodeRenderer`'s switch — the actual React component
5. `ICON_MAP` in [ComponentPalette.tsx](src/app/components/canvas/ComponentPalette.tsx) — otherwise the palette row renders no icon

The palette is generated by filtering `COMPONENT_DEFAULTS` by `category` against the hardcoded `CATEGORIES` list; a category string that isn't in that list makes the component invisible in the sidebar.

### Three classes of node

[CanvasNodeRenderer.tsx](src/app/components/canvas/CanvasNodeRenderer.tsx) (holds nearly every node implementation inline) dispatches nodes into three shapes. **Which one a type gets is the single biggest thing to know before editing a node.**

- **Raw nodes** (`simple-text`, `simple-shape`, `simple-circle`, `pencil`) — early-returned before the dispatch; render bare with their own `SelectionOverlay`.
- **Naked nodes** (`NAKED_TYPES`) — rendered inside `NakedNodeShell`: no header, no label, no grip, just a selection outline and a hover action bar floated *outside* the body. This enforces the PRD's "naked canvas" principle (a sticky note is a sticky note, not a card with a header). `RESIZABLE_NAKED_TYPES` is the subset that carries an explicit `data.height` and gets resize handles.
- **Carded nodes** — everything else, wrapped in `StandardCardWrapper` (white card chrome, drag-handle bar with the `COMPONENT_DEFAULTS` label, duplicate/delete). **Deliberately reserved for genuinely structured multi-field templates** (Persona Card, Empathy Map, User Journey, Prioritization Matrix). Don't add a type here just because it's new — check the naked-canvas principle in the PRD first.

So "make this card resizable" or "strip this card's chrome" is a set-membership change plus, sometimes, a `data.height` default — not a prop.

**Naked nodes are dragged by their body**, which changes text editing: a single click there would start an edit mid-drag, so naked nodes use double-click-to-edit (`InlineEdit`'s `activateOn="dblclick"`, and Sticky Note's textarea is `pointer-events-none` until it's in edit state). Carded nodes are dragged by their header, so they keep single-click-to-edit. If you make a carded type naked, you must switch its editors too or it will fight the drag.

### Connections

Drag from one of the four handles on a selected node to another node. The handle you grab only *starts* the connection — **it does not pin the exit side**, and no handles are stored on the `Connection`.

Routing is fully automatic: [ConnectionLayer.tsx](src/app/components/canvas/ConnectionLayer.tsx) derives both sides on every render from the nodes' live geometry (`chooseHandles`, using centers and box separation), so arrows re-route as nodes move. `routeOrthogonal` then steps `PADDING` (24px) clear of each face before turning. Two important invariants, both of which were bugs before:

- The "is there room between the nodes" test compares the **faces**, not the padded stubs. When the gap is narrower than `PADDING` the stubs overshoot each other, and a stub-based test sends a route detouring around a pair of nodes that are merely close.
- The around-the-outside route (only reachable when the boxes actually overlap) clears the **union** of both boxes. Clearing only one of them puts the long run straight through the other.

`chooseHandles` and `routeOrthogonal` are exported purely so this math can be exercised headlessly — it's the one part of the canvas that's pure enough to test without a browser, and it's worth doing (both invariants above were caught that way).

Clicking a connection selects it (a 12px transparent hitbox path makes a 2px line clickable); Delete/Backspace then removes just that connection. **Selecting a connection clears the node selection and vice versa** — otherwise one Delete keypress would delete both, since App handles node deletion and InfiniteCanvas handles connection deletion.

Connections whose endpoints no longer exist are pruned by a `useEffect` in InfiniteCanvas that reconciles against `nodes`. It's done reactively because nodes are deleted from three places (App's Delete key, the eraser, a node's X button) but `connections` lives in InfiniteCanvas, so App can't prune at the source.

`straight` and `curved` styles exist on the `Connection` type but nothing in the UI sets them.

### Styling

Tailwind v4 via `@tailwindcss/vite` — **no `tailwind.config.js`**; content scanning is declared with `@source` inside [tailwind.css](src/styles/tailwind.css). [index.css](src/styles/index.css) imports the layers in a load-bearing order: fonts → tailwind → [theme.css](src/styles/theme.css) (shadcn-style tokens for UI *chrome*: `--primary`, `--background`, …) → [canvas-tokens.css](src/styles/canvas-tokens.css) (tokens for the canvas *surface*: `--canvas-bg`, `--node-shadow-*`, `--connection-color`), which depends on `--primary` already being defined. `src/styles/fonts.css` is currently empty.

A design-system migration is mid-flight in the working tree: `canvas-tokens.css` is new and untracked, and `design-system-v1.patch` at the repo root replaces hardcoded `blue-500`/`slate-*` utilities with token-backed classes. Expect a mix of both conventions in canvas components; prefer tokens (`border-primary`, `var(--connection-color)`) in new code.

## Traps

**Most files in `src/app/components/` are dead code.** `PersonaCard.tsx`, `StickyNote.tsx`, `Checklist.tsx`, `UserFlow.tsx`, `JourneyMap.tsx`, `WhiteboardSection.tsx`, `Sidebar.tsx`, `DrawingCanvas.tsx`, `EditableField.tsx`, `EditableList.tsx`, and `DomainTip.tsx` are pre-canvas-rewrite leftovers that nothing imports. The live versions are same-named functions *inside* `CanvasNodeRenderer.tsx` (`PersonaCardNode`, `StickyNoteNode`, `ChecklistNode`, …). Editing `src/app/components/PersonaCard.tsx` changes nothing on screen — the file you want is the node function in `CanvasNodeRenderer.tsx`. Only `DomainSelector.tsx` is still wired in (the toolbar dropdown).

`src/app/data/domain-knowledge.ts` (431 lines of per-domain prompts) is likewise imported by nothing; `selectedDomain` is threaded from App into the toolbar but currently affects nothing on the canvas.

`src/app/components/ui/` is the untouched shadcn/ui drop-in — 40+ components, almost none used by the canvas. `ui/utils.ts` exports `cn()`. Don't assume a `ui/` component is in use, but do prefer it over hand-rolling a new primitive.

One dead control, in case a bug report points at it: `drawingCanvasRef` / `clearDrawing()` still thread from App through to InfiniteCanvas but target a `<canvas>` that no longer exists — pencil strokes became `pencil` nodes. (The duplicate button used to be a no-op too; it is now wired to `onDuplicateNode` in InfiniteCanvas.)

The `V` (select) keyboard shortcut is registered in *both* App and InfiniteCanvas.

## Conventions

- Import alias `@` → `src/` (defined in [vite.config.ts](vite.config.ts); note most existing code uses relative imports anyway).
- Vite's React and Tailwind plugins are both required by the Figma Make toolchain even where unused — do not remove them from `vite.config.ts`.
- Node modifier keys during resize: `Shift` locks aspect ratio, `Alt` resizes from center. `Shift` during shape creation forces a 1:1 square/circle.
- Export is `html2canvas` (dynamically imported) over `[data-canvas-container]` at 2× scale.
