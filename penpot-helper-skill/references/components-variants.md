# Components & Variants Reference

## Main components vs instances

- **Main component** — the source of truth. Create with `Ctrl+K` or right-click
  → **Create component**. Lives in the Assets panel. One per file, or in a
  shared library.
- **Instance (copy)** — inherits from the main. Drag from Assets panel onto a
  page. Changes to the main propagate to all instances (unless overridden).
- **Override** — any property you change on an instance (text, color, icon, size).
  Overrides survive main-component updates (for the overridden properties).

### Key actions

| Action                      | How                                                    |
| --------------------------- | ------------------------------------------------------ |
| Create component            | `Ctrl+K` / right-click                                 |
| Detach instance from main   | `Ctrl+Shift+K`                                         |
| Reset overrides             | Right-click → **Reset overrides**                      |
| Update main from instance   | Right-click → **Update main component**                |
| Swap instance               | Click component name in sidebar → pick another         |
| Rename (path) in library    | Edit name with `/` separators to auto-group            |

## Nested components

Components can contain other components. When updating a main, only the
property you changed propagates — nested instances keep their own inheritance
chains. This is how you build a design system bottom-up (tokens → atoms →
molecules → organisms).

## Variants

A variant is **one component parameterized by Properties × Values**.

Example — a `Button` variant:

```
Properties:
  Size     = sm | md | lg
  State    = default | hover | pressed | disabled
  Leading  = none | icon
```

That's `3 × 4 × 2 = 24` variant instances, all swapable via the sidebar.

### Create variants

- `Ctrl+K` → **Create variant** on a group of shapes.
- Or select several existing components → right-click → **Combine as variants**.
- Penpot infers properties from naming (`Button / lg / hover`) and exposes them
  in the Design sidebar.
- When a property's values are opposing pairs (`true/false`, `on/off`), Penpot
  renders a boolean toggle automatically.

### Override preservation across variant swaps

Overrides survive when you swap variants if the inner layers are **connected**:

- Same **name**
- Same **type** (Rectangle / Ellipse / Path treated as equivalent)
- Same **hierarchy level** (i.e., same parent path)

If you rename `label` to `title` in one variant but not another, overrides on
that layer are lost when swapping between them. Keep naming identical across
variants.

## Naming conventions

- Use `/` separators for hierarchy: `button/primary/hover`, `icon/status/success`.
- Name by **function, not appearance**. `icon-primary`, not `blue-star`.
- Don't repeat the component name inside its children. A `Button` component's
  label should be `label`, not `button-label`.
- Prefer spaces in asset names (`check icon`) for searchability.

## Shared libraries

- Any file can be **published** as a shared library (`File` menu → **Publish**).
- In another file, enable it from the Assets panel (`Alt/⌥+I`).
- Shared libraries expose components, colors, typographies, and design tokens.
- **Unpublishing** a library disconnects consumers. Used assets remain inside
  consumer files but lose the library link (become "local" detached copies).

## When to extract a component

Rule of thumb: **the second copy-paste** is the cue. If you find yourself
duplicating a Board, stop and extract it. Benefits compound with every use.

## Variant pitfalls

- **Over-packed variants** — cramming unrelated components (e.g., a button and
  a chip) into one variant because they look similar. Keep each variant
  conceptually one component with parameterized dimensions.
- **Too many dimensions** — 5+ properties with 4+ values each produces
  combinatorial explosion and unmaintainable state. Break into sub-components.
- **Inconsistent inner naming** breaks override preservation. Audit regularly.
