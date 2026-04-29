# MCP Programmatic Generation Guide

Practical lessons learned from generating production-quality Penpot designs via the MCP Plugin API.
These are hard-won rules that prevent the most common failures when building designs with code.

## The #1 Rule: Penpot Uses Absolute Page Coordinates

**`shape.x` and `shape.y` are ALWAYS absolute page coordinates**, not relative to parent.

This is the single most important thing to understand. Unlike HTML/CSS where child elements are positioned relative to their parent, Penpot's `x`/`y` properties always refer to the page origin (0,0).

```javascript
// WRONG — child.x is page-absolute, not parent-relative
const parent = penpot.createBoard();
parent.x = 100;
parent.y = 100;
parent.resize(400, 300);

const child = penpot.createText('Hello');
child.x = 20;   // This is page x=20, NOT x=20 inside parent!
child.y = 20;   // This is page y=20, NOT y=20 inside parent!
// Result: child appears at page (20,20), OUTSIDE the parent board at (100,100)
```

### Correct approach: Calculate absolute coords manually

```javascript
var PX = 100;  // parent absolute X
var PY = 100;  // parent absolute Y

var parent = penpot.createBoard();
parent.x = PX;
parent.y = PY;
parent.resize(400, 300);

var child = penpot.createText('Hello');
child.x = PX + 20;  // page-absolute = parent.x + desired offset
child.y = PY + 20;  // page-absolute = parent.y + desired offset
parent.appendChild(child);  // child is now visually inside parent
```

### Using setParentXY (relative positioning helper)

`penpotUtils.setParentXY(shape, parentX, parentY)` converts parent-relative coords to page-absolute:

```javascript
penpotUtils.setParentXY(child, 20, 20);
// Internally does: child.x = child.parent.x + 20; child.y = child.parent.y + 20;
```

**Caveat**: `setParentXY` reads `shape.parent` at call time. The shape MUST already be a child of the parent before calling this. If the shape has no parent, it uses `undefined` coords and the result is unpredictable.

### Recommended: Use absolute coords directly

For reliability and clarity, always calculate page-absolute coordinates yourself:

```javascript
// Define page origin as variables
var PX = 1300;  // page2 left edge (absolute)
var PY = 0;     // page2 top edge (absolute)

// Create a section at 32px padding from page edge
var SECTION_X = PX + 32;
var SECTION_Y = PY + 96;  // 72px header + 24px gap

var section = penpot.createBoard();
section.x = SECTION_X;
section.y = SECTION_Y;
section.resize(700, 360);
page.appendChild(section);

// Child at 24px padding inside section
var title = penpot.createText('Title');
title.x = SECTION_X + 24;
title.y = SECTION_Y + 24;
section.appendChild(title);
```

## Step-by-Step Generation Workflow

Follow this exact order to avoid confusion and rework:

### Step 1: Check connection & clear canvas

```javascript
// Verify connection
var pages = penpotUtils.getPages();

// Clear ALL existing elements
var root = penpot.root;
var kids = root.children.slice();
for (var i = kids.length - 1; i >= 0; i--) {
  kids[i].remove();
}
```

### Step 2: Plan layout with a coordinate map

Before writing ANY creation code, plan every element's absolute position:

```
Page: "用户仪表板"   origin=(0, 0)     size=1200×900
  header:            origin=(0, 0)     size=1200×72
    logo:            origin=(32, 24)   text
    nav-title:       origin=(160, 25)  text
  stats-row:         origin=(0, 96)    size=1200×140
    card-1:          origin=(32, 96)   size=250×120
      label:         origin=(52, 116)  text
      value:         origin=(52, 148)  text
    card-2:          origin=(310, 96)  size=250×120
    card-3:          origin=(588, 96)  size=250×120
  task-list:         origin=(32, 260)  size=800×440
    title:           origin=(56, 284)  text
    task-1:          origin=(56, 332)  text
```

### Step 3: Create top-down, parent before children

Always create the parent Board first, then its children, then grandchildren.
The parent MUST exist before you call `parent.appendChild(child)`.

### Step 4: Verify after each page

```javascript
var structure = penpotUtils.shapeStructure(penpot.root, 2);
// Check: no orphaned elements, no duplicate page names, correct nesting
```

## Naming Convention

Use a hierarchical naming scheme with a type prefix:

```
页面：[页面名]           → Top-level Board (the page frame)
  [section-name]          → Section Board (semantic area)
    [component-name]      → Component Board (reusable unit)
      [element-name]      → Leaf element (Text, Rectangle, Ellipse)
```

Examples:
- `页面：用户仪表板`
  - `header`
    - `logo` (Text)
    - `nav-title` (Text)
  - `stats-row`
    - `card-待办任务`
      - `label` (Text)
      - `value` (Text)

