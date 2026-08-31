# Dexter — Design.md
**Version 1.0 — Strict implementation spec. Do not deviate without checking with the product owner.**

This document is the single source of truth for how Dexter looks and behaves visually. It supersedes any default styling choices, component libraries, or "best guess" design decisions. If something is not specified here, stop and ask — do not invent a new pattern.

Companion file: `dexter-design-system.css` contains the same tokens as CSS custom properties. This document is the *why* and *exact spec*; the CSS file is the *machine-readable source*. Values must match between the two at all times.

---

## 0. Non-negotiable rules

1. **Never hardcode a color, font size, spacing value, or radius.** Every value used in a screen must trace back to a token defined in Section 2. If a design need isn't covered by an existing token, that is a signal to add a token here first — not to invent a one-off value inline.
2. **Never introduce a new font.** Only `Fraunces` (display) and `Inter` (UI/body) exist in this product. No system-default fallback fonts in final screens.
3. **Never use pure black shadows or pure white (`#000000` / `#FFFFFF` as shadow color).** All shadows are tinted per Section 5.4.
4. **Never use sharp corners on interactive surfaces.** Minimum radius on any tappable element is `--radius-sm` (12px). Cards are `--radius-md` (20px) or `--radius-lg` (28px). Buttons, chips, inputs, nav are `--radius-full`.
5. **The pulse-dot signature (Section 6) appears only where Dexter is actively "present"** — the avatar, the copilot bar, and the Business Brain header. Do not decorate other elements with it; overuse kills the signature.
6. **Every screen must be reviewed against the reference patterns in Section 8 before being marked done.** If a screen doesn't resemble one of the named patterns, it's off-spec.

---

## 1. Design Philosophy

Dexter is an **AI employee**, not a scheduling tool. The visual language needs to feel like a competent, premium colleague working alongside the user — calm, confident, editorial — not like a generic SaaS analytics dashboard.

- **Warm, not corporate.** Background is warm paper (`#FBF8F2`), not stark white or cold gray.
- **Editorial confidence.** The `Fraunces` display serif appears on greetings and hero numbers to give the product a "thought-leadership" voice, matching what Dexter writes for the user.
- **Data should feel calm, not busy.** Bento cards with generous padding, soft tinted shadows, one accent color doing the "action" work (indigo) — never more than one loud color per screen.
- **The agent is visible but not intrusive.** The pulse-dot is the only recurring "AI is here" cue. No sparkle icons scattered everywhere, no gradient-text "AI magic" clichés.

---

## 2. Design Tokens

*(Full machine-readable version lives in `dexter-design-system.css`. Values here must stay in sync.)*

### 2.1 Color

| Token | Hex | Usage |
|---|---|---|
| `color-bg` | `#FBF8F2` | Screen background |
| `color-bg-alt` | `#F3EEE1` | Section background, alt rows |
| `color-surface` | `#FFFFFF` | Card surface |
| `color-surface-sunken` | `#F6F3EA` | Inputs, inset areas |
| `color-ink` | `#1C1210` | Primary text |
| `color-ink-soft` | `#5C534E` | Secondary text |
| `color-ink-faint` | `#9A928A` | Placeholder, disabled, labels |
| `color-border` | `#EAE3D4` | Hairline borders |
| `color-brand` (indigo) | `#3943B7` | Primary actions, links, AI/active states |
| `color-brand-tint` | `#E7E8FA` | Brand background wash, icon chips |
| `color-brand-strong` | `#2C3391` | Pressed/hover on brand elements |
| `color-premium` (burgundy) | `#6B2737` | Agency/premium tier dark cards |
| `color-energy` (orange) | `#E08E45` | CTA highlight, autonomous-mode-on, warnings |
| `color-positive` | `#3E8F45` (text) / `#BDF7B7` (fill) | Growth metrics, published status |
| `color-negative` | `#B23B3B` (text) / `#F6DEDE` (fill) | Failed publish, down metrics |
| `color-highlight-bg` (pale yellow) | `#F8F4A6` | Badge fills, soft attention — **fills only, never body text on white** |

Dark surface set (agency/analytics/night mode): `bg-dark #17151F`, `surface-dark #201D2C`, `ink-dark #F5F2EA`, `border-dark #34303F`.

**Rule:** exactly one accent color carries the "primary action" job per screen — indigo. Orange and burgundy are for specific semantic states (energy/CTA, premium tier), not decoration. If a screen has three different colored buttons competing for attention, that's a bug, not a design choice.

