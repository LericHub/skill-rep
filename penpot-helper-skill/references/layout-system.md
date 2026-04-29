# Layout System Reference

Penpot has two layout engines on Boards (**Flex** and **Grid**) plus the legacy
**Constraints** system for non-layout boards. Flex/Grid compile to real CSS, so
anything you know from CSS transfers.

## Choosing a layout

| Pattern                                     | Use        |
| ------------------------------------------- | ---------- |
| Row / column of items, maybe wrapping       | **Flex**   |
| Predictable 2D matrix with tracks / areas   | **Grid**   |
| Free composition, overlapping, fixed canvas | no layout (classic board) |

You can only attach one of Flex or Grid to a Board. Toggling one off clears it.

## Flex layout

Keyboard: `Ctrl/⌘+A` to toggle flex on the selection.

### Container properties

| Property         | Values                                                                           |
| ---------------- | -------------------------------------------------------------------------------- |
| `direction`      | `row` / `row-reverse` / `column` / `column-reverse`                              |
| `wrap`           | `wrap` / `nowrap`                                                                |
| `justifyContent` | `start` / `center` / `end` / `stretch` / `space-between` / `space-around` / `space-evenly` |
| `alignItems`     | `start` / `center` / `end` / `stretch`                                           |
| `alignContent`   | (wrap only) same options + `space-*`                                             |
| `rowGap`, `columnGap` | number (px, or via Spacing token)                                           |
| `padding`        | top / right / bottom / left (drag with `Shift` = opposite, `Alt` = all four)      |

### Child layout properties

| Property            | Values                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `horizontalSizing`  | `fix` / `fill` / `auto`                                                 |
| `verticalSizing`    | `fix` / `fill` / `auto`                                                 |
| `alignSelf`         | `start` / `center` / `end` / `stretch` / `auto`                         |
| `margin*`           | per-side margin                                                         |
| `minWidth/maxWidth` | clamps for Fill                                                         |
| `minHeight/maxHeight` | clamps for Fill                                                       |
| `absolute`          | boolean — removes from flow, positioned freely                          |
| `zIndex`            | stacking (editable for static children since v1.19.4)                    |

## Grid layout

Keyboard: `Ctrl/⌘+Shift+A`.

### Tracks

Rows and columns are defined in units of:

- **FR** — fraction of remaining space (like CSS `1fr`).
- **Auto** — content-driven.
- **Pixels** — fixed.

Hold `Ctrl` while dragging a track boundary to keep children in place as the
track resizes.

### Cell placement modes

| Mode     | How it works                                                                   |
| -------- | ------------------------------------------------------------------------------ |
| `auto`   | Grid auto-places next free cell. Default. Good for galleries.                  |
| `manual` | Pin the child to `row`, `column`, `rowSpan`, `columnSpan` (like `grid-column`).|
| `area`   | Assign the child to a named area. Merge cells first, name, then assign.        |

Merge cells: `Ctrl`-select cells → right-click → **Merge cells** → name in sidebar.

### Container properties

`justifyItems`, `alignItems`, `justifyContent`, `alignContent`, `rowGap`,
`columnGap`, `padding` — same vocabulary as CSS Grid.

## Constraints (children of classic, non-layout boards)

Default is **Scale** on both axes. Per axis you can pick:

- Horizontal: `Left` / `Right` / `Left & Right` / `Center` / `Scale`
- Vertical:   `Top`  / `Bottom` / `Top & Bottom` / `Center` / `Scale`

**Fix when scrolling** pins the element during prototype scrolling (headers,
navbars, floating action buttons).

⚠️ Constraints only apply on parents **without** a Flex or Grid layout. Once you
attach a layout to a board, children switch to the sizing system instead.

## The Fix / Fill / Auto rule sheet

- **Fix** — hard pixel size. Icons, avatars, fixed-width sidebars, dividers.
  Use when the design specifies an exact dimension.
- **Fill** — takes remaining space along an axis. Only meaningful inside a
  flex/grid parent. Use for any child that should stretch.
- **Auto (Hug)** — shrinks to content. Text, pills, auto-height cards.

### Common pairs

| Element                       | Horizontal | Vertical |
| ----------------------------- | ---------- | -------- |
| Full-width screen content     | Fill       | Fill     |
| Body paragraph                | Fill       | Auto     |
| Title single-line             | Fill       | Auto     |
| Sidebar                       | Fix        | Fill     |
| Avatar / icon                 | Fix        | Fix      |
| Card in a grid                | Fill       | Auto     |
| Modal panel                   | Fix        | Auto     |
| Button (with label)           | Auto       | Auto     |
| Full-width primary button     | Fill       | Auto     |

## Text `growType`

A Text layer has its own growth mode independent of sizing:

- `fixed` — text layer has a fixed box; text clips/overflows.
- `auto-width` — width grows with text; use inside a row when a label must not wrap.
- `auto-height` — fixed width, height grows with wrapping; use for body text in
  a Fill column.

If a text inside a Flex parent "won't flex," it's almost always because
`growType: fixed` is overriding the parent's layout. Switch to `auto-width` or
`auto-height`.

## Overlapping inside a layout

Static siblings in Flex/Grid **cannot overlap**. For badges/overlays:

1. Mark the overlapping child `absolute: true`.
2. Position with `x/y` (relative to the parent board).
3. Set `zIndex`.

Example: a notification badge on top of a bell icon.

```
Board "bell-with-badge" (flex row, size: Auto, Auto)
├── Icon "bell"         (Fix 24×24, static)
└── Circle "badge"      (Fix 12×12, ABSOLUTE, x=14, y=-2, zIndex=1)
```

## Round-trip CSS

Penpot's Inspect panel emits production-ready CSS. If you're unsure whether a
layout is "correct," cross-check what Inspect shows against standard CSS
flex/grid rules — the output is 1:1.
