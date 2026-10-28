# CLAUDE.md — slow garden

slow garden is a meditative daily tarot app for self-reflection. not prediction, not advice — it helps you notice what's already moving in you. one card per day, personalised to your natal chart and current astrological transits, with a short AI-generated insight and a "try this" prompt for quiet attention.

---

## philosophy

- reflection over prediction: never tell the user what will happen or what they should do
- noticing over prescribing: the "try this" action is about paying attention, not changing behaviour
- tone: lowercase, conversational, intimate — like a letter from a thoughtful friend, not a self-help app
- privacy-first: every reading, reflection and birth detail stays in localStorage.
  no accounts, no database, nothing with a name in it. but not *no servers* and not
  *no tracking* — the app calls its own API routes for readings and geocoding, and
  ships Vercel's cookieless visitor counts. `app/privacy/page.tsx` states this
  accurately and is the source of truth; when a data practice changes, it changes in
  the same commit.

---

## tech stack

- **Next.js 16** (App Router, Turbopack in dev)
- **React 18**
- **TypeScript**
- **Tailwind CSS v3**
- **@sentry/nextjs** — error tracking, EU region, PII stripped in `lib/utils/sentry-scrub.ts`
- **@anthropic-ai/sdk** — insight generation via `claude-haiku-4-5-20251001`
- **astronomy-engine** — natal chart + transit calculations (Vedic sidereal, Lahiri ayanamsa)
- **@upstash/redis + @upstash/ratelimit** — per-IP abuse guards, set far above human
  use to bound cost (see `middleware.ts`). readings themselves are unlimited — no
  hard quota — with cost watched via a usage alert in the Anthropic console instead.
  `TarotCard.tsx` still counts reading-days client-side, but only to show a one-time
  thank-you-and-ask screen on the first day past 7, never to block a reading.
- **@vercel/analytics** — usage analytics

---

## design system

### colours
| token | hex | use |
|---|---|---|
| background | `#172211` | main app bg |
| accent | `#CEF17B` | buttons, highlights, "continue" |
| soft blue | `#E1EEFC` | secondary text, insight labels |
| white | `#FFFFFF` | card text, headings |

never use raw hex values in components — use Tailwind classes mapped to these. if a colour isn't in the design system, ask before adding it.

the table above is the app's chrome. the accent in the code is `#C9F24E` and the paper
`#F7F4E6` — the card reading page carries the full token set (see below), and the rest of
the app has drifted onto those two.

### typography
- **Instrument Serif (italic)** — the "slow garden" wordmark on the splash screen only
- **Reenie Beanie** — handwritten feel. splash and onboarding only now; it left the
  card reading page when that page moved to its own spec (see below)
- **VT323** — monospace pixel font: the year calendar view, and all machine copy
- **DM Mono** — micro-labels and list voice (`LABEL_TYPE` in `app/components/type.ts`)
- **DM Sans** — reading copy on the card page only
- **BIZ UDMincho** — body copy elsewhere in the app (`BODY_TYPE`)
- body text inherits system sans; keep it minimal

### the card reading page

`app/components/TarotCard.tsx` and `app/components/card-page/` are built to their own
spec — the design bundle's `build/SPEC.md`, with `build/card-page.html` as the reference
render. That page does not follow the palette or the faces above. Its rules:

- **three voices, strictly assigned.** VT323 for machine copy and the whole lime module,
  headline included; DM Mono for the keyword and note lists and micro-labels; DM Sans for
  the meaning copy and the textarea. Nothing else, and no handwritten face anywhere.
- **the card name is the headline** — 138px uppercase in paper white, not a lime
  handwritten sprawl.
- **every rule is dotted**, except the 2px-on-5px spine between the body columns.
- **one accent.** Lime is spent on the `>` prompts and the module ground, nothing else.
- **numbers must be real.** The margin figures are computed or omitted, never faked —
  see `lib/utils/card-readout.ts` and `lib/utils/sky.ts`.
- **nothing animates** below the card. The trailing `_` cursor is the only exception; the
  tear-off and slot reveal above it are untouched.

Its colour tokens live twice, deliberately: as `READING` in `app/components/type.ts` for
TypeScript and as custom properties in `card-page.module.css` for CSS. They are the same
table from SPEC §2 — change one, change the other.

the splash wordmark is sized on mobile from a single `--wm` unit — `min(42vw, 34dvh)`,
width-driven until the screen is too short — and in px against the 647px device-frame
screen on desktop, using the same proportions on both — keep them in sync if you change one.

### motion
- card reveal is the centrepiece animation — don't compete with it
- transitions should feel slow and intentional, not snappy
- use `transition-all duration-700` or slower as default

---

## directory structure

```
app/
  api/
    calculate-transit/   # generates AI insight + astrology data
    daily-card/          # date-seeded card selection
    geocode-check/       # birth location lookup
  components/
    TarotCard.tsx        # main card display + reveal animation
    ActiveInsight.tsx    # "what this could mean for you" section
    CardDrawer.tsx       # bottom sheet for past card details
    CardSelector.tsx     # manual card selection UI
    Onboarding.tsx       # welcome flow (name → birthdate → gesture tutorial)
    OnboardingScreens.tsx
    NotificationSettings.tsx
    YearView.tsx         # full-year calendar of all draws
    card-icons/          # SVG icon sets per arcana
  page.tsx               # root — card view + year view toggle

lib/
  data/
    tarot-deck.ts        # all 78 cards: names, meanings, keywords (~92KB)
    card-archetypes.ts   # deep interpretations per card
    insight-structure-templates.ts  # transit + insight generation templates
    house-contexts.ts    # astrological house meanings
  types/
    tarot.ts             # Suite, TarotCard, DailyReading interfaces
  utils/
    astrology-calculator.ts

public/
  cards/                 # card images
```

