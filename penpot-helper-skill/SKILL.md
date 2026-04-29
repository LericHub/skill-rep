---
name: penpot-helper
description: |
  Guide for designing Penpot (open-source design tool) files and generating correct,
  non-overlapping, responsive page structures. Covers layers, flex/grid layout, pages,
  components/variants, design tokens, prototyping, and the Plugin API / MCP server.
  Use when the user asks for help building screens, components, or design systems in
  Penpot, or when writing/driving Penpot plugins or the Penpot MCP server.
---

# Penpot Helper

Help users design **correct, well-structured, non-overlapping** pages in Penpot.
Penpot is open-source, CSS-native (its flex/grid map 1:1 to real CSS), and scriptable
via a Plugin API + MCP Server — so the same rules you use when hand-designing apply
when generating structures programmatically.

## When to use this skill

Trigger on any of:
- "help me design / lay out … in Penpot"
- "build a Penpot component / page / screen"
- "write a Penpot plugin" or "use the Penpot MCP"
- "convert this spec / wireframe to Penpot"
- "why does my Penpot layout break / overlap / not stretch"
- any mention of Penpot + layers, boards, flex, grid, variants, tokens, prototyping

## Core mental model (read before anything else)

Penpot's canvas is a **tree of shapes rooted at a Page**. The one container you will
use everywhere is the **Board** (Penpot's name for a Frame). A Board can:

1. Hold children (any Shape).
2. Clip or not clip.
3. Optionally have **one** layout attached: **Flex** *or* **Grid** (never both, never
   mixed with constraints on the same board).

Every child sits in **one** of two worlds, decided by its parent:

| Parent kind              | Child positioning      | Child sizing                  |
| ------------------------ | ---------------------- | ----------------------------- |
| Classic board (no layout)| Manual `x, y`          | **Constraints** (pin/scale)   |
| Flex or Grid board       | Flow (or `absolute`)   | **Sizing** (Fix / Fill / Auto)|

Mixing those two systems on one board is the single biggest source of breakage.
If a child should respond to parent resizing, decide first which world its parent is in.

## The decision tree for any layout request

```
Is the region a linear stack (row/column, forms, nav, button bar)?
    → Flex layout on a Board.

Is the region a predictable 2D matrix (cards, dashboards, tables of tiles)?
    → Grid layout on a Board.

Does the region need free/overlapping positioning (hero with overlaid badge,
marketing composition)?
    → Classic board + Absolute positioning, or a Flex/Grid board where the
      overlapping child is marked Absolute + zIndex.

Does the region need to pin to edges when parent resizes, but stay free inside?
    → Classic board + Constraints on the child.

Does an element need to stay on screen during prototype scrolling?
    → Enable "Fix when scrolling" on that element.
```

## Sizing rules (Fix / Fill / Auto)

Inside a Flex or Grid parent, every child picks a mode **per axis**
(`horizontalSizing` and `verticalSizing`):

- **Fix** — hard pixel size. Use only when the design requires an exact dimension
  (icons, avatars, fixed sidebars).
- **Fill** — expand to consume remaining space along that axis. Requires the parent
  to be a layout. Use for responsive children that should stretch.
- **Auto (Hug)** — shrink to content. Use for text, pills, auto-resizing cards.

**Text gotcha:** a Text layer's `growType` must match its parent's expectations:
- `fixed` → the text layer will NOT grow; flex/grid parents will appear "broken".
- `auto-width` → grows horizontally (use for a single-line label in a row).
- `auto-height` → fixed width, grows vertically (use for paragraph text in a Fill
  column).

If text needs to Fill width and wrap, set the text layer to `growType: auto-height`
AND `horizontalSizing: fill`.

## Preventing overlap — the non-negotiables

1. **Static siblings inside Flex/Grid cannot overlap by design.** If two elements
   overlap, either you left the board as classic (manual positioning) or a child
   was marked `absolute`. Check both.
2. **Intentional overlap** (badge on avatar, floating action button) → mark the
   overlapping child `absolute` + set `zIndex`. Never fake it with negative margins.
3. **No invisible rectangles as spacers.** Use `gap` and `padding` on the layout
   container. Spacer shapes break responsiveness and produce real overlap on resize.
4. **Don't mix constraints and layouts on the same board.** Result: children jump.
5. **Grid children: avoid multi-side margins** (known bug: reorders cells). Use
   container `gap` + `padding` instead.
6. **Cap nesting at 3–4 Boards deep.** Deeper trees compound sizing errors and
   tank performance.
7. **Name by function, not appearance** (`title`, `icon`, `primary-action`) — this
   is what makes Fill/Auto decisions survive future swaps.

## Screen-authoring rules

Use these when generating full screens or any handoff-quality mock:

1. **Build the container tree first.** A screen should have one main Board, then
   named section Boards such as `header`, `content`, `footer`, `card-grid`, or
   `sidebar`. Do not drop most layers directly under the page root.
2. **Treat child coordinates as parent-relative.** A child at `x: 100` inside a
   Board placed at page `x: 500` is still 100 px from the Board's left edge, not
   100 px from the page origin.
3. **Keep every child fully visible inside its intended container** unless the
   overflow is intentional and the container is configured for it. Before calling
   a screen done, verify:
   - `child.x >= 0`
   - `child.y >= 0`
   - `child.x + child.width <= parent.width`
   - `child.y + child.height <= parent.height`
4. **A screen is not done when it only has boxes.** Handoff-quality mocks need
   realistic content density: titles, body copy, icons, buttons, imagery/image
   placeholders, labels, metrics, list rows, and status states where relevant.
5. **Mock content should feel product-real.** Prefer plausible product names,
   prices, counts, timestamps, section labels, and CTA labels over placeholder
   sludge.
6. **Use consistent spacing and visual roles.** Pick a spacing rhythm (for
   example 8/12/16/24), a small set of corner radii, and clear text hierarchy.
   Reuse them across the whole screen.
7. **Keep the canvas clean.** Delete failed generations, duplicate frames, and
   abandoned experiments once a better version exists. A deliverable file should
   have an obvious current version.

## Standard recipe: a responsive screen

Use this as the default scaffold for any full screen unless the user specifies
otherwise:

```
Page
└── Board "screen/<name>"          flex column, gap 0, padding 0
                                    horizontalSizing: fix (viewport width)
                                    verticalSizing: auto
    ├── Board "header"             flex row, gap 16, padding 16 24
    │                              horizontalSizing: fill
    │                              Fix-when-scrolling: on
    │   ├── Logo             (fix)
    │   ├── Spacer?  NO — use justifyContent: space-between instead
    │   └── Nav Board        flex row, gap 24 (fill available space)
    ├── Board "main"               flex column, gap 32, padding 32
    │                              horizontalSizing: fill
    │                              verticalSizing: fill
    │   └── … content sections, each its own Board …
    └── Board "footer"             flex row, padding 24
                                   horizontalSizing: fill
```

For an application screen with a fixed sidebar, make the screen a **flex row**
with sidebar (Fix width) + main (Fill width).

## Standard recipe: a responsive card grid

1. Outer Board `cards`: **Grid layout**, columns `repeat(auto) 1fr`, `rowGap: 16`,
   `columnGap: 16`, `padding: 24`, `horizontalSizing: fill`, `verticalSizing: auto`.
2. Card component: Board with **Flex column**, `gap: 12`, `padding: 16`.
   Children: image (`horizontalSizing: fill`, `verticalSizing: fix`), title
   (`auto-height` text, `horizontalSizing: fill`), body (same), action row
   (nested Flex row, `gap: 8`, `justifyContent: end`).
3. Drop N Card instances into the grid with cell placement **Auto**. The grid
   reflows, cards stretch via Fill, text grows via Auto — no overlap is possible.

## Components, variants, tokens — quick rules

- **Extract a component** (`Ctrl+K`) as soon as you'd copy-paste the same Board
  twice. Put it in a shared library if multiple files will use it.
- **Variants** are one component parameterized by Properties × Values (e.g.,
  `Size: sm | md | lg`, `State: default | hover | pressed | disabled`). Keep
  variants to genuinely parameterized dimensions; don't cram unrelated designs in.
- **Override preservation across variant swap** works when inner layers share
  `name + type + hierarchy level`. Name consistently across variants.
- **Tokens** — use the 3-tier hierarchy: global primitives → semantic → component.
  Never hard-code a color, spacing, radius, or type value that should live in a
  token. Spacing tokens only apply inside Flex layouts.

## Prototyping — quick rules

- Triggers: `click`, `mouse enter`, `mouse leave`, `after delay` (board-only).
- Actions: `Navigate to`, `Open/Toggle/Close overlay`, `Previous screen`, `Open URL`.
- Animations: `Dissolve`, `Slide` (direction, easing, duration), `Push`.
- A **Flow** is a named journey with a starting Board — multiple flows per file,
  each with its own shareable View-mode link.
- Modal dialogs → Open overlay (not Navigate to), so "back" returns cleanly.

## Programmatic generation

There are two ways to drive Penpot from code:

1. **Plugin SDK** — a TS/JS plugin running in Penpot, using the `penpot` global
   (factory methods `createBoard / createRectangle / createText / …`, board
   methods `appendChild / addFlexLayout / addGridLayout / addRulerGuide`, shape
   methods `resize / rotate / bringToFront / addInteraction / applyToken`, and
   `File.export({ exportType: "penpot" | "zip" })`).
2. **Penpot MCP Server** (MPL-2.0) — connects Claude Code / Claude Desktop /
   Cursor to a running Penpot. Local endpoint `http://localhost:4401/mcp`. Tools
   include `execute_code`, `high_level_overview`, `penpot_api_info`,
   `export_shape`, `import_image`. Start read-only; only enable write tools once
   the plan is reviewed.

### Critical API Rules

**Before generating anything via MCP, read [`references/mcp-generation-guide.md`](references/mcp-generation-guide.md).** It covers the #1 source of bugs (absolute vs relative coordinates), ES5 compatibility requirements, and the step-by-step generation workflow.

1. **`shape.x` / `shape.y` are ALWAYS page-absolute coordinates**  
   They are NOT relative to the parent. To position a child inside a parent, you MUST calculate: `child.x = parent.x + desiredOffset`. Alternatively use `penpotUtils.setParentXY(child, offsetX, offsetY)` — but only AFTER the child has been appended to the parent.

2. **Use insertChild, NOT appendChild**  
   ```javascript
   // ✅ CORRECT - predictable ordering for non-flex boards
   parent.insertChild(parent.children.length, shape);

   // ❌ BROKEN - unpredictable placement
   parent.appendChild(shape);
   ```
   **Exception**: For flex layout boards, use `board.appendChild(shape)` which inserts at the visual end.

3. **Position Properties**  
   ```javascript
   shape.x = 100;           // ✅ Writable - absolute page coordinates
   shape.y = 200;           // ✅ Writable
   shape.parentX;           // ❌ READ-ONLY
   shape.parentY;           // ❌ READ-ONLY

   // To set relative position to parent:
   penpotUtils.setParentXY(shape, relativeX, relativeY);
   ```

4. **Resize and Dimensions**  
   ```javascript
   shape.width;             // ❌ READ-ONLY
   shape.height;            // ❌ READ-ONLY
   shape.resize(200, 100);  // ✅ Use method to change size
   ```

5. **Text Sizing**  
   ```javascript
   text.fontSize = '24';         // ✅ Changes text size
   text.resize(200, 100);        // ❌ Only changes bounding box, not font
   text.growType = 'auto-width'; // ✅ Always set after resize for auto-sizing
   ```

6. **Store Selection Immediately**  
   ```javascript
   storage.selection = [...penpot.selection]; // Selection can change!
   ```

### Common Code Examples

**Create Shapes:**
```javascript
// Rectangle
const rect = penpot.createRectangle();
rect.name = 'Card Background';
rect.x = 100; rect.y = 100;
rect.resize(300, 200);
rect.fills = [{ fillColor: '#FFFFFF' }];
rect.borderRadius = 12;

// Text
const text = penpot.createText('Hello World');
text.x = 120; text.y = 120;
text.fontSize = '24';
text.fontFamily = 'Inter';
text.growType = 'auto-width';

// Board (frame/artboard)
const board = penpot.createBoard();
board.name = 'Card';
board.x = 0; board.y = 0;
board.resize(400, 300);
board.fills = [{ fillColor: '#FFFFFF' }];

// Ellipse
const ellipse = penpot.createEllipse();
ellipse.resize(100, 100);
```

**Build Hierarchy:**
**CRITICAL**: Add background shapes FIRST, then foreground shapes. Z-order = array order.
```javascript
const card = penpot.createBoard();
card.resize(300, 200);

// 1. Background first (will be behind)
const bg = penpot.createRectangle();
bg.resize(300, 200);
bg.fills = [{ fillColor: '#F5F5F5' }];
card.insertChild(card.children.length, bg);

// 2. Content on top (will be in front)
const title = penpot.createText('Title');
title.fontSize = '20';
card.insertChild(card.children.length, title);

// Position relative to parent
penpotUtils.setParentXY(bg, 0, 0);
penpotUtils.setParentXY(title, 20, 20);
```

**Flex Layout:**
```javascript
const container = penpot.createBoard();
container.resize(400, 0);

// Add flex layout
const flex = penpotUtils.addFlexLayout(container, 'column');
flex.rowGap = 16;
flex.columnGap = 16;
flex.topPadding = 24;
flex.rightPadding = 24;
flex.bottomPadding = 24;
flex.leftPadding = 24;
flex.alignItems = 'stretch';
flex.justifyContent = 'start';

// For flex boards, appendChild adds at visual end
container.appendChild(item1);
container.appendChild(item2);

// Child sizing within flex
item1.layoutChild.horizontalSizing = 'fill';
item1.layoutChild.verticalSizing = 'auto';
```

**Styling:**
```javascript
// Solid color fill
shape.fills = [{ fillColor: '#3B82F6', fillOpacity: 1 }];

// Gradient fill
shape.fills = [{
  fillColorGradient: {
    type: 'linear',
    startX: 0, startY: 0,
    endX: 1, endY: 1,
    width: 1,
    stops: [
      { color: '#3B82F6', offset: 0 },
      { color: '#8B5CF6', offset: 1 }
    ]
  }
}];

// Stroke
shape.strokes = [{
  strokeColor: '#E5E7EB',
  strokeWidth: 1,
  strokeAlignment: 'center', // 'inner' | 'outer'
  strokeStyle: 'solid'       // 'dotted' | 'dashed'
}];

// Drop shadow
shape.shadows = [{
  style: 'drop-shadow',  // or 'inner-shadow'
  color: { color: '#000000', opacity: 0.1 },
  offsetX: 0, offsetY: 4,
  blur: 12, spread: 0
}];

// Border radius
shape.borderRadius = 8;  // All corners
// Or individual corners:
shape.borderRadiusTopLeft = 8;
shape.borderRadiusTopRight = 8;
shape.borderRadiusBottomRight = 0;
shape.borderRadiusBottomLeft = 0;
```

**Text Styling:**
```javascript
const text = penpot.createText('Hello');
text.fontSize = '16';
text.fontFamily = 'Inter';
text.fontWeight = '600';
text.fontStyle = 'normal';     // or 'italic'
text.lineHeight = '1.5';
text.letterSpacing = '0';
text.align = 'center';         // 'left' | 'right' | 'justify'
text.verticalAlign = 'center'; // 'top' | 'bottom'
text.textTransform = 'uppercase'; // 'lowercase' | 'capitalize'
text.textDecoration = 'underline'; // 'line-through'
text.direction = 'ltr';        // 'rtl'
text.growType = 'auto-width';  // 'auto-height' | 'fixed'

// Text color
text.fills = [{ fillColor: '#1F2937' }];
```

**Z-Order Methods:**
```javascript
shape.bringToFront();    // Move to top
shape.sendToBack();      // Move to bottom
shape.bringForward();    // Move up one level
shape.sendBackward();    // Move down one level
shape.setParentIndex(0); // Set exact position (0-based)
```

**Components & Libraries:**
```javascript
// Access libraries
const local = penpot.library.local;
const connected = penpot.library.connected;

// Find component
const btn = local.components.find(c => c.name.includes('Button'));

// Create instance
const instance = btn.instance();
instance.x = 100; instance.y = 100;

// Access colors
const primary = local.colors.find(c => c.name === 'Primary');

// Create new color
const newColor = local.createColor();
newColor.name = 'Brand Blue';
newColor.color = '#3B82F6';
```

When generating structures programmatically, build **top-down**: create the outer
Board, attach its layout (`board.addFlexLayout()` / `addGridLayout()`), then
create children and `appendChild` in visual order. Set each child's
`layoutChild.horizontalSizing / verticalSizing` BEFORE adding siblings — otherwise
defaults (usually Fix) will cause surprise overflow.

When generating with the Plugin API or MCP, validate geometry after each major
step instead of at the very end:

- Inspect the current shape tree and confirm the intended parent-child structure.
- Read each shape's `x`, `y`, `width`, and `height` in the coordinate space that
  actually applies: page for top-level Boards, parent-relative for descendants.
- Use those bounds to prevent off-canvas placement, sibling collisions, and empty
  white frames whose content was accidentally positioned outside the container.
- Prefer fixing structure first, then styling, then content polish. Styling the
  wrong tree only hides geometry mistakes.

## Pre-flight checklist (run before declaring a layout "done")

See **`checklist.md`** — a list of mechanical checks. Every generated layout
should pass all of them. The short version:

- Every board declares a layout OR uses explicit constraints. No "default" parents.
- No two siblings share the same rectangle of space unless one is `absolute + zIndex`.
- All text with `growType: fixed` is intentional.
- No invisible rectangles used as spacers.
- Tokens applied for color, spacing, radius, typography.
- Names are functional (`title`, not `text 27`).
- Nesting depth ≤ 4 boards.
- Fix-when-scrolling set on headers/FABs that must stay visible during prototyping.
- Overlays used for modals, Navigate-to for full-screen transitions.

## Reference files (load on demand)

Don't read these unless the task needs them. They're organized so each file
covers one topic:

- [`references/layout-system.md`](references/layout-system.md) — every Flex/Grid
  property, constraint system, sizing rules, edge cases.
- [`references/layers-and-shapes.md`](references/layers-and-shapes.md) — the full
  Shape union, booleans, masks, z-order, hide/lock.
- [`references/components-variants.md`](references/components-variants.md) —
  main/instance/override mechanics, variant override preservation rules.
- [`references/design-tokens.md`](references/design-tokens.md) — the 12 token
  types, aliasing, math, themes, import/export, 3-tier hierarchy.
- [`references/prototyping.md`](references/prototyping.md) — triggers, actions,
  animations, flows, fix-when-scrolling.
- [`references/plugin-api.md`](references/plugin-api.md) — plugin SDK surface,
  manifest, permissions, factory and mutator methods, worked examples.
- [`references/file-format.md`](references/file-format.md) — `.penpot` ZIP
  structure and the internal data model (File → Pages → ShapeTree → Shape).
- [`references/mcp-server.md`](references/mcp-server.md) — how the Penpot MCP
  server works, tools, safety, setup.
- [`references/pitfalls.md`](references/pitfalls.md) — the full list of common
  layout and design-system mistakes (with the bug-tracker links).
- [`references/mcp-generation-guide.md`](references/mcp-generation-guide.md) — **practical guide for generating designs programmatically via MCP**: absolute coordinate system, step-by-step workflow, naming conventions, ES5 compatibility, and common code pitfalls.
- [`checklist.md`](checklist.md) — the pre-flight validation checklist.

## Templates (worked examples)

Use as scaffolds for generation:

- [`templates/responsive-card-grid.md`](templates/responsive-card-grid.md)
- [`templates/app-screen-with-sidebar.md`](templates/app-screen-with-sidebar.md)
- [`templates/form-layout.md`](templates/form-layout.md)
- [`templates/modal-overlay.md`](templates/modal-overlay.md)
- [`templates/design-system-starter.md`](templates/design-system-starter.md)

## Design-to-Code

Penpot's CSS-native model makes it easy to generate real code directly from your designs.

### Workflow
1. Select target element(s) in Penpot
2. Use `export_shape` to visually verify the selection
3. Generate CSS with `generateStyle`
4. Generate markup with `generateMarkup`
5. Combine into working code

### Code Example
```javascript
// Generate CSS for selected elements
return penpot.generateStyle(penpot.selection, {
  type: 'css',
  withPrelude: true,
  includeChildren: true
});

// Generate HTML
return penpot.generateMarkup(penpot.selection, { type: 'html' });

// Or generate SVG
return penpot.generateMarkup(penpot.selection, { type: 'svg' });
```

**CRITICAL**: Never assume values. Strictly adhere to the design. Use black/white defaults only when information is genuinely missing.

## Shape Types

| Type | Description |
|------|-------------|
| `Board` | Container/frame, supports layouts |
| `Rectangle` | Basic rectangle shape |
| `Ellipse` | Circle/ellipse shape |
| `Text` | Text element |
| `Path` | Vector path |
| `Group` | Non-layout container |
| `Boolean` | Boolean operations result |
| `Image` | Image element (legacy) |
| `SvgRaw` | Raw SVG content |
