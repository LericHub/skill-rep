# File Format & Data Model

## `.penpot` file (v2.4+)

A `.penpot` file is a **ZIP archive** containing:

- A **JSON structure** describing the file, pages, shape tree, library assets,
  and cross-references.
- **Binary assets** (bitmaps, vector images) stored as separate ZIP entries.

This is the current canonical format. Earlier formats (pre-v2.3) split into a
binary `.penpot` and a separate SVG+JSON `.zip` per page; both are deprecated.

Penpot commits to **no proprietary lock-in** — the format is intentionally
open and readable.

## Internal data model

Hierarchy (from Penpot's Data Model documentation):

```
File
├── data
│   ├── Pages
│   │   └── Page
│   │       └── ShapeTree
│   │           └── Shape (recursive tree)
│   └── Library assets
│       ├── Components
│       ├── MediaItems
│       ├── Colors
│       ├── Typographies
│       └── DesignTokens
└── StorageObjects  (binary assets — images, SVG icons)
```

### Shape node

Each Shape is an SVG node augmented with Penpot-specific metadata:

- `Selrect` — selection rectangle (axis-aligned bounds).
- `Transform` — affine transform matrix.
- `Constraints` — pin/scale settings.
- `Interactions` — prototype wiring.
- `Fill`, `Stroke`, `Shadow`, `Blur` — visual properties.
- `Font`, `Content` — text specifics.
- `Exports` — per-shape export targets.

### Import/export behavior

- Non-SVG-native attributes (proportion locks, constraints, stroke alignment)
  are serialized as SVG metadata extensions.
- On import, `parse-data` in `worker/import/parser.cljs` reconstructs Penpot
  Shape objects from SVG + metadata.
- `null` attribute values are **stripped** — absence implies default.
- File versions are migrated by `common/src/app/common/files/migrations.cljc`.

## Backend RPC

- `binfile:export-binfile` — export a file as `.penpot`.
- `binfile:import-binfile` — import. The `binfile-v3` variant supports
  **in-place import** when the ZIP contains exactly one file.

## Practical implications

- Because the format is a ZIP, you can `unzip` and `jq` the JSON to audit a
  file's structure programmatically.
- Because shapes are SVG nodes + metadata, anything expressible in SVG is
  losslessly round-trippable.
- When generating a `.penpot` by hand (rare — prefer the Plugin SDK), aim for
  minimal JSON: omit default/null values rather than writing them explicitly.
