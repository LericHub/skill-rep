# Common Pitfalls

Catalog of Penpot layout and design-system mistakes, with root cause and fix.

## Layout breakage

### "My flex layout doesn't flex"

Symptom: text or child doesn't grow with the parent.

Root cause: text `growType: fixed` or child `horizontalSizing: fix`.

Fix: switch text to `auto-width` or `auto-height`; switch child to `fill`.

Ref: [#3912](https://github.com/penpot/penpot/issues/3912).

### Children overlap in a flex row/column

Symptom: two siblings sit on top of each other.

Root cause:
- One child has `absolute: true` when it shouldn't, OR
- The parent doesn't actually have a layout attached (classic board), OR
- Negative margins were used.

Fix: confirm the parent has Flex or Grid, confirm no child is `absolute` unless
intended, remove negative margins.

### Mixing constraints and flex/grid

Symptom: children behave erratically when parent resizes.

Root cause: constraints apply only on non-layout boards. Once you attach a
layout, children use Fix/Fill/Auto instead.

Fix: pick one system per board. Don't try to use both.

### Grid cells reorder after editing child margin

Symptom: grid children jump around.

Root cause: bug — multi-side margins on a grid child can re-trigger placement.

Fix: use container `gap` + `padding` rather than child margins. Prefer auto
placement, or pin with explicit `row`/`column` if the child must stay put.

Ref: [#7206](https://github.com/penpot/penpot/issues/7206).

### Board drop target lands on overlapping sibling

Ref: [#3210](https://github.com/penpot/penpot/issues/3210).

## Design-system mistakes

### Hard-coded values

Symptom: every color/spacing is a hex or px. Theme swap is impossible; visual
consistency drifts.

Fix: set up global → semantic tokens first, then reference tokens everywhere.

### "Blue button" naming

Symptom: layer names describe appearance (`blue button`, `rectangle 23`).

Fix: name by function (`primary-action`, `cta`). Function survives restyling;
appearance doesn't.

### Invisible rectangles as spacers

Symptom: fixed-size transparent shapes between items.

Fix: delete them. Use container `gap` (+ `padding`).

### Over-nested boards

Symptom: 6+ levels of nested boards for a simple card.

Fix: flatten to ≤ 4 levels. Each nesting should earn its keep (a layout, a
clip, or a component boundary).

## Component-system mistakes

### One-off components

Symptom: a Board is extracted as a component but used only once.

Fix: wait for the second copy-paste before extracting. Premature componentization
adds navigation cost without reuse benefit.

### Variant explosion

Symptom: 80+ variants because every dimension added doubles the count.

Fix: orthogonal dimensions only. If `State` applies to every size, keep one
variant with both. If `State` only applies to one size, break that into a
separate component.

### Lost overrides after variant swap

Symptom: text edits vanish when swapping variants.

Fix: ensure inner layer names, types, and hierarchy match across variants.

## Prototyping mistakes

### Modal as Navigate-to

Symptom: the "modal" replaces the underlying screen — back arrow awkward.

Fix: use **Open overlay** for modals, not Navigate-to.

### Missing back path

Symptom: user gets stuck on a screen after Navigate-to.

Fix: every Navigate-to needs a return path — Previous screen, a persistent
tab bar, or an X/close action.

### Non-sticky headers

Symptom: header scrolls away during prototype scrolling.

Fix: enable **Fix when scrolling** on the header Board (or nav sidebar, FAB).

## Accessibility oversights

- Low contrast between text and background — fails WCAG.
- Status communicated by color alone (red/green) — invisible to colorblind users.
- Body text below 14 px.
- Interactive targets below 44×44 px (mobile).

Fix all of these via a semantic token layer so the whole system meets AA by
construction.

## Process mistakes

### One file for everything

Symptom: a single file with every screen, component, and icon.

Fix: split — one library file for design system, one file per product area.

### No source of truth per component

Symptom: two "Primary Button" components diverge over time.

Fix: one main component per concept. Use variants for parameterization.

### Ignoring Inspect

Symptom: designers hand off without checking Inspect. Engineers get wrong values.

Fix: every board has tokens applied, and the Inspect panel is your
handoff spec — verify before declaring a design done.
