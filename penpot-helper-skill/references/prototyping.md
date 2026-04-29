# Prototyping Reference

Prototyping connects Boards into interactive flows, playable from **View mode**
with a shareable link.

## Triggers

| Trigger         | Scope          | Notes                                    |
| --------------- | -------------- | ---------------------------------------- |
| `On click`      | any shape      | Default; most common                     |
| `Mouse enter`   | any shape      | Hover in                                 |
| `Mouse leave`   | any shape      | Hover out                                |
| `After delay`   | **Board only** | Auto-advance after `ms` — splash → home  |

## Actions

| Action            | What it does                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| `Navigate to`     | Replace current screen with a target Board.                            |
| `Open overlay`    | Draw a Board on top of current screen. Preserves underlying screen.    |
| `Toggle overlay`  | Opens overlay if closed, closes it if open.                            |
| `Close overlay`   | Close the specified (or containing) overlay.                           |
| `Previous screen` | Back-button behavior — undoes the last Navigate-to.                    |
| `Open URL`        | Open an external URL (new tab).                                        |

### Overlay options

When using Open/Toggle overlay:

- **Position** — relative to the trigger, the viewport, or manual.
- **Background** — transparent, dim, or solid.
- **Close on outside click** — on/off.

## Animations

| Animation  | Options                                                         |
| ---------- | --------------------------------------------------------------- |
| `Dissolve` | Duration, easing. Simple cross-fade.                            |
| `Slide`    | Direction (L/R/U/D), IN or OUT, offset, duration, easing.       |
| `Push`     | Destination pushes origin out; direction, duration, easing.     |

## Flows

A **Flow** is a named journey with a starting Board. You can have multiple
flows per file — e.g., `Onboarding - new user`, `Checkout - desktop`,
`Checkout - mobile`. Each flow has its own View-mode shareable link.

Create a flow: hover a Board → click the ⏵ play icon in its top-left corner →
the Board becomes a starting Board; name the flow in the sidebar.

## Fixed elements (sticky)

Enable **Fix when scrolling** on a child for sticky behavior during prototype
scrolling. Common uses:

- Top navigation bar
- Side navigation
- Floating action button (FAB)
- Sticky footer

This only takes effect in View mode with a scrollable parent.

## Rules of thumb

- **Modal → overlay**, not Navigate-to. Modals should preserve the underlying
  screen; Navigate-to replaces it.
- **Full-screen transitions → Navigate-to.**
- **Back arrow → Previous screen.**
- **Splash/launch screen → After delay on the splash board.**
- Pair every Navigate-to to a new screen with a way back (Previous screen, a
  tab bar, or an X/close icon).
- Test from the start of each flow. In View mode, broken links show as
  non-clickable.