---

## localStorage schema

all reader data lives in localStorage — nothing is stored on a server.

the keys grew in two eras and were never unified, so there is no single prefix
to filter on — see the reset snippet in `.claude/skills/onboarding-preview.md`.

| key | type | description |
|---|---|---|
| `userName`, `userBirthdate`, `userBirthTime`, `userBirthLocation` | `string` | profile, stored as four flat keys rather than one object |
| `onboardingComplete`, `cardRevealed`, `lastDrawDate` | `string` | flow state |
| `card-[date]`, `reversed-[date]` | `string` / `boolean` | the draw for a given day |
| `reflection-[date]` | `string` | the reader's own writing for that day |
| `insight-[cardId]-[date]` | `GeneratedInsight` | cached insight per card per date |
| `slow-garden-memory` | `{ readings, memoryNotes }` | last 30 readings + 10 memoryNotes for personalisation. was `slowHourMemory` before the rename; `TarotCard.tsx` still reads the old key as a fallback so existing readers keep their notes |
| `slow-garden-personalise` | `'false'` when opted out | whether to call Claude at all |
| `slow-garden-reading-days` | `string[]` | every day a reading was generated — unbounded; used only to trigger the one-time thank-you-and-ask screen at day 8 |
| `slow-garden-use-location`, `slow-garden-here` | — | location consent + resolved place |
| `slow-garden-webview-noticed` | `'true'` | the in-app-browser notice has been dismissed |

---

## AI integration

### insight generation (`/api/calculate-transit`)

1. receives: `{ userId, birthDate, birthTime?, birthLocation?, cardId, isReversed, memoryNotes, recentCards }`
2. calculates natal chart + active transits via `astronomy-engine`
3. calls `claude-haiku-4-5-20251001` with a prompt combining card archetype + transit data + house theme + user's sun sign
4. returns `ClaudeInsight`:
   - `keyPhrase` — 3–6 word headline
   - `insight` — 2–4 sentences (the main personalised reading)
   - `action` — 1–2 sentences (noticing practice, not behaviour change)
   - `memoryNote` — private pattern note stored for future personalisation

### voice (planned — ElevenLabs)

the `insight` text (and optionally `keyPhrase`) will be voiced via ElevenLabs TTS. a play button in `ActiveInsight.tsx` triggers it on demand, never autoplay. audio URL cached alongside insight in localStorage.

**voice guidelines:**
- slow, warm, slightly intimate register — like a tarot reader, not an assistant
- voice ID and stability/similarity settings to be finalised via ElevenLabs MCP
- only `insight` text gets voiced by default — not `action` or transit details
- env var: `ELEVENLABS_API_KEY`

---

## writing tone rules

these apply to AI prompts, UI copy, and any new card meanings:

- always lowercase for UI labels and headings
- never say "you will", "you should", "you need to" — only "you might notice", "there may be"
- the card doesn't predict — it reflects something already present
- avoid self-help clichés: "lean into", "embrace", "step into your power"
- the `action` field is a noticing practice — "notice when...", "pay attention to..." — not a to-do
- keep `insight` under 60 words; it will eventually be read aloud

---

## development commands

```bash
npm run dev       # dev server on :3000 (Turbopack)
npm run build     # production build
npm run lint      # ESLint
npm run wiki      # regenerate the private card wiki into the Obsidian vault
npm test          # BROKEN — jest is scripted but not installed (issue #8)
npm run test:watch
```

work is tracked in GitHub issues and lands through pull requests — see
`CONTRIBUTING.md`. released changes go in `CHANGELOG.md`.

---

## environment variables

```
SLOW_GARDEN_ANTHROPIC_KEY  # required — Claude insight generation
UPSTASH_REDIS_REST_URL   # required — abuse guards
UPSTASH_REDIS_REST_TOKEN # required — abuse guards
ELEVENLABS_API_KEY       # planned — voice feature
```

the Anthropic var carries a `SLOW_GARDEN_` prefix, not the SDK's default
`ANTHROPIC_API_KEY` — see `.env.example`. if the Upstash pair is absent the
limiters go null and every route runs unguarded, so they are required in
production even though the app boots without them.

---

## MCP setup (for contributors)

connect these MCPs to unlock the full development workflow:

### ElevenLabs MCP
for browsing + previewing voices during voice feature development.
```
npx @elevenlabs/mcp
```
requires `ELEVENLABS_API_KEY`.

### GitHub — the `gh` CLI, not an MCP
issues, PRs and releases are managed with `gh`, which is already installed and
authed on this machine and works from Claude's sandboxed shell.
```
brew install gh && gh auth login   # if setting up elsewhere
```
note `git push` does *not* work from Claude's shell — it cannot reach the macOS
keychain. Claude commits, you push. never paste a token to work around it.

### Vercel MCP
for deployment previews, build logs, and env var management.
```
npx @vercel/mcp-adapter
```
requires a Vercel token.

---

## community notes

- skills live in `.claude/skills/` — portable, no secrets
- hooks live in `.claude/settings.local.json` — not committed, configure locally
- MCP credentials are personal — see MCP setup above
- the tarot deck (`lib/data/tarot-deck.ts`) always has exactly 78 cards — don't add or remove entries without a card count check
- astrology uses Vedic sidereal (Lahiri ayanamsa), not Western tropical — this is intentional
