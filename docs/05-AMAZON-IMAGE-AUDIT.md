# 05 — Amazon Image Audit Skill (Spec + Kickoff)

> **Status:** Spec locked, not yet built. Session captured 21 Apr 2026.
> **References:** [`../MASTER-LOG.md`](../MASTER-LOG.md) · [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md) · [`02-ROUTING.md`](02-ROUTING.md) · [`examples/amazon-pdp.md`](../examples/amazon-pdp.md)
> **Origin:** Conversation 21 Apr 2026 — Danny exploring whether ExtractFlow can power a conference-ready SSL 2026 demo: Amazon sellers type one command, get an image audit + image regeneration recipe.

---

## NEXT SESSION KICKOFF PROMPT

> Paste the block below at the start of the next session to re-anchor without re-reading the whole spec.

```
Resume Amazon Image Audit build (ExtractFlow extension).

Context: Spec locked 21 Apr in extract-flow/docs/05-AMAZON-IMAGE-AUDIT.md.
The target is a `/amazon-image-audit <URL>` Claude Code skill that:
  1. Scrapes the PDP + top-10 SERP for the product's category
  2. Downloads all 10 main images (sharp resize to 1280px)
  3. Runs Claude Vision with a locked enum schema → JSONL
  4. Renders a one-screen audit (commonalities + gap analysis) in the terminal
  5. Interviews the seller (3 locked questions)
  6. Drafts 3 Nano Banana 2 image recipes anchored to the seller's reference image
  7. Hands off to Kie.ai NB2 on "send it"; downloads result to ./results/

Build scope (Mode 3 — 5 files, ~2 hrs):
  - scripts/serp-extract.js
  - scripts/download-images.js
  - scripts/vision-analyze.js
  - scripts/nb2-runner.js
  - .claude/skills/amazon-image-audit/SKILL.md

Start by opening the spec, reviewing the vision enum schema and interview
script, then scaffold the skill file first so we can walk the UX end-to-end
before wiring the scripts.
```

---

## Why this exists

**Audience:** Amazon sellers at SSL 2026 — many new to Claude Code.

**Their question, reframed:**

> "Why is the top product getting the click and mine isn't?"

**The insight:** Amazon customers eat with their eyes. The main image *is* the product at scroll-speed. Sellers intuit this but have no structured way to audit the top 10 in their category and reverse-engineer the visual patterns.

**What makes this a conference demo:** One command (`/amazon-image-audit <URL>`) takes a seller from question to finished image in ~5 minutes, all in the terminal. No dashboards. No SaaS. No engineering literacy required.

---

## What we already have (from today's session)

### ExtractFlow on Amazon PDP — confirmed working

Ran T2 extraction on `https://www.amazon.com/dp/B0FJN3BTPV` (Owala FreeSip 24oz). Captured:

| Field | Value |
|---|---|
| Title | Owala FreeSip Insulated Stainless Steel Water Bottle with Straw, BPA-Free, 24 Oz, Black Cherry |
| ASIN | B0FJN3BTPV |
| UPC/GTIN | 840467307102 / 00840467307102 |
| Brand | Owala |
| Material | Stainless Steel |
| Capacity | 24 fl oz |
| Dimensions | 3.24"W × 10.68"H |
| Weight | 13.44 oz |
| Colour | Black Cherry |
| Features | 5 bullets |
| Rating | 4.7 ★ (117,138 reviews) |
| BSR | #1 in Sports & Outdoors · #1 in Water Bottles |
| Breadcrumb | Sports & Outdoors › Sports & Outdoor Recreation Accessories › Sports Water Bottles |
| Availability | In Stock |
| Variants | 6 lid styles with per-variant prices |

