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

When generating structures programmatically, build **top-down**: create the outer
Board, attach its layout (`board.addFlexLayout()` / `addGridLayout()`), then
create children and `appendChild` in visual order. Set each child's
`layoutChild.horizontalSizing / verticalSizing` BEFORE adding siblings — otherwise
defaults (usually Fix) will cause surprise overflow.

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
- [`checklist.md`](checklist.md) — the pre-flight validation checklist.

## Templates (worked examples)

Use as scaffolds for generation:

- [`templates/responsive-card-grid.md`](templates/responsive-card-grid.md)
- [`templates/app-screen-with-sidebar.md`](templates/app-screen-with-sidebar.md)
- [`templates/form-layout.md`](templates/form-layout.md)
- [`templates/modal-overlay.md`](templates/modal-overlay.md)
- [`templates/design-system-starter.md`](templates/design-system-starter.md)
