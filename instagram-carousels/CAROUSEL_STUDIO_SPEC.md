# Instagram Carousel Studio — Product Spec & Tech Direction

**Purpose:** Define the features needed for a dedicated app that designs Instagram carousels, generates images with OpenAI (ChatGPT / Images API), previews them, and publishes straight to your Instagram account.

**Related:** Brand/copy rules live in this folder (`CAROUSEL_INSTRUCTIONS.md`, topic folders like `001-2026-09-23/`). This doc is about the **software product**, not a single post brief.

**Created:** 2026-09-23

---

## 1. Goal (one sentence)

Build a small studio app where you pick a Byto carousel brief → generate slide images with AI → preview the full swipe → one click publishes the carousel to Instagram.

---

## 2. Core user flow (MVP)

```
1. Open project / pick topic (e.g. 001)
2. Load or edit slide briefs (headline, visual prompt per slide)
3. Generate images (OpenAI Images API) for all slides or one-by-one
4. Preview carousel (swipe / click through 4:5 frames)
5. Regenerate weak slides, reorder if needed
6. Connect Instagram (once)
7. Publish carousel → confirmation + link/id
```

---

## 3. Features required

### Must-have (MVP) — without these the idea doesn’t work

| # | Feature | Why |
|---|---------|-----|
| 1 | **Project / carousel workspace** | One place per carousel (name, date, 7–12 slides, status: draft / generated / published) |
| 2 | **Slide editor** | Per slide: headline, body, CTA, background mode (dark/light), **image prompt**, optional negative notes |
| 3 | **Import from MD briefs** | Read folders like `001-2026-09-23/CAROUSEL.md` (or a structured JSON export) so you don’t retype Part B |
| 4 | **OpenAI image generation** | Call Images API (e.g. `gpt-image-1` or DALL·E) with your API key; generate one image per slide at **1080×1350** (or generate square and crop — decide in implementation) |
| 5 | **Batch + single regenerate** | “Generate all” and “Regenerate this slide” with a new seed/prompt tweak |
| 6 | **Carousel preview** | On-screen Instagram-like frame: dots, next/prev, mobile width simulation, logo overlay check |
| 7 | **Asset library** | Store generated PNGs locally or in cloud storage; version history for regenerations |
| 8 | **Brand kit presets** | Locked palette, logo overlay option, font guidance from `CAROUSEL_INSTRUCTIONS.md` (even if text is baked into the image) |
| 9 | **Secrets management** | Secure storage for `OPENAI_API_KEY` and Meta/Instagram tokens — never commit keys to git |
| 10 | **Instagram OAuth connect** | “Connect Instagram” → Meta Login → store long-lived token for a **Business/Creator** IG account |
| 11 | **Publish to Instagram** | Create media containers for each slide → create carousel container → publish via Instagram Graph API |
| 12 | **Publish status UI** | Button states: idle → uploading → publishing → success / error; show IG media id |
| 13 | **Caption + hashtags field** | Caption from brief; editable before publish (Graph API publish supports caption on the carousel) |

### Should-have (soon after MVP)

| # | Feature | Why |
|---|---------|-----|
| 14 | **Copy generation with ChatGPT** | Use Chat Completions / Responses API to draft headlines + prompts from `TOPICS.md` / instructions |
| 15 | **Prompt templates** | Locked Byto style block prepended to every image prompt (colors, statue×tech, no purple/lime) |
| 16 | **Text overlay engine** | Optional: generate background-only with AI, then composite logo + headline in code (sharper text than pure AI type) |
| 17 | **Manual upload / replace** | Drop your own image onto a slide if AI fails |
| 18 | **Reorder slides** | Drag-and-drop before publish |
| 19 | **Export zip** | Download all frames for manual posting backup |
| 20 | **Publish log** | History: date, topic, IG id, caption used |

### Nice-to-have (later)

| # | Feature | Why |
|---|---------|-----|
| 21 | Scheduling | Publish at a future time (needs queue worker + Meta constraints) |
| 22 | Multi-account | Agency mode |
| 23 | Analytics pull | Impressions / saves after post |
| 24 | Figma export | Send frames to design review |
| 25 | Approval / stripe | If you productize the studio |

---