### 2.2 Typography

| Role | Font | Weight/Size/Line-height |
|---|---|---|
| Display Large | Fraunces | 700 / 40px / 1.08 |
| Display Medium | Fraunces | 600 / 32px / 1.12 |
| Display Small | Fraunces | 600 / 26px / 1.18 |
| H1 | Inter | 700 / 22px / 1.25 |
| H2 | Inter | 600 / 18px / 1.3 |
| H3 | Inter | 600 / 15px / 1.35 |
| Body | Inter | 400 / 15px / 1.55 |
| Body Small | Inter | 400 / 13px / 1.5 |
| Label (eyebrow, uppercase) | Inter | 600 / 12px / 1.3, tracking +0.06em |
| Stat number | Inter | 700 / 28px / 1.1, tabular numerals on |
| Caption | Inter | 500 / 11px / 1.4 |

**Rule:** Fraunces appears on **at most one or two elements per screen** — a greeting ("Good morning, Carles") or a hero stat. It never appears in body copy, buttons, or dense lists. If a screen has more than two Fraunces elements, that's overuse.

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

### 2.5 Shadow (always tinted with the ink color, never neutral black)
- `shadow-sm`: `0 1px 2px rgba(28,18,16,0.05)` — resting card
- `shadow-md`: `0 8px 24px -8px rgba(43,15,22,0.14), 0 1px 2px rgba(28,18,16,0.04)` — raised card, copilot bar
- `shadow-lg`: `0 20px 48px -12px rgba(43,15,22,0.20)` — bottom nav, modals, sheets

### 2.6 Motion
- `duration-fast` 150ms — button press, chip select
- `duration-base` 240ms — card transitions, sheet open
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out) everywhere. No linear or default ease.
- Respect `prefers-reduced-motion` — the pulse animation degrades to a static dot at 25% opacity.

---

## 3. Component Specifications

### 3.1 Buttons
- Primary: indigo fill, white text, full pill radius, 14px vertical / 22px horizontal padding, `H3` weight text.
- Energy: orange fill, dark ink text — reserved for "Go live" / "Enable autonomous mode" / urgent CTAs only.
- Secondary: white fill, 1px border `color-border`, ink text.
- Ghost: transparent, soft ink text, used for tertiary actions ("Skip", "Cancel").
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
- Minimum contrast ratio 4.5:1 for body text, 3:1 for large text (18px+/bold 14px+), per WCAG AA.
- Dark mode is opt-in per screen (analytics, agency/premium views) via the `[data-theme="dark"]` token override — not a global toggle applied inconsistently.

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
Structure: hero card (greeting in Fraunces + primary stat) → 2-column grid of stat cards → full-width list/timeline card below. Reference: the fintech/sales bento screenshots provided earlier in this project.

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
- Greeting: `Display Small` (Fraunces, 26px), `color-ink`, left-aligned, `space-6` top margin below icon, max 2 lines.
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
- Use Fraunces sparingly, on greetings/hero numbers only.
- Tint every shadow with ink, never neutral gray/black.
- Match the AI Chat Sheet pattern exactly for any Dexter-entry-point screen.

**Don't:**
- Don't invent new corner radii, spacing values, or colors outside Section 2.
- Don't add sparkle/robot iconography as a stand-in for the pulse-dot signature.
- Don't place text directly on raw highlight/positive fill colors — use the paired text tokens.
- Don't build a screen that doesn't map to a named pattern in Section 8.
- Don't mix chip-style topic selectors with the AI Chat Sheet pattern — that pattern uses full-width stacked pill rows, not horizontal chips (see 8.3).

---

## 10. Implementation Notes (Expo / React Native)

- Mirror every token in Section 2 into `theme.ts` with identical names — `colorBrand`, `spaceSpace5`, `radiusMd`, etc. — so the agent can't drift from the CSS source of truth.
- Load `Fraunces` and `Inter` via `@expo-google-fonts/fraunces` and `@expo-google-fonts/inter`; block render until fonts are loaded (`useFonts` + `SplashScreen.preventAutoHideAsync`).
- Use `react-native-reanimated` for the pulse-dot loop animation (opacity + scale), respecting `AccessibilityInfo.isReduceMotionEnabled()`.
- Shadows: use `shadowColor` (ink-tinted, not black) + `shadowOpacity`/`shadowRadius`/`shadowOffset` on iOS, `elevation` + a tinted overlay on Android since Android elevation shadows are always neutral gray by default.