## Common Mistakes & Fixes

### Mistake: Using arrow functions / `const` / `let`

**Some Penpot plugin environments don't support ES6.** Always use `var` and `function`:

```javascript
// BROKEN in some environments
const card = penpot.createBoard();
cards.forEach((c) => { ... });
let x = 10;

// SAFE
var card = penpot.createBoard();
cards.forEach(function(c) { ... });
var x = 10;
```

### Mistake: Forgetting to set growType on text

Text without `growType` defaults to `fixed`, which clips content:

```javascript
var text = penpot.createText('Long text here');
text.growType = 'auto-width';  // ALWAYS set this
```

### Mistake: Orphaned elements after cleanup

When clearing the canvas, always remove from back to front:

```javascript
var kids = root.children.slice();  // snapshot first!
for (var i = kids.length - 1; i >= 0; i--) {
  kids[i].remove();
}
```

Iterating forward while removing causes index shifts and missed elements.

### Mistake: Duplicate pages from failed attempts

After multiple generation attempts, always check for duplicates:

```javascript
var names = {};
var dupes = [];
for (var i = 0; i < root.children.length; i++) {
  var n = root.children[i].name;
  if (names[n]) dupes.push(n);
  names[n] = true;
}
// Remove duplicates before declaring done
```

### Mistake: Elements outside parent bounds

After generation, validate containment:

```javascript
// Every child must satisfy:
// child.x >= parent.x
// child.y >= parent.y
// child.x + child.width <= parent.x + parent.width
// child.y + child.height <= parent.y + parent.height

// Quick check via analyzeDescendants:
var violations = penpotUtils.analyzeDescendants(page, function(root, shape) {
  var inside = penpotUtils.isContainedIn(shape, root);
  return inside ? null : { name: shape.name, x: shape.x, y: shape.y };
});
```

### Mistake: JavaScript syntax errors in for loops

`for...of` is not supported in all Penpot plugin environments:

```javascript
// BROKEN
for (const kid of root.children) { ... }

// SAFE
for (var i = 0; i < root.children.length; i++) {
  var kid = root.children[i];
}
```

## Multi-Page Layout Strategy

When placing multiple pages side by side:

```
Page 1:  x=0,      y=0,   w=1200,  h=900
Page 2:  x=1300,   y=0,   w=1200,  h=900   (gap=100)
Page 3:  x=2600,   y=0,   w=1400,  h=900   (gap=100)
```

Rules:
1. Use consistent gap between pages (e.g., 100px)
2. Each page is a top-level Board under Root Frame
3. Page coordinates are page-absolute (they ARE the Root's children)
4. All content inside a page must fit within the page's width/height

## Text Formatting Limitations

- `fontWeight`: Not all fonts support all weights. If you get `"Font weight '600' not supported"`, try omitting it or using a supported weight.
- Unicode/emoji: Use JS escape sequences for special characters in code strings to avoid JSON parsing issues: `\u2705` instead of `✅`.
- `fontFamily`: Only use fonts available in `penpot.fonts`. If unsure, omit it and use the default.

## Complete Example: A Single Page

```javascript
var PX = 0;   // page origin X
var PY = 0;   // page origin Y

var page = penpot.createBoard();
page.name = '页面：示例页面';
page.x = PX;
page.y = PY;
page.resize(1200, 900);
page.fills = [{ fillColor: '#F1F5F9', fillOpacity: 1 }];

// Header
var header = penpot.createBoard();
header.name = 'header';
header.x = PX;
header.y = PY;
header.resize(1200, 72);
header.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
page.appendChild(header);

var title = penpot.createText('Page Title');
title.fontSize = '22';
title.fills = [{ fillColor: '#1E293B', fillOpacity: 1 }];
title.growType = 'auto-width';
title.x = PX + 32;
title.y = PY + 24;
header.appendChild(title);

// Card section
var card = penpot.createBoard();
card.name = 'card';
card.x = PX + 32;
card.y = PY + 96;
card.resize(250, 120);
card.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
card.borderRadius = 12;
page.appendChild(card);

var label = penpot.createText('Label');
label.fontSize = '14';
label.fills = [{ fillColor: '#6B7280', fillOpacity: 1 }];
label.growType = 'auto-width';
label.x = PX + 32 + 20;  // card.x + padding
label.y = PY + 96 + 20;  // card.y + padding
card.appendChild(label);

var value = penpot.createText('42');
value.fontSize = '36';
value.fills = [{ fillColor: '#3B82F6', fillOpacity: 1 }];
value.growType = 'auto-width';
value.x = PX + 32 + 20;
value.y = PY + 96 + 52;
card.appendChild(value);
```
