# Dexter — Design.md

**Version 2.0 — Strict implementation spec. Dark-first premium AI. Do not deviate without checking with the product owner.**

**v1 (light monochrome) is deprecated.** Unmigrated screens still render v1 via legacy tokens in `src/theme/index.ts`; all new or touched screens must use v2 below. Do not mix v1 and v2 tokens on the same screen.

This document is the single source of truth for how Dexter looks and behaves visually. It supersedes any default styling choices, component libraries, or "best guess" design decisions. If something is not specified here, stop and ask — do not invent a new pattern.

Companion file: `dexter-design-system.css` contains the same tokens as CSS custom properties. This document is the _why_ and _exact spec_; the CSS file is the _machine-readable source_. Values must match between the two at all times.

---

## 0. Non-negotiable rules

1. **Never hardcode a color, font size, spacing value, or radius.** Every value used in a screen must trace back to a token defined in Section 2. If a design need isn't covered by an existing token, that is a signal to add a token here first — not to invent a one-off value inline.
2. **Never introduce a new font.** Only `Inter Tight` (display) and `Inter` (UI/body) exist in this product. No system-default fallback fonts in final screens.
3. **Depth comes from tonal surfaces + hairlines, never shadows.** Cards lift via the surface ladder (`canvas → surface-1 → surface-2`), separated by 1px hairlines. Drop shadows are banned on dark.
4. **Never use sharp corners on interactive surfaces.** Minimum radius on any tappable element is `--radius-sm` (12px). Cards are `--radius-md` (20px) or `--radius-lg` (28px). Buttons, chips, inputs, nav are `--radius-full`.
5. **The pulse-dot signature (Section 6) appears only where Dexter is actively "present"** — the avatar, the copilot bar, and the Business Brain header. Do not decorate other elements with it; overuse kills the signature.
6. **Every screen must be reviewed against the reference patterns in Section 8 before being marked done.** If a screen doesn't resemble one of the named patterns, it's off-spec.

---

## 1. Design Philosophy

Dexter is an **AI employee**, not a scheduling tool. The visual language is dark-first premium: a near-black canvas, tonal surfaces, one indigo accent — calm, confident, precise. Not a generic SaaS dashboard, not a neon AI cliché.

- **Dark is the real product.** The canvas is `#0B0B0C`; light mode does not exist in v2. Accent colors pop against dark; hairlines and luminance carry hierarchy.
- **Strict and professional.** A single type family (`Inter Tight` display, `Inter` body) with tight tracking on headlines. No serif, no second voice.
- **One accent, used sparingly.** Indigo `#5E6AD2` marks primary actions, focus, and the pulse-dot only. Everything else is achromatic.
- **Data should feel calm, not busy.** Tonal cards with generous padding and hairline borders; color appears only as meaning (up/down deltas, status pills).
- **The agent is visible but not intrusive.** The pulse-dot is the only recurring "AI is here" cue. No sparkles, no gradients-as-magic.

---

## 2. Design Tokens

_(Full machine-readable version lives in `dexter-design-system.css`. Values here must stay in sync.)_

### 2.1 Color (v2 — dark-first)

| Token                             | Hex                                 | Usage                                                                  |
| --------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `color-canvas`                    | `#0B0B0C`                           | Screen background (near-black, never pure `#000`)                      |
| `color-surface-1`                 | `#141416`                           | Card surface — one tonal step up                                       |
| `color-surface-2`                 | `#1C1C1F`                           | Elevated: sheets, modals, nav                                          |
| `color-surface-sunken`            | `#101013`                           | Inputs, inset wells                                                    |
| `color-ink`                       | `#F7F8F8`                           | Primary text (near-white)                                              |
| `color-ink-soft`                  | `#A7ABB3`                           | Secondary text                                                         |
| `color-ink-faint`                 | `#6E7278`                           | Placeholder, disabled, labels                                          |
| `color-hairline`                  | `#23252A`                           | 1px borders — the primary depth cue                                    |
| `color-hairline-strong`           | `#34343A`                           | Emphasis borders                                                       |
| `color-accent` (indigo)           | `#5E6AD2`                           | THE accent: primary actions, pulse-dot, focus rings                    |
| `color-accent-hover`              | `#828FFF`                           | Accent pressed/hover                                                   |
| `color-positive`                  | `#4EBE96`                           | Meaning only: up deltas, published status                              |
| `color-negative`                  | `#E5484D`                           | Meaning only: errors, failed status                                    |
| `color-warning`                   | `#FFA16C`                           | Meaning only: scheduled, caution                                       |
| `color-overlay`                   | `rgba(0,0,0,0.7)`                   | Sheet/modal backdrop                                                   |

