# Plugin API Reference

The **Penpot Plugin SDK** lets you create, inspect, and mutate Penpot files
programmatically from a plugin running inside Penpot.

## Architecture

- Plugin ships as `manifest.json` + JS bundles, hosted on any web server.
- Runs in a **sandboxed iframe** inside Penpot; communicates via postMessage.
- Split into:
  - `plugin.ts` — has access to the `penpot` global (the API).
  - UI scripts — optional, render the plugin's panel. No `penpot` access.
- Install in Penpot: `Ctrl+Alt+P` (⌘+Alt+P on macOS) → paste manifest URL.

## Manifest

```json
{
  "name": "My Penpot Plugin",
  "description": "…",
  "code": "/plugin.js",
  "icon": "/icon.png",
  "permissions": [
    "content:read",
    "content:write",
    "library:read",
    "library:write",
    "user:read",
    "comment:read",
    "comment:write",
    "allow:downloads",
    "allow:localstorage"
  ]
}
```

`*:write` implies `*:read`. Start with the narrowest permission set you can.

## The `penpot` global

Top-level entry points:

```ts
penpot.ui.open(title: string, url: string)
penpot.on(event, handler)        // "pagechange", "selectionchange", "themechange", "finish"
penpot.off(event, handler)

// Selection & context
penpot.root                      // top File node
penpot.currentFile: File
penpot.currentPage: Page
penpot.selection: Shape[]

// Factories
penpot.createBoard(): Board
penpot.createRectangle(): Rectangle
penpot.createEllipse(): Ellipse
penpot.createText(content: string): Text
penpot.createPath(): Path

// Type guards
penpot.utils.types.isBoard(shape)
penpot.utils.types.isGroup(shape)
penpot.utils.types.isRectangle(shape)
penpot.utils.types.isEllipse(shape)
penpot.utils.types.isPath(shape)
penpot.utils.types.isText(shape)
penpot.utils.types.isSVG(shape)
penpot.utils.types.isBool(shape)
penpot.utils.types.isMask(shape)
penpot.utils.types.isVariantContainer(shape)
penpot.utils.types.isVariantComponent(shape)
```

## `ShapeBase` — common to every shape

Properties: `id`, `name`, `parent`, `parentIndex`, `x`, `y`, `width`, `height`,
`bounds`, `center`, `blocked`, `hidden`, `visible`, `proportionLock`,
`constraintsHorizontal`, `constraintsVertical`, `borderRadius`, `opacity`,
`blendMode`, `shadows`, `blur`, `exports`, `boardX`, `boardY`, `parentX`,
`parentY`, `flipX`, `flipY`, `rotation`, `fills`, `strokes`, `layoutChild`,
`layoutCell`, `tokens`, `interactions`.

Methods: `resize(width, height)`, `rotate(deg, center?)`, `bringToFront()`,
`bringForward()`, `sendToBack()`, `sendBackward()`, `clone()`, `remove()`,
`export(options)`, `addInteraction(trigger, action, options?)`, `applyToken(token)`.

## `Board` methods

```ts
board.appendChild(shape)
board.insertChild(index, shape)
board.addFlexLayout(): FlexLayout
board.addGridLayout(): GridLayout
board.addRulerGuide(axis, position)
board.isVariantContainer(): boolean
```

`FlexLayout` and `GridLayout` objects expose every container property
(`direction`, `wrap`, `justifyContent`, `alignItems`, `rowGap`, `columnGap`,
padding, etc.) as mutable fields.

## `Text` specifics

```ts
text.characters: string
text.growType: "fixed" | "auto-width" | "auto-height"
text.align, text.verticalAlign
text.getRange(start, end): TextRange    // font, weight, color etc. per-range
text.applyTypography(libraryTypography)
```

## `File` export

```ts
file.export({
  exportType: "penpot" | "zip",
  libraryExportType: "all" | "merge" | "detach"
})
```

## Worked example — generate a responsive card

```ts
const board = penpot.createBoard();
board.name = "card";
const flex = board.addFlexLayout();
flex.direction = "column";
flex.rowGap = 12;
flex.paddingTop = flex.paddingBottom = flex.paddingLeft = flex.paddingRight = 16;
board.layoutChild.horizontalSizing = "fill";
board.layoutChild.verticalSizing = "auto";

const img = penpot.createRectangle();
img.resize(320, 180);
img.layoutChild.horizontalSizing = "fill";
img.layoutChild.verticalSizing = "fix";
board.appendChild(img);

const title = penpot.createText("Card title");
title.growType = "auto-height";
title.layoutChild.horizontalSizing = "fill";
board.appendChild(title);

const body = penpot.createText("Body copy goes here. It will wrap because the text uses auto-height and fills the parent width.");
body.growType = "auto-height";
body.layoutChild.horizontalSizing = "fill";
board.appendChild(body);

penpot.currentPage.root.appendChild(board);
```

### Generation order

Build **top-down**: create the parent Board → attach its layout → set each
child's `layoutChild.horizontalSizing / verticalSizing` → `appendChild`.
Setting sizing *before* appending avoids a momentary default-Fix surge that
can overflow the parent.

## Development workflow

- Official starter: [`penpot/penpot-plugin-starter-template`](https://github.com/penpot/penpot-plugin-starter-template)
  (Vite + TypeScript).
- Local dev: `npm run dev` → serves on `http://localhost:4400/manifest.json`.
- In Penpot: `Ctrl+Alt+P` → paste the manifest URL → plugin appears in the
  Plugins panel.
