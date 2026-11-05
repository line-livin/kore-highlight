# kore-highlight
The VsCode Highlighter

# KoRe-HighLight

Every token and word in the editor gets a colored **background highlight**. That is the main feature. Everything else is optional and off by default.

## Quick start
Open the Command Palette (`Ctrl+Shift+P`) and type **KoRe-HighLight**:

| Command | What it does |
|---|---|
| Choose Preset | One click look: Soft, Marker, Pill, Neon Glow, Ocean Calm, Forest Calm, High Contrast |
| Choose Color Palette | pastel, neon, ocean, sunset, forest, candy, earth, mono, highContrast, or your own |
| Change Color Mapping | `category`, `word`, `rainbow`, `single` |
| Text Color (optional) | off, auto, dark, light, custom |
| Font (optional) | Fira Code, JetBrains Mono, Cascadia Code, Comic Sans, Georgia, custom... |
| Toggle On/Off | also by clicking the status bar item |
| Reset to Defaults | restores every KoRe setting |

## Sizing and shape
- `koreHighlight.opacity` (0.1 to 1)
- `koreHighlight.borderRadius` (0 to 12 px): square marker to round pill
- `koreHighlight.highlightSize` (0 to 3 px): grows the highlight outward. Text never moves.

## Colors
- `koreHighlight.palette` and `koreHighlight.customPalette` (your own hex list)
- `koreHighlight.categoryColors`, e.g. `{ "keyword": "#ff0066", "string": "#00c2ff" }`
- `koreHighlight.singleColor` for the `single` mapping

## Optional text and font changes
- `textColorMode`: `off` (default), `auto`, `dark`, `light`, `custom` (+ `textColor`)
- `keywordStyle`, `commentStyle`, `functionStyle`, `typeStyle`, `stringStyle`: `normal`, `bold`, `italic`, `bold-italic`
- `fontFamily`: any installed font. Monospace fonts keep the cursor perfectly aligned; other fonts may make it drift.

## Notes
- `auto` text color only applies when opacity is 0.55 or higher (below that, the background is too faint to decide contrast).
- Large files: only the visible area (plus a buffer) is highlighted, so it stays fast.