**Rules:** one accent per screen (indigo). Chromatic colors never decorate — no tinted fills, no gradient backgrounds. Depth = tonal step + hairline, never shadow. (Full machine-readable set: `--v2-*` in `dexter-design-system.css`, `dark` in `src/theme/index.ts`.)

### 2.2 Typography (v2 — Inter only)

| Role                       | Font        | Weight/Size/Line-height               |
| -------------------------- | ----------- | ------------------------------------- |
| Display Large              | Inter Tight | 700 / 40px / 1.0, tracking -0.03em    |
| Display Medium             | Inter Tight | 600 / 32px / 1.05, tracking -0.025em  |
| Display Small              | Inter Tight | 600 / 26px / 1.1, tracking -0.02em    |
| H1                         | Inter       | 700 / 22px / 1.25, tracking -0.01em   |
| H2                         | Inter       | 600 / 18px / 1.3                      |
| H3                         | Inter       | 600 / 15px / 1.35                     |
| Body                       | Inter       | 400 / 15px / 1.55                     |
| Body Small                 | Inter       | 400 / 13px / 1.5                      |
| Label (eyebrow, uppercase) | Inter       | 600 / 12px / 1.3, tracking +0.06em    |
| Stat number                | Inter       | 700 / 28px / 1.1, tabular numerals on |
| Caption                    | Inter       | 500 / 11px / 1.4                      |

**Rule:** display face appears on at most one or two elements per screen — a greeting or hero stat. Hierarchy comes from size/weight/tracking, never a second family.

### 2.3 Spacing (4px base scale)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` px — named `space-1` through `space-10`.

Default screen padding: `space-4` (16px) horizontal, `space-6` (24px) top.
Default card padding: `space-5` (20px).
Default gap between bento cards: `space-3` (12px).

### 2.4 Radius

- `radius-sm` 12px — chips, inputs, small tappable rows
- `radius-md` 20px — standard card
- `radius-lg` 28px — hero/feature card, bottom sheets
- `radius-full` 999px — buttons, pills, nav, avatars

### 2.5 Depth (v2 — tonal surfaces, no shadows)

Shadows are banned on dark — they don't read on near-black. Hierarchy comes from the surface ladder + hairlines:

- Resting card: `surface-1` fill + 1px `hairline` border, no shadow.
- Raised card / copilot bar / sheets: `surface-2` fill + 1px `hairline` border.
- Backdrop: `overlay` wash (`rgba(0,0,0,0.7)`); the sheet itself carries no shadow.
- Legacy `shadows.*` tokens in `src/theme` are v1-only. Do not use in v2 code.

### 2.6 Motion

- `duration-fast` 150ms — button press, chip select
- `duration-base` 240ms — card transitions, sheet open
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out) everywhere. No linear or default ease.
- Respect `prefers-reduced-motion` — the pulse animation degrades to a static dot at 25% opacity.

---

## 3. Component Specifications

### 3.1 Buttons (v2)

- Primary: indigo fill, white text, full pill radius, 14px vertical / 22px horizontal padding, `H3` weight text. One per screen.
- Secondary: `surface-2` fill, 1px `hairline` border, ink text.
- Ghost: transparent, soft ink text, tertiary actions ("Skip", "Cancel").
- Destructive actions use `color-negative` text or fill — the only non-indigo chromatic button.
- Icon button: 44×44px minimum tap target, full radius.
- Press state: scale to 0.97, 150ms.

### 3.2 Cards

- Standard bento card: white surface, `radius-md`, `shadow-sm`, 1px `color-border`, `space-5` padding.
- Hero card (dashboard top, Business Brain summary): `radius-lg`, `shadow-md`, `space-6` padding.
- Premium card (agency tier): burgundy fill, off-white text (`#FFF1F2`), same radius rules.
- Cards never nest a card of the same elevation inside another — a card can contain chips, stats, and rows, not another bordered card.

### 3.3 Stat card

Structure, top to bottom: small icon chip (36×36, brand tint background) → uppercase label (`Label` token, faint ink) → big number (`Stat number` token, tabular) → small delta pill (green up / red down) + meta caption.

### 3.4 Chips, badges, status pills