## 4. External services & accounts you need

### OpenAI (image + optional copy)
- Account + **API key** (what you called ChatGPT API key)
- **Images API** for slide art
- **Chat / Responses API** (optional) for writing slide copy and improving prompts
- Billing enabled; image gen is paid per image

### Meta / Instagram (publish)
Official posting is **not** “paste password into the app.” You need:

1. Instagram account type: **Business** or **Creator** (not pure personal)
2. Facebook **Page** linked to that Instagram account
3. Meta Developer App with **Instagram Graph API**
4. Permissions typically including:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - (and related Page/IG permissions Meta requires at review time)
5. For production posting beyond testers: **App Review** by Meta
6. Images must be reachable via **public HTTPS URLs** when using Graph API container creation (so you need temporary public storage or a signed URL host — see architecture)

**Hard constraint:** Personal Instagram accounts cannot use Content Publishing API. Plan on a Business/Creator professional account.

---

## 5. Architecture (logical pieces)

```
┌─────────────────────────────────────────────┐
│  Studio UI (preview, editor, publish btn)   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  App backend (API routes / server)          │
│  - hide OpenAI + Meta secrets               │
│  - generate images                          │
│  - upload frames to temp public storage     │
│  - call Instagram Content Publishing API    │
└───────┬─────────────────────┬───────────────┘
        │                     │
        ▼                     ▼
   OpenAI Images         Meta Graph API
   (+ optional Chat)     (OAuth + publish)
        │
        ▼
   Object storage (S3 / R2 / Supabase Storage / Vercel Blob)
   — public or signed URLs for IG to fetch each slide
```

**Why a backend is required:**  
Browser-only apps would expose your OpenAI key and struggle with Instagram OAuth + token storage + public image URLs. A thin server (or serverless functions) is mandatory for a serious publish button.

---

## 6. Publish pipeline (feature detail)

Instagram carousel publish roughly means:

1. For each slide image → create an **item container** (`is_carousel_item=true`) with image URL  
2. Create a **carousel container** with the list of item container IDs + caption  
3. **Publish** the carousel container  
4. Poll status until finished (Meta is async)

Studio UI features that support this:

- Preflight check: connected account? enough slides (2–10 is IG’s usual carousel range — **confirm current Meta limit**; design for **max 10** if IG caps at 10, and split 12-slide brand decks or drop 2 slides for feed)  
- Progress bar per container  
- Failure retry per slide URL  

> **Important product note:** Instagram feed carousels are often limited to **10 images**. Your brand briefs use 12 slides. MVP must either (a) support 10 and mark 2 as “stories-only / export-only”, or (b) offer a “condense to 10” mode. Call this out in the UI.

---

## 7. Preview features (feature detail)

- Phone-frame or clean 4:5 stage  
- Swipe / arrow navigation  
- Slide index `3 / 12`  
- Toggle “show safe margins”  
- Toggle “simulate IG compression” (optional)  
- Side list thumbnails to jump slides  
- Diff view: prompt vs last generated image  

---

## 8. Security & ops features

- Env-based secrets (`.env.local`, never in repo)  
- Encrypt refresh tokens at rest if multi-user later  
- Rate-limit generate + publish buttons  
- Cost guard: confirm before “generate all” (shows estimated OpenAI cost)  
- Audit log for publishes  

---

## 9. Suggested MVP scope (build this first)

Ship a usable v1 with only:

1. Carousel project with N slides (start from Topic 001 JSON/MD)  
2. Prompt per slide + Byto style prefix  
3. Generate / regenerate via OpenAI Images  
4. Preview  
5. Caption field  
6. Connect IG Business  
7. Publish carousel (respecting IG max slide count)  
8. Success/error toast + publish log  

Defer: scheduling, analytics, multi-account, fancy text compositor (can add as v1.5 if AI text looks soft).

---

## 10. Language & stack recommendation

### Recommendation: **TypeScript + Next.js (App Router)**

