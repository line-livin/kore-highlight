# Changelog

## 2.0.0
- Renamed to KoRe-HighLight, new KoRe logo.
- 9 built-in palettes + custom palette, per-category color overrides.
- Presets command (7 looks).
- New `highlightSize` setting for a bigger highlight without moving text.
- Optional text color modes (off/auto/dark/light/custom).
- Optional font emphasis per category (bold/italic) and optional font family with picker.
- Reset command, status bar toggle setting.
- Fixes: decoration types are now keyed by color + emphasis (no stale styles after setting changes), empty-match loop guard, settings values are validated and clamped, font value sanitized before use in CSS.