- Filter chip: pill, sunken surface background, 1px border, `Caption` text, 6×12px padding.
- Active chip: filled with `color-ink`, text inverts to `color-bg`.
- Status pill (publishing queue): draft = neutral sunken, scheduled = pale-yellow fill, published = mint fill/green text, failed = red-tint fill/red text.

### 3.5 Inputs

- Standard input: sunken surface, full pill radius, 14×18px padding, focus state = 4px brand-tint ring + brand border.
- **Copilot / "Ask Dexter" bar**: see Section 8.3 — this is a distinct, more prominent pattern, not a standard input.

### 3.6 Avatar + pulse-dot

44px circle, brand-tint background, initials or icon in brand color. Pulse-dot: 13px indigo circle at bottom-right with a 2.5px surface-color ring, plus a soft expanding-opacity glow animation (1.8s loop). Only shown when Dexter is actively processing (e.g., generating a draft, running the interview, analyzing performance) — not a permanent decoration.

### 3.7 Bottom navigation

Fixed floating pill, dark ink background, `shadow-lg`, 8px internal padding, 44px circular tap targets, active item = light background chip that lifts out from the dark bar.

---

## 4. Layout System

- Mobile canvas: 430px max width (design at this width; scale down to 375px minimum).
- Bento grid: 2-column grid, `space-3` gap. Cards can span 2 columns (`span-2`) for hero/summary content.
- Bottom clearance: 96px minimum above the floating nav pill so content never sits underneath it.
- Section header pattern: title left, small brand-colored text action ("See all") right-aligned, `space-3` margin below before content starts.

---

## 5. Color & Contrast Rules

- Body text on white/paper backgrounds must be `color-ink` or `color-ink-soft` only — never place text directly on `color-highlight-bg` or raw `color-positive-bg` (mint); those are fill colors, use the paired darker text tokens (`#6B5E00` on yellow, `#3E8F45` on mint, `#8A4A15` on orange tint).
- Minimum contrast ratio 4.5:1 for body text, 3:1 for large text (18px+/bold 14px+), per WCAG AA. `ink-soft` on `surface-1` passes; `ink-faint` is for non-essential text only — never for actions or errors.
- There is no light mode in v2. Do not add one.

---

## 6. Signature Element — the Pulse

The one motif that should make every Dexter screen recognizable at a glance: a small soft-glowing indigo dot indicating the AI is actively working. It appears in exactly three places:

1. On Dexter's avatar during the interview/onboarding flow, while it's "listening" or synthesizing.
2. On the copilot send button, while a draft is generating.
3. On the Business Brain card header, when new context has just been ingested.

Do not add sparkle icons, gradient text, or robot emoji as substitute "AI" cues anywhere in the product — the pulse-dot is the only signifier, used consistently.

---

## 7. Voice & Copy Rules (applies to UI text, not just marketing copy)

- Buttons say what happens: "Publish now", "Save draft", "Connect LinkedIn" — never "Submit" or "Go".
- Empty states are an invitation to act, not an apology: "No posts scheduled yet — ask Dexter to draft one" rather than "Nothing here."
- Errors state what happened and how to fix it, in Dexter's voice, never vague: "LinkedIn couldn't verify this token — reconnect your account" not "Something went wrong."
- Action names stay identical through the whole flow: a button that says "Publish" produces a status that says "Published," never "Post live" or "Live now."

---

## 8. Reference Patterns (named, reusable screen structures)

Every screen in the app must map to one of these named patterns. If a new screen doesn't fit, define a new named pattern here before building it — don't build an unnamed one-off.

### 8.1 Bento Dashboard Pattern

Used for: Home dashboard, Analytics summary.
Structure: hero card (greeting in Inter Tight + primary stat) → 2-column grid of stat cards → full-width list/timeline card below. Reference: the fintech/sales bento screenshots provided earlier in this project.

### 8.2 Review/Detail Pattern

Used for: Business Brain review, Post/draft review, Strategy calendar detail.
Structure: header with title + overflow menu → hero content card → supporting stat row → primary + secondary action buttons pinned at the bottom.

### 8.3 AI Chat Sheet Pattern (reference: Klarna assistant screen)

Used for: Copilot drawer, onboarding interview kickoff, "Ask Dexter" entry point.

This is the most specific pattern in the app and must match this structure exactly:

