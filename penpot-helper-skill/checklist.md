# Pre-flight Checklist

Run through this before declaring any Penpot layout "done". Every generated
layout should pass all of these. Each item maps back to a specific pitfall.

## Structure

- [ ] Every **Board** has either (a) a Flex layout, (b) a Grid layout, or
      (c) intentional constraints. No Board is left as the default without a
      reason.
- [ ] **Nesting depth ≤ 4** Boards between the page root and the deepest leaf.
- [ ] No **Group** is used where a Board is needed (i.e., wherever you need
      clipping, a layout, or a component boundary).

## Sizing

- [ ] Every child inside a Flex/Grid parent has an **explicit**
      `horizontalSizing` and `verticalSizing` (no silent defaults).
- [ ] Fill children are only used inside a layout parent.
- [ ] Any `Fix` size is justified (icon, avatar, exact sidebar width).
- [ ] Every Text layer's `growType` matches intent:
      - `fixed` → only for clipped / overflow-hidden labels.
      - `auto-width` → single-line label.
      - `auto-height` → wrapping body copy inside a Fill column.

## Overlap & positioning

- [ ] No two static siblings share the same rectangle of space.
- [ ] Every intended overlap uses `absolute: true` + explicit `zIndex`.
- [ ] No invisible rectangles used as spacers — spacing is via `gap` +
      `padding`.
- [ ] No negative margins used to force overlap.
- [ ] Constraints are used only on **non-layout** boards; Sizing is used only
      on **layout** boards. Never mixed on the same parent.

## Design system

- [ ] Colors come from tokens (global → semantic). No raw hex in components.
- [ ] Spacing (gap, padding) comes from spacing tokens where possible.
- [ ] Typography comes from a typography token or composite.
- [ ] Border radius comes from a borderRadius token.
- [ ] Shadows come from shadow tokens.

## Components & variants

- [ ] Any Board copy-pasted twice is extracted as a component.
- [ ] Inner layer **names, types, and hierarchy** match across variants
      (so overrides survive variant swap).
- [ ] No component is duplicated across files — shared library only.

## Naming

- [ ] Every layer has a functional name (`title`, `icon`, `primary-action`).
      No `rectangle 23`, no `blue button`.
- [ ] Asset paths use `/` separators for grouping (`button/primary/hover`).
- [ ] Component children don't repeat the component name (`label`, not
      `button-label`).

## Prototyping

- [ ] Modals use `Open overlay`, not `Navigate to`.
- [ ] Every `Navigate to` has a return path (Previous screen, tab bar, or
      X/close).
- [ ] Headers / nav bars / FABs that should stay visible have **Fix when
      scrolling** enabled.
- [ ] Splash/launch screens use `After delay` → Navigate.

## Accessibility

- [ ] Body text ≥ 14 px (ideally 16 px).
- [ ] Contrast meets WCAG AA: ≥ 4.5:1 body, ≥ 3:1 large/UI.
- [ ] Status is never communicated by color alone.
- [ ] Interactive targets ≥ 44×44 px on mobile.

## Sanity check with Inspect

- [ ] Open Inspect mode on a flagship Board. Skim the CSS output. If something
      looks wrong in CSS (weird `position: absolute`, `width: 0`, missing
      flex-basis), fix it in the design.
