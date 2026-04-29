# Template: App Screen with Sidebar

Classic dashboard layout: sticky header on top, persistent sidebar on the left,
scrollable main content on the right.

## Structure

```
Board "screen/dashboard"              Flex column
                                      horizontalSizing: fix (1440)
                                      verticalSizing: auto
│
├── Board "header"                    Flex row
│                                     columnGap: 24, padding: 16 32
│                                     justifyContent: space-between
│                                     alignItems: center
│                                     horizontalSizing: fill
│                                     verticalSizing: fix (64)
│                                     Fix when scrolling: ON
│   ├── Board "brand"                 Flex row, columnGap: 8 (auto / auto)
│   │   ├── Image "logo"              fix 32×32
│   │   └── Text "wordmark"           auto-width
│   ├── Board "nav"                   Flex row, columnGap: 24 (auto / auto)
│   │   └── … nav links
│   └── Board "account"               Flex row, columnGap: 12 (auto / auto)
│       └── Avatar instance
│
└── Board "body"                      Flex row
                                      columnGap: 0
                                      horizontalSizing: fill
                                      verticalSizing: fill
    ├── Board "sidebar"               Flex column
    │                                 rowGap: 4, padding: 24 16
    │                                 horizontalSizing: fix (240)
    │                                 verticalSizing: fill
    │                                 Fix when scrolling: ON
    │   └── … nav items (each Flex row, gap 12, padding 8 12)
    │
    └── Board "main"                  Flex column
                                      rowGap: 32, padding: 32
                                      horizontalSizing: fill
                                      verticalSizing: fill
        ├── Board "page-header"       Flex row, justify-content: space-between
        │   ├── Text "Page title"     growType: auto-width
        │   └── Board "actions"       Flex row, columnGap: 8
        │
        ├── Board "kpi-row"           Grid, columns: repeat 4 1fr, gap 16
        │   └── 4× KPI card instances
        │
        └── Board "chart"             Board (content)
                                      horizontalSizing: fill
                                      verticalSizing: fix (400)
```

## Why this is correct

- **Sizing discipline**: sidebar is `Fix 240 × Fill`, main is `Fill × Fill` —
  main always consumes remaining width, sidebar is stable.
- **Sticky header & sidebar** via **Fix when scrolling**, not hacks.
- **No overlap possible**: the outer screen is Flex column (header above body),
  body is Flex row (sidebar | main). Static siblings don't overlap in Flex.
- **KPI row** uses Grid 4-column with `gap` — reflows cleanly, never overlaps.

## When to deviate

- Mobile: collapse sidebar to a drawer (Overlay prototype action) and switch
  main to `horizontalSizing: fill` on a narrower screen board.
- If you want a centered max-width content column, wrap `main`'s children in a
  Board with `horizontalSizing: fix (1200)` and `alignSelf: center`.