| Layer | Choice | Why it fits this project |
|-------|--------|---------------------------|
| Language | **TypeScript** | One language for UI + API; safest for OAuth, JSON, Meta payloads |
| Framework | **Next.js** | Preview UI + server routes for OpenAI/Meta keys in one repo |
| UI | React + simple CSS (or Tailwind) | Carousel preview is UI-heavy; React is natural |
| DB (light) | SQLite / Supabase / Postgres | Projects, slide URLs, tokens, publish log |
| Storage | Vercel Blob / Cloudflare R2 / S3 / Supabase Storage | Public HTTPS URLs Instagram can fetch |
| Auth (studio) | Simple password or Clerk later | You alone at first is fine |
| Deploy | Vercel or similar | Fast path for webhooks/OAuth callbacks |

**Why not “only ChatGPT in the browser”?** Keys leak, and Instagram publish needs a server.

**Why not Python-first for the whole product?**  
Python (FastAPI) is excellent for AI scripts, but you still need a strong web UI for preview + OAuth. You’d end up with **Python API + React frontend** = two languages. Next.js keeps **one stack** and reaches the goal with less glue.

**When Python is a good add-on:**  
A small Python worker later for batch prompt experiments — optional, not required for MVP.

### Alternative (if you want the fastest ugly prototype)

- **Python + Streamlit** or **Gradio** for generate + preview  
- Publish via a script using Meta API  

Good for testing prompts; weak for a polished “studio + publish button” product. Prefer Next.js if the Instagram publish button is a real goal.

### Languages to avoid as the main app

- Pure no-code (Zapier-only): fragile for carousel containers + preview  
- PHP monolith unless you already live in WordPress  
- Mobile-only (Swift/Kotlin) for v1: slower to iterate on OAuth + file pipelines  

---

## 11. “Perfect and easy” path (practical)

1. **Language/framework:** TypeScript + Next.js  
2. **Images:** OpenAI Images API with your existing API key  
3. **Copy (optional):** OpenAI Chat/Responses using the same key  
4. **Hosting images for IG:** Cloudflare R2 or Vercel Blob  
5. **Publish:** Instagram Graph API Content Publishing (Business/Creator account)  
6. **Content source:** Reuse `instagram-carousels/` MD briefs → structured slide JSON inside the app  

This combo is the shortest route to: *generate → preview → publish*.

---

## 12. Feature checklist (print / track)

### MVP
- [ ] Carousel project CRUD  
- [ ] Slide fields (copy + image prompt)  
- [ ] Import from topic folder / JSON  
- [ ] OpenAI image generate (single + batch)  
- [ ] Asset storage + versions  
- [ ] Carousel preview (4:5)  
- [ ] Caption editor  
- [ ] Meta OAuth (IG Business/Creator)  
- [ ] Temp public URLs for frames  
- [ ] Create carousel containers + publish  
- [ ] Publish status + error handling  
- [ ] Secrets via env  
- [ ] Handle IG max images (≤10) vs 12-slide briefs  

### v1.1
- [ ] ChatGPT copy/prompt assist  
- [ ] Brand prompt template lock  
- [ ] Manual image replace  
- [ ] Reorder slides  
- [ ] Export ZIP  
- [ ] Publish history  

### Later
- [ ] Schedule  
- [ ] Analytics  
- [ ] Text compositing layer  
- [ ] Multi-account  

---

## 13. Open decisions (answer before coding)

1. **Solo tool or multi-user?** (Solo → simpler auth)  
2. **Bake text into AI images, or composite text in code?** (Composite = sharper type; more build work)  
3. **12-slide brand decks vs IG 10-slide cap** — condense rules?  
4. **Where to host?** (affects OAuth redirect URLs and blob storage)  
5. **Instagram account ready as Business/Creator + Page linked?**  

---

## 14. Verdict

| Question | Answer |
|----------|--------|
| What product is this? | **Instagram Carousel Studio** — brief → AI images → preview → publish |
| Features that matter most | Slide workspace, OpenAI generate, preview, Meta OAuth, Graph publish, secure keys, public image URLs |
| Language to reach the goal easily | **TypeScript** |
| Framework | **Next.js** (UI + API together) |
| AI | OpenAI Images (+ optional Chat) with your API key |
| Publish | Instagram Graph API on a Business/Creator account |

---

*Next step when you’re ready: scaffold a new repo/app (separate from the marketing site) named e.g. `carousel-studio`, wire OpenAI generate + preview first, then Meta publish.*
