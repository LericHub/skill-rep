# Template: Modal Overlay

A modal dialog opened as a prototype Overlay, preserving the underlying screen.

## Structure

```
Board "overlay/confirm-delete"        Flex column
                                      rowGap: 16, padding: 24
                                      horizontalSizing: fix (440)
                                      verticalSizing: auto
                                      fill: color.bg.surface
                                      borderRadius: md
                                      shadow: shadow.modal
│
├── Board "header"                    Flex row, justifyContent: space-between
│                                     alignItems: start, horizontalSizing: fill
│   ├── Text "Delete item?"          growType: auto-height, fill
│   │                                 typography: heading-sm
│   └── Icon-button "close"           fix 32×32
│
├── Text "body"                       growType: auto-height, fill
│                                     "This action cannot be undone."
│
└── Board "actions"                   Flex row, justifyContent: end, gap 8
                                      horizontalSizing: fill
    ├── Button "Cancel" (secondary)
    └── Button "Delete" (danger)
```

## Prototype wiring

On the trigger (e.g., a "Delete" button on the parent screen):

- **Trigger**: `On click`
- **Action**: `Open overlay`
- **Target**: `overlay/confirm-delete`
- **Position**: Center of viewport
- **Background**: Dimmed (so underlying screen is visible but non-interactive)
- **Close on outside click**: on
- **Animation**: `Dissolve`, 150 ms

On the overlay's **Close** icon-button and **Cancel** button:

- **Trigger**: `On click`
- **Action**: `Close overlay`

On the **Delete** button:

- **Trigger**: `On click`
- **Action**: `Close overlay` (simulate deletion); or `Navigate to` a
  confirmation screen if the flow continues.

## Why this is correct

- Uses **Open overlay**, not Navigate-to → the underlying screen is preserved
  and the user can dismiss back to where they were.
- Every Close path (X icon, Cancel button, outside click) is wired — no dead-ends.
- Modal Board is `horizontalSizing: fix` (width-capped) + `verticalSizing: auto`
  — grows with body content.
- All spacing via Flex `gap` and `padding` — no spacer rectangles.
