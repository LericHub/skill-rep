# Design Tokens Reference

Penpot is the first major design tool to natively implement the W3C DTCG
**Design Tokens Format Module** (JSON, MIME `application/design-tokens+json`,
extensions `.tokens` / `.tokens.json`).

## Token types (12)

| Type                    | Notes                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| `color`                 | hex / `rgb()` / `rgba()` / `argb` / `hsl()` / `hsla()`             |
| `dimension`             | px, unitless, any CSS-compatible length                            |
| `sizing`                | widths/heights (abstract sizing)                                   |
| `spacing`               | **Flex-layout only** — applied as gap/padding                      |
| `typography`            | single property (font-family, font-size, etc.)                     |
| `typographyComposite`   | bundle (family + size + weight + line-height + letter-spacing)     |
| `borderRadius`          | corner radius                                                      |
| `opacity`               | 0–1 or 0–100%                                                      |
| `rotation`              | degrees                                                            |
| `number`                | raw numeric                                                        |
| `strokeWidth`           | line thickness                                                     |
| `shadow`                | drop/inner shadow record                                           |

## Aliases and references

Any token value can reference another with `{token.path}`:

```json
{
  "color": {
    "brand": { "primary": { "$type": "color", "$value": "#3B82F6" } },
    "button": {
      "bg":   { "$type": "color", "$value": "{color.brand.primary}" }
    }
  }
}
```

Updating the brand color cascades to every button that references it.

## Math in token values

Supported operators: `+ - * / % ^`
Functions: `abs`, `ceil`, `floor`, `round`, `max`, `min`, `sqrt`, `pow`, plus
trig (`sin`, `cos`, `tan`) and log.

```json
{ "$type": "spacing", "$value": "{spacing.small} * 2" }
```

## Token sets

Ordered sets that cascade like CSS — later sets override earlier ones. Use
sets to partition by concern: `base`, `light`, `dark`, `density-compact`, etc.

## Themes

Penpot supports **multidimensional themes**:

- Dimensions example: `Mode × Brand × Contrast`.
- Multiple themes can be active simultaneously.
- Each theme is a chosen combination of token sets.

Shareable via library publish, just like components.

## Import / export

- Single JSON file.
- ZIP with multifile structure + optional `$themes.json` / `$metadata.json`.
- Folder import (multi-file).

## Recommended 3-tier hierarchy

```
Global (primitives)            Semantic                        Component
color.base.neutral.100    →    color.bg.surface           →   color.card.bg
color.base.blue.500       →    color.bg.brand             →   color.button.primary.bg
spacing.base.8            →    spacing.md                 →   card.padding
```

- **Global** — raw values. Should never be used directly by components.
- **Semantic** — meaning-first (`bg.default`, `text.primary`, `spacing.md`).
  Components and screens reference these.
- **Component** — component-specific overrides. Optional but useful for heavy
  customization.

Rule: a component should never reference a **global** token directly. Always
go through a semantic token so you can reskin the system by swapping a single
layer.

## When to use tokens

Use tokens for **every** color, spacing, radius, typography, and shadow value
that could ever need to change. The cost of adding a token today is 30 seconds;
the cost of refactoring 500 hard-coded hexes later is hours.

Spacing tokens only apply to **Flex** layout properties (gap, padding). They
do not apply to position or size of non-flex children.