```
[ X close, top right, no header title ]

        (centered icon badge — brand
         color circle, small mark)

  Large greeting line, sentence case,
  H1/Display weight, left-aligned,
  2 lines max
  ("Hi, ask me anything — from your
  content calendar to LinkedIn strategy")

  "Choose a topic"  (H3, bold, left-aligned)

  [ Full-width pill button, outlined,   ]
  [ left-aligned label, generous height ]

  [ Full-width pill button, outlined,   ]
  [ left-aligned label, generous height ]

  ...(stacked, space-3 gap between)

  --- empty scroll space ---

  [ Rounded pill input, full width,     ]
  [ placeholder "Ask Dexter anything",  ]
  [ clear/send icon right               ]

  Centered caption below input, faint ink,
  small: disclosure/status line
  (e.g. "Dexter uses your Business Brain
  to answer" instead of a legal disclaimer)
```

Exact spec, adapted from the reference screenshot:

- Icon badge: 48px circle, `color-brand` fill, white icon mark, centered horizontally, `space-7` top margin from safe area.
- Close (X): top-right, 24px icon, ink color, tappable 44×44 area.
- Greeting: `Display Small` (Inter Tight, 26px, tight tracking), `color-ink`, left-aligned, `space-6` top margin below icon, max 2 lines.
- "Choose a topic": `H3`, `space-6` top margin.
- Topic buttons: full-width, NOT chips — these are tall pill **rows**, `radius-full`, 1px `color-border`, white fill, left-aligned label at `H2` weight, ~56px height, `space-3` vertical gap between them.
- Input bar: fixed at bottom above safe area, full pill radius, 1px border, `space-4` horizontal screen margin, placeholder in `color-ink-faint`.
- Disclosure caption: `Caption` token, `color-ink-faint`, centered, max 2 lines, directly below input with `space-2` gap.

This pattern is reserved for AI-entry-point screens only — do not reuse the stacked full-width pill-row layout for settings menus or generic lists.

### 8.4 Queue/List Pattern

Used for: Publishing queue, notification feed, media library.
Structure: section header → list of rows in a single card, each row = avatar/thumbnail + title/meta + status pill, divided by 1px `color-border` hairlines (not separate cards per row).

---

## 9. Do / Don't Summary

**Do:**

- Reuse the five named patterns above for every screen.
- Keep one accent (indigo) as the "primary action" color per screen.
- Use Inter Tight sparingly, on greetings/hero numbers only.
- Carry hierarchy with tonal surfaces + hairlines, never shadows.
- Match the AI Chat Sheet pattern exactly for any Dexter-entry-point screen.

**Don't:**

- Don't invent new corner radii, spacing values, or colors outside Section 2.
- Don't add sparkle/robot iconography as a stand-in for the pulse-dot signature.
- Don't use positive/negative/warning colors decoratively — meaning only.
- Don't build a screen that doesn't map to a named pattern in Section 8.
- Don't mix v1 (light monochrome) and v2 tokens on the same screen.

---

## 10. Implementation Notes (Expo / React Native)

- Mirror every token in Section 2 into `theme.ts` with identical names — `colorBrand`, `spaceSpace5`, `radiusMd`, etc. — so the agent can't drift from the CSS source of truth.
- Load `Inter Tight` and `Inter` via `@expo-google-fonts/inter-tight` and `@expo-google-fonts/inter`; block render until fonts are loaded (`useFonts` + `SplashScreen.preventAutoHideAsync`).
- Use `react-native-reanimated` for the pulse-dot loop animation (opacity + scale), respecting `AccessibilityInfo.isReduceMotionEnabled()`.
- Shadows: use `shadowColor` (ink-tinted, not black) + `shadowOpacity`/`shadowRadius`/`shadowOffset` on iOS, `elevation` + a tinted overlay on Android since Android elevation shadows are always neutral gray by default.
- Primitives come from React Native Reusables (`src/components/rnr/`: `button`, `text`, `input`, `card`, `avatar`, `icon`), themed to the tokens in Section 2 via CSS vars in `global.css` + `tailwind.config.js`. Never use stock Reusables/zinc styling — radius stays full-pill for buttons/inputs, cards stay `radius-md` with `space-5` padding. Legacy `src/components/ui.tsx` remains for Dexter signatures only (`PulseDot`, copilot bar, bottom nav).
- Overlays require `PortalHost` in `app/_layout.tsx`. New screens prefer RNR primitives; do not add one-off `StyleSheet` buttons/inputs/cards.
