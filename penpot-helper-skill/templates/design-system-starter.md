# Template: Design System Starter

Use this as the scaffold for a brand-new Penpot design-system library. Publish
the file as a shared library; consumer product files import from it.

## Pages

```
Page "0. Cover"                       Title board + system docs
Page "1. Tokens"                      Token reference swatches
Page "2. Foundations"                 Typography, color, spacing, radius, shadow
Page "3. Icons"                       Icon grid (each as a component)
Page "4. Atoms"                       Button, Input, Checkbox, Badge, Avatar
Page "5. Molecules"                   Field, Card, ListItem, Toast
Page "6. Organisms"                   Header, Sidebar, Table, Form, Modal
Page "7. Templates"                   Full-screen templates for reuse
```

## Tokens (set up first)

### Global (primitives)

```
color.base.neutral.{50 | 100 | 200 | ... | 950}
color.base.brand.{50 | 100 | ... | 950}
color.base.semantic.{success | warning | danger | info}.{50 … 950}

spacing.base.{0 | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64 | 96}
radius.base.{none | sm | md | lg | full}
typography.base.{display | heading | body | caption}.{xl | lg | md | sm}
shadow.base.{none | sm | md | lg | xl}
```

### Semantic

```
color.bg.{default | surface | subtle | brand | inverse}
color.text.{primary | secondary | tertiary | brand | inverse | on-brand}
color.border.{default | subtle | strong | brand | focus}
color.status.{success | warning | danger | info}.{bg | fg}

spacing.{xxs | xs | sm | md | lg | xl | xxl}
radius.{sm | md | lg | full}
typography.{heading-lg | heading-md | heading-sm | body | caption | code}
shadow.{card | modal | popover}
```

### Component (optional)

Only when a component needs to deviate:
```
color.button.primary.{bg | fg | border | bg-hover | bg-pressed}
color.card.{bg | border}
```

## Atom components (minimum set)

| Component | Variants                                                         |
| --------- | ---------------------------------------------------------------- |
| Button    | Size (sm/md/lg) × State (default/hover/pressed/disabled) × Kind (primary/secondary/ghost/danger) × Leading (none/icon) |
| Input     | Size × State × Leading × Trailing                                |
| Checkbox  | Checked (off/on/indeterminate) × State                           |
| Radio     | Selected × State                                                 |
| Badge     | Kind × Size                                                      |
| Avatar    | Size × Source (image/initials/placeholder)                       |
| Icon      | One component per icon (named by function)                       |

## Molecule components

- Field (label + input + help + error) — built on Input.
- Card — image + title + body + actions.
- ListItem — leading + text block + trailing.
- Toast — status icon + text + close.

## Organism components

- Header (left brand, center/nav, right actions).
- Sidebar (vertical nav).
- Table (header row + body rows + pagination).
- Form (stacked fields + action bar).
- Modal (overlay shell).

## Publishing

1. Name the file `Design System – vX.Y`.
2. File menu → **Publish library**.
3. In consumer files: Assets panel (`Alt/⌥+I`) → enable this library.
4. Tag releases in the file name or via a dated page.

## Governance rules

- Single source of truth: one main per concept. Kill duplicates on sight.
- Never hard-code colors/spacings inside components — tokens only.
- Every new component goes through: sketch → atoms review → documentation →
  publish.
- Breaking changes bump the version in the file name so consumers can pin.
