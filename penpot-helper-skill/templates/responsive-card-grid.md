# Template: Responsive Card Grid

A grid of cards that reflows across breakpoints and never overlaps.

## Structure

```
Board "cards"                       Grid layout
                                    columns: repeat(auto) 1fr   (auto fills by width)
                                    rowGap: 16, columnGap: 16
                                    padding: 24
                                    horizontalSizing: fill
                                    verticalSizing: auto
│
├── Card instance 1                 cell placement: auto
├── Card instance 2                 cell placement: auto
└── Card instance N                 cell placement: auto
```

The `Card` component:

```
Board "card"                        Flex column
                                    rowGap: 12, padding: 16
                                    horizontalSizing: fill
                                    verticalSizing: auto
│
├── Rectangle "image"               horizontalSizing: fill
│                                   verticalSizing: fix (e.g., 160)
├── Text "title"                    growType: auto-height
│                                   horizontalSizing: fill
├── Text "body"                     growType: auto-height
│                                   horizontalSizing: fill
└── Board "actions"                 Flex row
                                    columnGap: 8
                                    justifyContent: end
                                    horizontalSizing: fill
    └── Button instance             (primary)
```

## Tokens referenced

- `color.bg.surface` — card background fill
- `color.text.primary` — title
- `color.text.secondary` — body
- `spacing.md` — card padding, grid gap
- `borderRadius.md` — card corners
- `shadow.card` — elevation

## Why this doesn't overlap

- The outer grid places children in tracks — static siblings can't overlap.
- The card internals are Flex column with `gap` — no spacers, no overlap.
- Text uses `auto-height` + `horizontalSizing: fill` → wraps within the column
  width, no overflow.
- Image uses `fill` horizontally, `fix` vertically → stretches with card width
  without squashing the rest.

## Responsive behavior

- Resize the `cards` board wider → more columns fit (auto track generation).
- Resize narrower → columns collapse; cards stack.
- Cards themselves flex internally via Fill/Auto.
