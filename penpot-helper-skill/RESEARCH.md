# Penpot Research Report

A comprehensive survey of Penpot (the open-source design tool at [penpot.app](https://penpot.app)) intended as source material for building a Claude skill that generates correct, well-structured page layouts with no unintentional overlaps or harmful elements.

---

## 1. Layer System

Penpot's canvas is a tree of shapes. The plugin API defines the union type:

```ts
Shape = Board | Group | Boolean | Rectangle | Path | Text | Ellipse | SvgRaw | Image
```

### Layer Types

- **Board (a.k.a. Frame)** — the primary container. Boards can contain other boards (nesting). They carry `clipContent`, `showInViewMode`, optional `flex`/`grid` layout objects, rulers, fills, and a `children: Shape[]`. First-level boards show by default in View mode; nested boards are hidden unless configured. Boards are the right container for screens, sections, cards, and any responsive region.
- **Group** — non-clipping logical grouping (`Ctrl+G`). Groups carry transforms/styles together but do not clip or participate in layouts the way boards do.
- **Rectangle** (`R`) and **Ellipse** (`E`) — primitive shapes.
- **Path** (`P`) — vector path via clicks (corner nodes) or drags (curves). **Freehand curve** with `Shift+C`.
- **Text** — text layer with a `growType` of `fixed | auto-width | auto-height`, plus font, weight, style, line height, letter spacing, text transform, decoration, direction, align, vertical align, and fills.
- **Image** — bitmap imported via toolbar/drag/paste; fills the layer and maintains aspect ratio.
- **SvgRaw** — imported SVG nodes.
- **Component / Component Instance** — reusable design (see §4).
- **Boolean** — non-destructive combination of two or more shapes: Union, Difference, Intersection, Exclusion, plus **Flatten** (destructive — permanently merges to one path).
- **Mask** — a group whose lowest-in-list layer clips the rest (`Ctrl+M`).

### Z-order, locking, hiding, masking

- **Z-order** follows the Layers panel top-to-bottom (top of list renders on top). Re-order with `bringToFront/Forward()` and `sendToBack/Backward()` (plugin API), or drag in the panel.
- **Hide** (eye icon): invisible on canvas but still selectable/editable in the Layers panel.
- **Lock** (lock icon): prevents movement/canvas edits while allowing property edits; still selectable.
- **Mask**: select layers → `Ctrl+M`. The bottom layer becomes the clipping shape.
- **Nested boards**: boards inside boards are fully supported and are the normal way to build component internals and responsive regions.

---

## 2. Layout Features

Penpot's flex and grid are implemented directly on CSS Flexbox/Grid, so they round-trip cleanly to production CSS (visible in Inspect mode). Both are applied to boards/groups/selections. Flex shortcut `Ctrl/⌘+A`, grid `Ctrl/⌘+Shift+A`.

### Flex Layout (on boards)

Container properties:

- **Direction**: `row | row-reverse | column | column-reverse`
- **Wrap**: `wrap | nowrap`
- **Justify content**: `start | center | end | stretch | space-between | space-around | space-evenly`
- **Align items**: `start | center | end | stretch`
- **Align content** (wrap only): same options plus `space-between/around/evenly`
- **Gap**: `rowGap`, `columnGap`
- **Padding**: top/right/bottom/left (or vertical/horizontal). Drag inputs with `Shift` = opposite sides, `Alt` = all sides.

Child sizing inside a flex/grid layout uses `horizontalSizing` / `verticalSizing`:

- **Fix** — intrinsic fixed width/height.
- **Fill** — takes remaining space (only inside another layout).
- **Auto (Hug)** — hugs its own content.

Child layout properties also include `alignSelf`, per-side margins, `minWidth/maxWidth`, `minHeight/maxHeight`, `absolute`, and `zIndex`.

### Grid Layout

Tracks and cells:

- **Tracks**: rows and columns defined in units of **FR** (fraction of remaining space), **Auto** (content-driven), or **Pixels** (fixed).
- **Cells**: placement mode is `auto | manual | area`. Manual uses `row`, `column`, `rowSpan`, `columnSpan` (maps to CSS `grid-column` / `grid-row`). Area assigns the cell to a named area.
- **Areas**: `Ctrl`-select cells → right-click → **Merge cells**; name via sidebar; revert with Auto.
- Container exposes direction, align/justify items, gap, padding — same vocabulary as CSS Grid.
- Drag inputs with `Ctrl` held to keep child elements in place while resizing tracks.

### Absolute positioning vs auto-layout

Inside a flex/grid container each child is either:

- **Static (default)** — participates in the flex/grid flow.
- **Absolute** — removed from flow, positioned freely; use `zIndex` for stacking. This is the correct way to overlap a badge on a card, etc. Since v1.19.4 `zIndex` is editable for static children as well.

Outside a flex/grid board, children use classic manual positioning (x/y).

### Constraints (on children of non-layout boards)

Constraints tell a child how to respond when its parent board resizes. Default is **Scale**.

- Horizontal: `Left | Right | Left & Right | Center | Scale`
- Vertical:   `Top  | Bottom | Top & Bottom | Center | Scale`
- **Fix when scrolling** — pins the element during prototype scrolling (headers, navbars, FABs).

Key distinction: **Constraints (pin/scale)** apply to children of classic boards; **Sizing (fix/fill/auto)** applies to children of flex/grid boards. These systems do not mix on the same parent.

---

## 3. Page Features

- **Multiple pages per file** — each file holds many pages; each page has its own shape tree.
- **Shared libraries** — any file can be **published** as a shared library. Connected libraries expose their **components**, **colors**, **typographies** (and design tokens) to consumer files via the assets panel (`Alt/⌥+I`). Unpublishing disconnects consumers; used assets remain but lose the link.
- **Assets** in a library: components, colors, typographies. Assets organize via `FOLDER/ASSET` slash syntax or the Group action, browsable in grid or list view.
- **Design tokens** (see §6) propagate through shared libraries the same way.

Prototyping flows and page navigation are covered in §5.

---

## 4. Components & Variants

- **Main component**: the source of truth (`Ctrl+K` or right-click → Create component).
- **Copy / instance**: inherits from the main; can carry **overrides** (text, color, icon, etc.). Right-click → **Reset overrides** to revert. **Update main component** pushes a copy's changes back. `Ctrl+Shift+K` detaches. Swap via clicking the component name in the sidebar.
- **Nested components**: components can contain other components.
- **Variants**: group similar components (e.g., button sizes × states) into a single component parameterized by **Properties** (dimensions like Size, State) and **Values**. `Ctrl+K` → Create variant, or select several → right-click → **Combine as variants**. Boolean toggles appear automatically when a property's values are opposing pairs (`true/false`, `on/off`).
- **Override preservation across variants**: overrides survive a variant switch when the inner layers are *connected* — same name, same type, same hierarchy level. Rectangles, ellipses, and paths are treated as the same type.
- **Naming tip**: meaningful names with `/` separators (`checkbox / active / enabled`) auto-group in the assets panel.

---

## 5. Prototyping

Penpot prototypes connect boards (screens) via interactions and flows, playable in View mode with shareable links.

**Triggers**: `On click`, `Mouse enter`, `Mouse leave`, `After delay` (board-only).

**Actions**:

- **Navigate to** — switch to another board.
- **Open overlay** — display a board on top of the current one (modals, tooltips, notifications).
- **Toggle overlay** — opens if closed, closes if open.
- **Close overlay** — closes the specified overlay or the containing one.
- **Previous screen** — back-button behavior.
- **Open URL** — opens external URL in a new tab.

**Animations**: `Dissolve` (cross-fade), `Slide` (direction, IN/OUT, offset, easing, duration), `Push` (destination pushes origin out).

**Flows** group starting points; one file can have multiple flows (e.g., different device journeys), each with its own shareable View-mode link.

**Fixed elements**: enable `Fix when scrolling` to hold headers/navbars/FABs in place during prototype scrolling.

---

## 6. Design Tokens

Penpot is the first major tool to natively implement the **W3C DTCG Design Tokens Format Module** (JSON-based, MIME `application/design-tokens+json`, extensions `.tokens` / `.tokens.json`).

**Supported token types** (12): Color (hex/RGB(A)/ARGB/HSL(A)), Dimension, Sizing, Spacing (flex layouts only), Typography, Typography Composite, Border Radius, Opacity, Rotation, Number, Stroke Width, Shadow.

**Core features**:

- **Aliases / references** — `{token.name}` syntax; cascading updates.
- **Math** — `+ - * / % ^`, plus `abs/ceil/floor/round/max/min/sqrt/pow`, trig, log. Example: `{spacing.small} * 2`.
- **Groups** — dots create nested folders (`color.brand.primary`).
- **Token sets** — ordered sets; later sets override earlier ones (CSS-like cascade).
- **Themes** — multidimensional (Mode × Brand × Contrast); multiple themes can be active simultaneously.
- **Import/export** — single JSON, ZIP, or multifile folder with optional `$themes.json` / `$metadata.json`.

**Recommended 3-tier hierarchy**:

1. **Global** (primitives): `color.base.neutral.100`, `spacing.base.8`
2. **Semantic**: `color.bg.default`, `color.text.primary`
3. **Component**: `color.button.primary.bg`

Never hard-code values when a token exists.

---

## 7. Export Formats

**`.penpot` (current, v2.4+)** is a **ZIP archive** containing:

- A **JSON structure** describing the file, pages, shape tree, library assets, and references.
- **Binary assets** (bitmaps, vector images) stored as separate entries.

This replaces the older dual-format split (binary `.penpot` vs standard `.zip` with SVG+JSON per page, deprecated at v2.3). The format is intentionally open — "no proprietary lock-in".

**Other exports**: SVG, PNG, PDF (per shape/board via the Export panel). Import size limit: 1 GB. Imports from Figma are supported.

---

## 8. File Structure (Internal Data Model)

Drawn from Penpot's own Data Model docs:

- **File** — top object, contains `data` (pages + library assets).
- **Pages** — each holds a **ShapeTree**.
- **ShapeTree** — hierarchical tree of Shape nodes.
- **Shape** — one SVG node, augmented with Penpot metadata: `Selrect`, `Transform`, `Constraints`, `Interactions`, `Fill`, `Stroke`, `Shadow`, `Blur`, `Font`, `Content`, `Exports`.
- **StorageObject** — binary assets (images, SVG icons).
- **Library assets** — Components, MediaItems, Colors, Typographies, design tokens.

During export, non-SVG-native attributes (proportion locks, constraints, stroke alignment) are serialized as SVG metadata. On import, `parse-data` in `worker/import/parser.cljs` reconstructs Penpot shape objects from the SVG + metadata. `null` attribute values are stripped (absence = default). File versions are migrated in `common/src/app/common/files/migrations.cljc`.

---

## 9. Programmatic Access: API / Plugins / MCP

### Plugin SDK

- Package: `@penpot/plugin-types` (TypeScript type defs). Companion: `@penpot/plugin-styles` (UI tokens matching Penpot).
- Plugins run **inside an isolated iframe**, communicate with Penpot via message passing, and are hosted externally (any URL serving `manifest.json`).
- Install into Penpot with `Ctrl+Alt+P` (⌘+Alt+P on macOS), entering the manifest URL (e.g., `http://localhost:4400/manifest.json`).
- **Manifest** declares `permissions`: `content:read|write`, `library:read|write`, `user:read`, `comment:read|write`, `allow:downloads`, `allow:localstorage`. Write implies read.
- Official starter: `penpot/penpot-plugin-starter-template` (Vite + TypeScript).
- The `penpot` context object is available only in `plugin.ts` (not in UI scripts).

**Key plugin API surface**:

- Factory methods on `penpot`: `createBoard()`, `createRectangle()`, `createEllipse()`, `createText()`, `createPath()`, etc.
- **Board** methods: `appendChild()`, `insertChild(i, child)`, `addFlexLayout(): FlexLayout`, `addGridLayout(): GridLayout`, `addRulerGuide()`, `isVariantContainer()`.
- **ShapeBase** (common): `id`, `name`, `parent`, `parentIndex`, `x`, `y`, `width`, `height`, `bounds`, `center`, `blocked`, `hidden`, `visible`, `proportionLock`, `constraints…`, `borderRadius…`, `opacity`, `blendMode`, `shadows`, `blur`, `exports`, `boardX/Y`, `parentX/Y`, `flipX/Y`, `rotation`, `fills`, `strokes`, `layoutChild`, `layoutCell`, `tokens`, `interactions`.
- **ShapeBase** methods: `resize()`, `rotate()`, `bringToFront/Forward()`, `sendToBack/Backward()`, `clone()`, `remove()`, `export()`, `addInteraction()`, `applyToken()`.
- **Text**: `characters`, `growType`, font props, `align`, `verticalAlign`, `getRange(start, end)`, `applyTypography(libraryTypography)`.
- **File.export()**: `exportType: "penpot" | "zip"`, `libraryExportType: "all" | "merge" | "detach"`.
- Type guards: `penpot.utils.types.isBoard|isGroup|isRectangle|isPath|isText|isEllipse|isSVG|isBool|isMask|isVariantContainer|isVariantComponent`.

### Backend RPC

`binfile:export-binfile` and `binfile:import-binfile` (supports `binfile-v3`, enabling in-place import when a `.penpot` contains a single file).

### Penpot MCP Server (for AI agents)

The official **Penpot MCP Server** (MPL-2.0) connects MCP-compatible clients (Claude Desktop, Claude Code, Cursor, VS Code/Copilot, OpenAI Codex) to a running Penpot. Architecture:

1. **MCP Server** — exposes tools to AI clients.
2. **MCP Plugin** — runs inside Penpot, connects to the server via WebSocket.
3. **MCP Client** — the AI tool.

Tools (local mode) include `execute_code`, `high_level_overview`, `penpot_api_info`, `export_shape`, `import_image`. Remote hosted mode is configured under *Your account → Integrations → MCP Server (Beta)* using an MCP key. Local server runs at `http://localhost:4401/mcp`. Safety: start with read-only prompts before granting write capability.

---

## 10. Best Practices for Page Structure

From Penpot's own **Design File Structure and Best Practices** MCP guide plus its tutorials:

**File and board organization**

- One board **per functional area/feature**, not per screen (e.g., *Onboarding*, *Dashboard*, *Settings*).
- Arrange boards on the canvas as a logical map — flow left-to-right or wireframes-left / finals-right.
- Every board has a clear visual entry point and purpose.
- Cap nesting around 3–4 levels — deeper trees harm comprehension and performance.

**Naming conventions**

- Name layers by **function, not appearance**: `background`, `icon`, `title` (never `rectangle 23`, never `blue button`).
- Use `/` for hierarchical grouping: `form/input/text`, `button/primary/hover`, `checkbox / active / enabled`.
- Don't duplicate context — layers inside a `button` component shouldn't start with `button-`.
- Keep names concise but descriptive. Prefer spaces over hyphens in asset names (`check icon` > `check-icon`) for searchability.

**Layout choices**

- **Flex** for linear stacks (forms, nav, button rows, lists).
- **Grid** for predictable 2D structures (card galleries, dashboards, tables of tiles).
- Base spacing on a single unit (8px typical) with derived multiples.
- Adjust spacing via the layout panel (gap/padding), **never with invisible rectangles**.
- Prefer **Fill** for children that should stretch, **Auto/Hug** for content-driven sizing, **Fix** only when a hard dimension is required.

**Responsive design**

- For layout-parents: Flex + Grid + sizing (Fix/Fill/Auto) do the work.
- For classic boards: use Constraints (pin combinations) so children track parent edges.
- **Fix when scrolling** for sticky UI.

**Accessibility**

- Contrast: aim for WCAG AA (4.5:1 body, 3:1 large/UI).
- Never communicate status by color alone — pair with a label or icon.
- Minimum body text ≈ 14–16 px; respect typography scale (e.g., 12/14/16/20/24).
- Use design tokens for typography so accessible sizes are enforced at the system level.

**Handoff**

- Consistent paths like `/screens/login`, `/components/button`.
- One source of truth per component (no visual duplicates).
- Lean on Inspect mode — Penpot emits production-ready CSS Flex/Grid.

### Mini example: responsive card grid

1. Create an outer **Board** `cards` (the container). Add a **Grid layout** to it.
2. Define columns: e.g., `repeat(auto) 1fr` with `rowGap: 16`, `columnGap: 16`, `padding: 24` on all sides.
3. Set the board's **horizontalSizing = Fill** so it stretches with its parent, **verticalSizing = Auto** so it hugs content.
4. Create a **Card** component: a Board with a **Flex column** layout (`direction: column`, `gap: 12`, `padding: 16`), children = image (fill width, fixed height), title (Text, `growType: auto-height`, `horizontalSizing: fill`), body (same), button row (nested Flex row with `gap: 8`, `justifyContent: end`).
5. Apply tokens: `color.bg.surface`, `color.text.primary`, `spacing.md`, `borderRadius.md`.
6. Place several instances of the Card into the grid. Assign each to **Auto** cell placement — the grid will lay them out and reflow at different widths. Because children use **Fill**, cards stretch to column width without overlapping; because the card's internal Flex uses **Auto** for text height, content can't spill.

---

## 11. Common Pitfalls

Distilled from the best-practices doc, GitHub issues, and tutorials:

- **Treating Penpot like Figma**: manual spacing with invisible rectangles, fixed boards everywhere. Fix: embrace Flex/Grid + tokens from day one.
- **"My flex layout doesn't flex"** ([#3912](https://github.com/penpot/penpot/issues/3912)): text boxes don't grow because the text has `growType: fixed`. Fix: switch to `auto-width` or `auto-height`.
- **Wrong sizing mode**: remembering that **Fix / Fill / Auto** are the primary knobs; most "why isn't this stretching?" bugs are a Fill-vs-Auto mistake.
- **Mixing constraints and layouts** on the same parent — they don't coexist. Pick one per board.
- **Hard-coded values** (hex, px) instead of tokens — breaks theming and consistency.
- **Overlapping siblings in a flex container without using Absolute+zIndex** — static children can't overlap by design.
- **One board per screen** instead of per feature — unmanageable file sprawl.
- **Naming by appearance** (`blue button`, `rectangle 23`) — breaks refactors and component swaps.
- **Over-nesting frames/boards** beyond 3–4 levels — hurts readability and perf.
- **Grid layout + child margins** ([#7206](https://github.com/penpot/penpot/issues/7206)): applying multi-side margins to a grid child can reorder elements. Prefer `gap` and `padding` on the container.
- **Multiple sources of truth** for the same component (duplicates instead of a shared library).
- **Variants over-packed**: cramming unrelated components under one variant because they look similar. Keep variants to genuinely parameterized dimensions (size/state/color), not entirely different components.
- **Accessibility oversights**: low-contrast ink, status encoded only in color, too-small text.

---

## Sources

- [Penpot Help — User Guide (index)](https://help.penpot.app/user-guide/)
- [Penpot Help — Flexible Layouts (Flex + Grid)](https://help.penpot.app/user-guide/designing/flexible-layouts/)
- [Penpot Help — Layers](https://help.penpot.app/user-guide/designing/layers/)
- [Penpot Help — Libraries](https://help.penpot.app/user-guide/design-systems/libraries/)
- [Penpot Help — Design Tokens](https://help.penpot.app/user-guide/design-tokens/)
- [Penpot Help — Prototyping](https://help.penpot.app/user-guide/prototyping/)
- [Penpot Help — Import/Export](https://help.penpot.app/user-guide/import-export/)
- [Penpot Help — Components / Variants](https://help.penpot.app/user-guide/design-systems/variants/)
- [Penpot Help — Design File Structure & Best Practices (MCP)](https://help.penpot.app/mcp/design-file-structure-best-practices/)
- [Penpot Help — Plugins Getting Started](https://help.penpot.app/plugins/getting-started/)
- [Penpot Plugin API Reference (TypeDoc)](https://doc.plugins.penpot.app/)
- [Penpot Plugin API — FlexLayout](https://doc.plugins.penpot.app/interfaces/FlexLayout)
- [Penpot Plugin API — LayoutCellProperties](https://doc.plugins.penpot.app/interfaces/LayoutCellProperties.html)
- [Penpot Plugin API — LayoutChildProperties](https://doc.plugins.penpot.app/interfaces/LayoutChildProperties.html)
- [Penpot Plugin API — Board](https://doc.plugins.penpot.app/interfaces/Board.html)
- [Penpot Plugin API — Text](https://doc.plugins.penpot.app/interfaces/Text.html)
- [Penpot Plugin API — Shape union](https://doc.plugins.penpot.app/types/Shape)
- [Penpot Plugin API — ContextTypesUtils](https://doc.plugins.penpot.app/interfaces/ContextTypesUtils.html)
- [Penpot Plugin Starter Template (GitHub)](https://github.com/penpot/penpot-plugin-starter-template)
- [Penpot MCP Server Docs](https://help.penpot.app/mcp/)
- [Penpot MCP Server site](https://penpot.dev/penpot-mcp-server)
- [Penpot Repo (GitHub)](https://github.com/penpot/penpot)
- [Technical Guide — Data Model](https://help.penpot.app/technical-guide/developer/data-model/)
- [Technical Guide — Data Guide](https://help.penpot.app/technical-guide/developer/data-guide/)
- [W3C DTCG — Design Tokens Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
- [Penpot Blog — Design Tokens JSON Format](https://penpot.app/blog/a-practical-guide-to-the-design-tokens-json-format/)
- [Penpot Blog — Design Tokens with Penpot](https://penpot.app/blog/design-tokens-with-penpot/)
- [Penpot Blog — Create & Share Components](https://penpot.app/blog/tutorial-create-and-share-components-in-penpot/)
- [Penpot Blog — Component Variants](https://penpot.app/blog/how-to-use-component-variants-to-scale-your-design-system/)
- [Penpot Blog — CSS Flex & Grid Layout Components](https://penpot.app/blog/how-to-create-css-flex-and-grid-layout-components-in-penpot/)
- [GitHub Issue #3640 — z-index editable for static children](https://github.com/penpot/penpot/issues/3640)
- [GitHub Issue #3210 — overlapping board drop target](https://github.com/penpot/penpot/issues/3210)
- [GitHub Issue #3912 — flex layouts don't flex (text growType)](https://github.com/penpot/penpot/issues/3912)
- [GitHub Issue #7206 — grid + child margin ordering](https://github.com/penpot/penpot/issues/7206)
