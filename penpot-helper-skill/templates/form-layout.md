# Template: Form Layout

A vertical form with labels, help text, validation, and a sticky action bar.

## Structure

```
Board "form"                          Flex column
                                      rowGap: 24, padding: 32
                                      horizontalSizing: fix (520)
                                      verticalSizing: auto
│
├── Text "Form title"                 growType: auto-height
│                                     horizontalSizing: fill
│
├── Board "field/email"               Flex column, rowGap: 6
│   │                                 horizontalSizing: fill
│   │                                 verticalSizing: auto
│   ├── Text "label"                  auto-height, horizontalSizing: fill
│   ├── Board "input"                 Flex row, padding 10 12, align: center
│   │   │                             horizontalSizing: fill
│   │   │                             verticalSizing: fix (40)
│   │   │                             borderRadius: sm, stroke: 1 border.default
│   │   ├── Icon "mail"               fix 16×16
│   │   └── Text "placeholder"        auto-height, horizontalSizing: fill
│   └── Text "help / error"           auto-height, horizontalSizing: fill
│                                     color: text.secondary (or text.error)
│
├── Board "field/password"            (same shape as field/email)
│
├── Board "row/remember-forgot"       Flex row, justifyContent: space-between
│                                     horizontalSizing: fill
│   ├── Board "checkbox row"          Flex row, gap 8 (auto/auto)
│   └── Text "Forgot password?"       auto-width
│
└── Board "actions"                   Flex row, justifyContent: end, gap 8
                                      horizontalSizing: fill
    ├── Button "Cancel" (secondary)
    └── Button "Submit" (primary)
```

## Why this is correct

- Every field is a **Board** (Flex column) so label/input/help are grouped and
  can be extracted into a component later.
- **No fixed-height inputs leaking** — the row `input` uses `verticalSizing: fix`
  (40) but everything inside flexes.
- Labels and help text use `auto-height` + `fill` so they wrap cleanly without
  overflowing the field.
- Submit row uses `justifyContent: end` — no invisible spacer rectangles.

## Variant: extract as `Field` component

Extract the `field/*` Board as a `Field` component with properties:
- `state`: default / focus / error / disabled
- `leading`: none / icon
- `trailing`: none / icon / button

Instance properties override `label`, placeholder text, and help text.
