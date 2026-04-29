# Layers & Shapes Reference

Penpot's canvas is a tree of Shapes. The union:

```ts
Shape = Board | Group | Boolean | Rectangle | Path | Text | Ellipse | SvgRaw | Image
```

## Shape types

| Type        | Shortcut  | Notes                                                                                  |
| ----------- | --------- | -------------------------------------------------------------------------------------- |
| **Board**   | `B`       | Primary container. Clippable. Nestable. Can carry Flex or Grid. Holds `children`.      |
| **Group**   | `Ctrl+G`  | Non-clipping logical grouping. Shared transforms/styles. No layout, no clip.           |
| **Rectangle** | `R`     | Primitive.                                                                             |
| **Ellipse** | `E`       | Primitive.                                                                             |
| **Path**    | `P`       | Vector path — click for corner nodes, drag for curves. `Shift+C` = freehand curve.     |
| **Text**    | `T`       | Has `growType: fixed | auto-width | auto-height`. Font, size, weight, line-height, etc.|
| **Image**   | —         | Bitmap. Imported via toolbar / drag / paste. Maintains aspect ratio.                   |
| **SvgRaw**  | —         | Imported SVG subtree.                                                                  |
| **Boolean** | —         | Union / Difference / Intersection / Exclusion / Flatten (destructive).                 |

## Board vs Group

Use a **Board** when:
- The region needs Flex/Grid.
- It should clip its contents.
- It's a screen, a component root, or a responsive region.
- You want it exportable as PNG/SVG/PDF.

Use a **Group** when:
- You only want a logical bundle to move/transform together.
- You don't need a layout or clipping.

## Booleans

- **Union** — merge shapes into one outline.
- **Difference** — subtract top from bottom.
- **Intersection** — keep overlap only.
- **Exclusion** — keep non-overlap only.
- **Flatten** — destructive merge into a single Path (irreversible).

Booleans are non-destructive except Flatten — the source shapes remain editable
inside.

## Masks

Select two or more layers → `Ctrl+M`. The **bottom** layer in the list becomes
the clipping mask; everything above is clipped to its outline.

## Z-order

Layer panel = z-order (top of list draws on top).

Plugin API:
- `shape.bringToFront()`, `bringForward()`
- `shape.sendToBack()`, `sendBackward()`

Keyboard: `Ctrl+Shift+]`, `Ctrl+]`, `Ctrl+[`, `Ctrl+Shift+[`.

## Hide, lock, block

- **Hide** (eye) — invisible on canvas, still in the tree.
- **Lock** (lock icon) — prevents drag/resize on canvas. Property edits still work.
- `blocked` (plugin field) corresponds to the lock state.

## Nesting

- Boards can nest arbitrarily; cap at **3–4** levels in practice for readability
  and performance.
- First-level boards show by default in View mode; nested boards are hidden
  unless you toggle **Show in view mode** on them.

## Selrect / bounds

Every Shape has:
- `x`, `y` — position in the parent's coordinate space.
- `width`, `height` — size.
- `bounds` — axis-aligned bounding box in page coordinates.
- `center` — centroid.
- `rotation` — degrees.
- `flipX`, `flipY` — booleans.

Use `parentX`, `parentY` for position relative to the immediate parent board,
and `boardX`, `boardY` for position relative to the containing top-level board.

## Fills, strokes, shadows, blur

All shapes carry arrays/objects for:
- `fills: Fill[]` — stacked fill layers (color / gradient / image).
- `strokes: Stroke[]` — color, width, style (`solid` / `dotted` / `dashed` / `mixed`),
  alignment (`center` / `inner` / `outer`), caps.
- `shadows: Shadow[]` — drop/inner shadows with color, offset, blur, spread.
- `blur` — layer blur.
- `opacity`, `blendMode` — on the shape itself.
- `borderRadius` — per-corner or uniform.