**Geo signal discovered:** Headless Chromium ran from the UK IP (Danny's egress). Amazon.com auto-localised — prices in GBP, AmazonGlobal Shipping quote (£6.76), import charge estimate (£0.00), UK delivery date. This means any future SERP run from this machine will return UK-localised SERPs unless we proxy.

**Fields confirmed missing (not bugs — actually unavailable):**
- Item Type Keyword · SP-API only
- Product Type · SP-API only
- Sold by / Ships from · `#tabular-buybox` lazy-loads, needs a `--wait-for` flag
- Country of Origin · not on this PDP
- Date First Available · not in this detail block
- Images · T2 `extract.js` doesn't scrape image URLs by default — must add `#altImages img` / `#landingImage` selector

Raw JSON saved at `extract-flow/_captures/amazon-owala/pdp-targeted.json` (172 KB).

---

## Simulated SERP image audit — "water bottle" query

> This is a plausible simulation, **not live data**. It shows what the real pipeline will surface, for spec validation only.

### Top 10 snapshot

```
┌──────┬──────────┬────────┬──────┬──────┬───────┬──────────┐
│ rank │ bg       │ angle  │ fill │ text │ props │ packaging│
├──────┼──────────┼────────┼──────┼──────┼───────┼──────────┤
│  1   │ white    │ front  │ 70%  │ yes  │ none  │ no       │
│  2   │ white    │ 3q     │ 68%  │ yes  │ none  │ no       │
│  3   │ white    │ front  │ 72%  │ no   │ none  │ no       │ ← Owala 117k ★
│  4   │ white    │ 3q     │ 70%  │ no   │ none  │ no       │
│  5   │ white    │ front  │ 65%  │ yes  │ none  │ no       │
│  6   │ lifestyle│ 3q     │ 55%  │ no   │  2    │ no       │
│  7   │ white    │ front  │ 70%  │ no   │ none  │ no       │
│  8   │ gradient │ front  │ 60%  │ yes  │ none  │ no       │
│  9   │ white    │ 3q     │ 68%  │ no   │ none  │ yes      │
│ 10   │ white    │ front  │ 62%  │ no   │ none  │ no       │
└──────┴──────────┴────────┴──────┴──────┴───────┴──────────┘
```

### The 6 commonality checks (seller-facing)

| Check | What the top 10 show | Seller takeaway |
|---|---|---|
| **Props** | 9/10 have zero props | Cut the hand, the gym bag, the beach shot |
| **Colours** | 8/10 on pure white | Let the product's own colour be the hero |
| **Angle** | 6 front · 4 three-quarter | 3q wins if your product has a visible USP (straw, spout, texture) |
| **Fill** | Average 65–72% of frame | Below 60% = toy. Above 75% = mobile crops badly |
| **Text overlay** | 4/10 — all scale or safety | Only "24 OZ" and "BPA FREE" earn their pixels |
| **Packaging** | 1/10 (lowest reviews) | Packaging signals "new brand, unproven". Hide it. |

### The two patterns that matter

```
╔═════════════════════════════════════════════════════════════╗
║  PATTERN A — "EARNED SILENCE"          ranks 3, 4, 7, 10    ║
║  ─────────────────────────                                  ║
║  White bg · no text · no props · bottle fills 70%           ║
║  Works ONLY if you have 50,000+ reviews.                    ║
║  If you're new, copying this look buries you.               ║
╠═════════════════════════════════════════════════════════════╣
║  PATTERN B — "LOUD NEW ENTRANT"        ranks 1, 2, 5, 8     ║
║  ─────────────────────────                                  ║
║  White or colour-pop bg · scale anchor ("24 OZ") ·          ║
║  one safety badge ("BPA FREE") · no props                   ║
║  This is what you should copy if you're under 10k reviews.  ║
╚═════════════════════════════════════════════════════════════╝
```

### Seller gap analysis — the output format

```
Your image:          lifestyle bg · 3q angle · 55% fill · props=2 · no text
Cluster you're in:   C — Lifestyle Outlier (correlates with rank 6–9)
Cluster you want:    B — Loud New Entrant
Biggest gaps:        background (lifestyle → white), fill (55% → 70%),
                     missing scale anchor ("24 OZ" or "32 OZ")
```

### The trust-badge-as-physical-object trick

Top sellers embed compliance badges **inside the photo as a physical object** — a leather tag on the handle reading "LIFETIME WARRANTY", a sticker on the cap reading "BPA FREE". It's not a text overlay (which Amazon polices in some categories). It's photographed product detail. Legal. Scroll-stopping. Every recipe we draft should offer this as a variant.

---

## Architecture — end-to-end ASCII flow

```
┌──────────────────────────────────────────────────────────────────┐
│  INPUT: Amazon URL — either /dp/<ASIN> or /s?k=<query>           │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 1 — SCRAPE                (T2 · extract.js + selectors)   │
│                                                                  │
│   • T1 HTTP blocked on SERP (CAPTCHA) — skip                     │
│   • Playwright headless + scroll                                 │
│   • If /dp/ → reverse lookup to category SERP via breadcrumb     │
│   • Per-card selectors capture:                                  │
│       asin, slot_type, position, sponsored_flag,                 │
│       title, price, rating, reviews, badges, imageUrl            │
│   • Slot types: sp_top · sp_brand_banner · organic · sp_video    │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
            JSON array of cards[] with imageUrl per result
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2 — IMAGE DOWNLOAD        (download-images.js)            │
│                                                                  │
│   • Node fetch m.media-amazon.com/images/…                       │
│   • Save to  _captures/serp/<query>/<asin>_<slot>.jpg            │
│   • Resize via sharp → max 1280px (cuts vision tokens ~4×)       │
│   • Write images.manifest.json (path ↔ asin ↔ serp_meta)         │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 3 — VISION EXTRACTION     (vision-analyze.js · fan-out)   │
│                                                                  │
│   p-limit(4) concurrent calls ─┐                                 │
│                                │                                 │
│   ┌─────────────────────────┐  │  ┌──────────────────────────┐   │
│   │ Primary                 │◀─┼─▶│ Structured-output prompt │   │
│   │ Claude Vision           │  │  │ (locked enum schema)     │   │
│   │ @anthropic-ai/sdk       │  │  └──────────────────────────┘   │
│   └─────────────────────────┘  │                                 │
│   ┌─────────────────────────┐  │  Fallback routing:              │
│   │ Fallback A              │◀─┤  ─ rate-limit hit → OpenRouter  │
│   │ OpenRouter              │  │  ─ budget cap    → Kie.ai       │
│   │ (Claude / Gemini / GPT) │  │  ─ A/B model test on 10%        │
│   └─────────────────────────┘  │                                 │
│   ┌─────────────────────────┐  │                                 │
│   │ Fallback B              │◀─┘                                 │
│   │ Kie.ai  ($48 balance)   │                                    │
│   └─────────────────────────┘                                    │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 4 — JSONL WRITER         (1 line per image, append-only)  │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 5 — AUDIT + INTERVIEW   (rendered in terminal by skill)   │
│                                                                  │
│  • Render top-10 snapshot table                                  │
│  • Render commonalities table                                    │
│  • Render Pattern A / B box diagram                              │
│  • Render seller gap analysis                                    │
│  • Interview: 3 locked questions (reviews, price band, USP)      │
│  • Draft 3 image recipes anchored to reference image             │
│  • Iterate on seller feedback until "send it"                    │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 6 — NB2 RENDER           (nb2-runner.js · Kie.ai)         │
│                                                                  │
│  POST to Kie.ai with:                                            │
│    model: "nano-banana-2"                                        │
│    reference_image: seller's current main image URL              │
│    prompt: refined recipe (photograph direction, NOT product)    │
│    aspect_ratio: "1:1"  size: "2048x2048"                        │
│  Poll task → download → save to results/<asin>_<variant>.png     │
│  Auto-open in Preview                                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## The vision JSONL schema (locked enums)

> Free-form prose cannot be pivoted. Every field below must be categorical or bounded so pandas can group cleanly.

```jsonc
{
  "asin":          "B0FJN3BTPV",
  "query":         "water bottle",
  "slot_type":     "sp_top | sp_brand_banner | organic | sp_video",
  "position":      3,
  "sponsored":     true,
  "price":         22.19,
  "currency":      "GBP",
  "rating":        4.7,
  "reviews":       117138,
  "badges":        ["bestseller", "amazons_choice", "climate_pledge"],

  "image": {
    "url":         "https://m.media-amazon.com/images/I/...",
    "local":       "_captures/serp/water-bottle/B0FJN3BTPV_organic.jpg",
    "w":           1280,
    "h":           1280,
    "phash":       "f8c7e3a9b4d..."
  },

  "vision": {
    "bg_type":            "white | lifestyle | gradient | dark | colour_pop",
    "dominant_hex":       ["#RRGGBB", "#RRGGBB", "#RRGGBB"],
    "text_overlay":       "none | minimal | moderate | heavy",
    "text_content":       "24 OZ" | null,
    "human_present":      false,
    "packaging":          false,
    "props_count":        0,
    "hero_angle":         "front | three_quarter | top_down | macro",
    "lighting":           "studio | natural | dramatic",
    "infographic_blocks": 0,
    "badge_in_image":     false,
    "physical_tag_present": false,
    "physical_tag_text":  null,
    "saturation_pop":     "low | med | high",
    "product_fill_pct":   72,
    "category_hint":      "insulated_bottle"
  }
}
```

### Why physical_tag_present + physical_tag_text exist

Captures the "trust-badge-as-object" trick separately from `text_overlay`. A leather tag photographed on the product is **physical**, not an overlay — Amazon treats them differently, so the analysis has to.

---

## The seller UX walkthrough

### Install (one-time, day before conference, ~5 min)

```bash
git clone https://github.com/sellersessions/extract-flow
cd extract-flow
npm install && pip install -r requirements.txt
cp .env.example .env   # paste ANTHROPIC_API_KEY and KIE_API_KEY
claude                 # opens Claude Code in this folder
```

### Day of — one command

```
> /amazon-image-audit https://www.amazon.com/dp/B0FJN3BTPV
```

### Terminal output (simulated)

```
┌──────────────────────────────────────────────────────────┐
│  AMAZON IMAGE AUDIT                                      │
│  ASIN: B0FJN3BTPV · Owala FreeSip 24oz · Black Cherry    │
└──────────────────────────────────────────────────────────┘

[1/5] Scraping PDP…………………………… ✓  (2.1s)
[2/5] Reverse-lookup category SERP… ✓  ("water bottle", 10 results)
[3/5] Downloading main images…………… ✓  (10 images, 4.3 MB)
[4/5] Vision analysis via Claude…… ✓  (14.2s)
[5/5] Rendering audit………………………… ✓

  ▼ Audit renders the top-10 table, commonalities, Patterns A/B,  ▼
  ▼ and the seller gap analysis                                   ▼

──────────────────────────────────────────────────────────────
Claude: Before I draft image recipes, I need 3 things from you:
──────────────────────────────────────────────────────────────
  1. Current review count?
  2. Price vs category average (below / at / above)?
  3. One-line USP a shopper wouldn't know from the thumbnail alone?
```

### Interview loop

```
Seller: 4,200 reviews · priced above average · USP is the lock on the lid

Claude: Got it. You're in Cluster C (lifestyle outlier) trying to
        climb to Cluster B (loud new entrant). Here are 3 recipes.
        Say "tweak v2 to be more premium" or "go" to send v1.

  ─── RECIPE 1 ────────────────────────────────────────
  White bg · front-on · 72% fill · "24 OZ" scale anchor
  bottom-left · small "LOCK-LID" pill top-right…

  ─── RECIPE 2 ────────────────────────────────────────
  White bg · 3-quarter · straw and lid-lock both visible…

  ─── RECIPE 3 ────────────────────────────────────────
  Cream bg · leather tag on carry-loop reading "LOCK-LID"
  (photographed as a real object, not a text overlay)…

Seller: I like 3 but use deep navy tag not brown leather

Claude: [updates recipe 3] Ready to send to Nano Banana 2?

Seller: send it

→ Posting to Kie.ai (nano-banana-2)……………… task 7f3a1c9b
→ Polling…………………………………………………………………… 00:28s
→ Downloaded: results/B0FJN3BTPV_v3_navy_tag.png (2048²)
→ Estimated cost: $0.11  ·  Balance remaining: $48.67
```

---

## The NB2 prompt rules (hard rules, non-negotiable)

> These are pulled from prior burned-twice lessons and existing DesignLoop creative rules.

1. **Anchor first, subject second.** Lead every prompt with *"Use input image as source of truth — this is a retouching and restaging task, not a generation task."*
2. **Brand/product description is the reference image's job.** Prompts must NEVER describe bottle material, colour, transparency, cap style, dimensions, label, or logo.
3. **Prompts describe the PHOTOGRAPH.** Composition, lighting, angle, background, overlay, mood. Not the product.
4. **Negative prompts lock integrity.** Every prompt ships with a negative that pins label, logo, colour, and cap geometry.
5. **Reference model:** `nano-banana-2` via Kie.ai. Not Nano Banana Pro. Not Ideogram. Not Flux.

### Example JSONL line (Owala, Pattern B variant)

```jsonl
{"variant_id":"owala_v2_scale_anchor_loud","hypothesis":"H2 — new-SKU loud look","reference_image":"<seller main image URL>","model":"nano-banana-2","provider":"kie.ai","aspect_ratio":"1:1","size":"2048x2048","prompt":"Use input image as source of truth — retouching/restaging only, do not redraw the bottle. Restage on soft radial colour-pop background in coral-to-cherry gradient (#F9D4CC → #8B1E3F). Add bottom-left overlay '24 OZ' in heavy condensed sans-serif, #111111, ~15% frame height. Add top-right seal overlay '24 HR COLD' same type family, ~8% height, near-black on cream pill. Studio key light 45°, subtle rim. No hands, no props. 1:1, bottle centred ~65% frame vertical.","negative_prompt":"hands, faces, outdoor, altered label, altered logo, cluttered props, white background, washed-out colour","batch_role":"hypothesis_H2"}
```

---

## Dependencies

### Already have

| Layer | Source |
|---|---|
| ExtractFlow repo + PDP scripts | `extract-flow/` |
| Playwright + Chromium | `.claude/node_modules/` |
| Claude Vision (Anthropic SDK) | `ANTHROPIC_API_KEY` in env |
| Kie.ai NB2 balance | ~$48 remaining (topped up 10 Mar) |
| Reference-image prompt rule | Memory (burned-twice lesson) |
| NB2 via Kie.ai workflow | Confirmed working (DesignLoop session) |

### New to add

| Item | Type | Notes |
|---|---|---|
| `@anthropic-ai/sdk` | npm | Claude Vision direct |
| `openai` | npm | OpenRouter / Kie.ai OpenAI-compatible base URL |
| `p-limit` | npm | Bounded concurrency for vision fan-out |
| `sharp` | npm | Image resize to 1280px |
| `OPENROUTER_API_KEY` | env | Fallback vision provider |
| `KIE_API_KEY` | env | NB2 render |

---

## Scripts to build (Mode 3 — 5 files, ~2 hrs)

```
extract-flow/scripts/
  serp-extract.js        ← wraps extract.js with Amazon SERP selectors
  download-images.js     ← manifest + sharp resize to 1280px
  vision-analyze.js      ← fan-out, locked enum schema → JSONL
  nb2-runner.js          ← Kie.ai NB2 POST + poll + download

.claude/skills/amazon-image-audit/
  SKILL.md               ← orchestrator (~150 lines), 5 stages + interview
```

Each script is a black box per ExtractFlow convention: JSON in, JSON out, `--help` documents flags, 50 KB output cap.

### Interview script (goes in SKILL.md)

```
Q1. Current review count? (gates Pattern A vs B recommendation)
Q2. Price vs category average: below / at / above? (shapes positioning tone)
Q3. One-line USP a shopper wouldn't know from the thumbnail? (seeds recipe 2 & 3)
```

3 questions, locked. No free-form "tell me about your brand" — keeps the conference demo tight and repeatable.

---

## Plan card

- **Proceed** — scaffold the skill + 4 scripts next session. Plan file lives at `ClaudeFlow-Agent/plans/extract-flow-amazon-image-audit.plan.md` (to create on kickoff).
- **Change spec** — e.g. stop at "recipe drafted" and let seller run NB2 themselves. Skip the Kie.ai integration.
- **More detail** — draft the `SKILL.md` markdown in the next session before any scripts, so the interview UX is reviewable on paper first.

---

## References

- [`../MASTER-LOG.md`](../MASTER-LOG.md) — ExtractFlow master log (session entry will be added on session close)
- [`../README.md`](../README.md) — ExtractFlow overview + cascade model
- [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md) — 4-tier architecture
- [`02-ROUTING.md`](02-ROUTING.md) — Tier selection decision tree
- [`../examples/amazon-pdp.md`](../examples/amazon-pdp.md) — PDP extraction walkthrough
- `_captures/amazon-owala/pdp-targeted.json` — today's Owala capture (172 KB)
- Memory: `project_web_extraction_stack.md` · `patterns/recurring_pattern` (NB2 via Kie.ai) · `creative_rules` (photograph-not-product rule)






