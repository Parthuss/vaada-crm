# Vaada visual system

## Direction

Vaada is a restrained, light-first product interface for salespeople working in bright offices and moving quickly between calls. Its visual personality comes from a continuous promise-loop motif, compact operational typography, and selective semantic color—not decoration.

The design is informed by production workflow patterns on Mobbin, CRM topology explorations on Dribbble, and the coherent operational-health hierarchy of Aqtos. See `docs/DESIGN_RESEARCH.md`.

## Color

Colors use OKLCH so lightness and chroma steps remain perceptually consistent. Normal text pairs target at least 4.5:1 contrast, primary body text targets 7:1 or better, and essential control boundaries target at least 3:1. Status always includes text and/or an icon rather than relying on hue alone.

```css
:root {
  --color-bg: oklch(0.982 0.008 92);
  --color-surface: oklch(1 0 0);
  --color-surface-strong: oklch(0.964 0.012 90);
  --color-ink: oklch(0.20 0.025 165);
  --color-muted: oklch(0.44 0.025 165);
  --color-primary: oklch(0.31 0.074 163);
  --color-primary-hover: oklch(0.26 0.07 163);
  --color-primary-soft: oklch(0.93 0.035 160);
  --color-due: oklch(0.49 0.12 72);
  --color-due-soft: oklch(0.94 0.05 83);
  --color-overdue: oklch(0.48 0.16 28);
  --color-overdue-soft: oklch(0.94 0.04 27);
  --color-divider: oklch(0.86 0.016 100);
  --color-control-border: oklch(0.64 0.02 160);
}
```

Verified contrast pairs:

| Pair | Ratio | Use |
| --- | ---: | --- |
| Ink / background | 17.08:1 | Primary text |
| Muted / background | 7.28:1 | Secondary text |
| White / primary | 12.64:1 | Primary buttons |
| Primary / primary-soft | 10.42:1 | Selected/positive status |
| Due / due-soft | 5.36:1 | Due-today status |
| Overdue / overdue-soft | 5.79:1 | Overdue/error status |
| Control border / background | 3.16:1 | Inputs and essential boundaries |

Marigold is reserved for due-today attention. Coral is reserved for overdue or error states. Deep evergreen marks completion, selection, navigation, and primary actions; it conveys trust and steady progress without default SaaS blue.

## Typography

### Latin interface

Use **Inter Variable** for the English interface. It was designed for detailed user interfaces, includes a text optical size with a tall x-height, supports disambiguation variants, and provides tabular numerals for aligned dates, amounts, and pipeline counts.

```css
font-family: "Inter Variable", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
font-optical-sizing: auto;
font-feature-settings: "calt" 1, "ss02" 1;
```

Apply `font-variant-numeric: tabular-nums` to dashboards, dates, counts, and monetary values.

### Indian-script localization

Inter does not provide broad Indic-script coverage. A future localized build must load the relevant script-specific Noto Sans UI family before the generic sans fallback. For Hindi and Marathi UI, use **Noto Sans Devanagari UI**, which is designed for compact app and website controls.

```css
font-family: "Noto Sans Devanagari UI", "Noto Sans Devanagari", "Noto Sans", sans-serif;
```

Only load script fonts for enabled locales to avoid unnecessary font cost.

### Product type scale

| Role | Size / line-height | Weight |
| --- | --- | --- |
| Page title | 1.75rem / 2.125rem | 650 |
| Section title | 1.125rem / 1.5rem | 650 |
| Lead name / emphasized row | 0.9375rem / 1.375rem | 600 |
| Body / form control | 0.875rem / 1.25rem | 450 |
| Metadata | 0.8125rem / 1.125rem | 450 |
| Compact label | 0.75rem / 1rem | 600 |

Avoid display typography in labels, buttons, and data. Tracked uppercase is reserved for short, non-essential orientation labels; it never carries primary instructions or field meaning.

This scale governs the authenticated operational app. The signed-out login screen is a marketing/brand surface, not an operational one, and is deliberately exempt — its headline runs a large fluid display size (`clamp(44px, 6.4vw, 82px)`) to make the first impression, not to stay legible in a dense worklist.

## Layout

- Desktop uses a compact fixed sidebar and a flexible primary workspace.
- Dashboard begins with an attention queue, not a metric-card strip.
- Lead lists use semantic tables on wide screens and structured rows on narrow screens.
- Lead details use a persistent contextual panel or dedicated route; avoid defaulting to modals.
- Maximum prose measure is 70ch. Operational data may run wider.
- Mobile collapses navigation and stacks action groups; it does not simply shrink the desktop canvas.

## Components

- Corners: 10–12px controls, 16–18px bounded panels, fully rounded only for compact status pills and the promise mark.
- Elevation: borders and background layers first; shadows only for menus, popovers, and transient overlays.
- Icons: one outlined icon family with 1.75–2px strokes and accessible names where icons stand alone.
- Buttons: primary evergreen fill, secondary neutral outline, destructive explicit coral treatment.
- Inputs: persistent labels, visible control boundary, inline validation, and descriptive errors.
- Tables: sticky header when useful, row hover as reinforcement only, full keyboard-accessible actions.
- Status: icon + text + semantic soft fill; never color alone.

## Motion

Use 150–220ms ease-out transitions for state changes, panel entry, and feedback. No page-load choreography. Respect `prefers-reduced-motion` by removing transforms and reducing transitions to near-instant opacity changes.

## Source rationale

- [MDN on OKLCH](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Colors/Color_values)
- [WCAG 2.2 contrast and use-of-color requirements](https://www.w3.org/TR/WCAG22/)
- [W3C non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)
- [Inter typeface features](https://rsms.me/inter/)
- [Noto Sans Devanagari UI specimen](https://notofonts.github.io/noto-docs/specimen/NotoSansDevanagariUI/)
- [Noto web font and script-fallback guidance](https://notofonts.github.io/noto-docs/website/use/)
