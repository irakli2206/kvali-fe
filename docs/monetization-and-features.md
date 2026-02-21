# Monetization & feature strategy

**Context:** Dodo Payments pending; Python backend (raw DNA → G25) not yet deployed. Use this window to ship frontend features that create habit, prove value, and set up clear free vs paid when you go live.

---

## Positioning

- **Free tier:** “Explore the map, calculate distances, try the tool.” Goal: usage, return visits, and intent. Should feel generous so people get hooked.
- **Paid:** “Save, share, export, and (later) get your own G25.” Goal: clear upgrade reason at the moment they feel the value.

---

## Recommended free-tier features (ship first)

These maximize engagement and set up conversion later. No payment required.

| Feature | Why |
|--------|-----|
| **Share this view** | One-click link that encodes current map state (time range, selected sample, filters). Viral, no account needed. “Send this to a friend.” |
| **One saved session (localStorage)** | Let them save one “workspace” (time range + selected sample + distance results). They come back; “Save more” becomes a paid upsell later. |
| **Demo / try with presets** | A few preset “example” ancient samples they can “try G25 with” (distances, map) without uploading DNA. Shows the magic before backend is live. |
| **Export closest matches (limited)** | Free: “Copy top 10” or “Download top 10 as CSV.” Paid: full export, PDF report, or unlimited. |

---

## Paid options (when Dodo + backend are live)

Design the product so these feel like natural upgrades, not a separate product.

| Offer | Type | Trigger |
|-------|------|--------|
| **Unlock G25 for your DNA** | One-time per kit | After they’ve played with the map and want their own coordinates. |
| **More saved sessions + cloud sync** | Subscription | When they hit the “one free session” limit or want access on another device. |
| *(Export is free; no paywall.)* | — | — |
| **Unlimited distance runs / no daily cap** | Subscription | If you add a soft cap on free (e.g. 3 runs/day); power users upgrade. |

---

## Feature ideas (prioritized for “killer” impact)

### 1. Share this view (free) — **do first**

- **What:** Button “Share” that copies a URL with query params (e.g. time range, selected sample id, lat/lng/zoom).
- **Why:** Zero-friction viral loop; every shared link is a new visitor. No backend required (or optional: short slug → params via API later).
- **Sales angle:** “Share your exploration” on the map or in the distance legend.

### 2. Saved session / workspace (free: 1, paid: more + cloud)

- **What:** “Save current view” (filters, selected sample, distance results). Restore from a list. Free: one slot in localStorage. Paid: multiple + sync across devices (needs backend).
- **Why:** Brings people back; “your workspace” creates ownership. Paid upgrade is obvious when they want a second session.
- **Sales angle:** “Save your session” → “Upgrade to save unlimited and sync across devices.”


- **What:** 3–5 preset ancient samples (with fake or public G25). User picks one and sees “your closest matches” and map highlight without uploading DNA.
- **Why:** Demonstrates the full flow before backend exists; when “Upload your DNA” goes live, they already know what they’ll get.
- **Sales angle:** CTA: “This is what you get with your own data — upload when ready.”

### 4. Export results (all free)

- **What:** After “Calculate distances”: “Copy top 10” or “Download top 10 CSV”; all free, no gating.
- **Why:** Immediate utility; trust; no paywall on export. “I need this report once.”
- **Sales angle:** “Unlock full export and a shareable report.”

### 6. Email / lead capture (free lead magnet)

- **What:** Optional: “Get your top 10 matches as a PDF” or “Understanding G25 in 5 minutes” — email required. Store in Supabase or your backend.
- **Why:** Build list for launch; when G25 backend is live, email them: “Your DNA can now be converted.”
- **Sales angle:** “Get the full report in your inbox.”

---

## Implemented

1. **Share this view** — Share button in map control bar; URL encodes time, filters, mode, selected/target sample, center, zoom. Restore on load from query params.
2. **One saved session (localStorage)** — “Save session” / “Restore” in app header; one slot, restores view and re-runs distance if a target was saved.
3. **Export** — In distance legend: Copy top 10, Download top 10 CSV, Download all CSV. All free; no gating.

---

## When Dodo + backend go live

- Gate “Upload DNA → G25” behind one-time or subscription as you prefer.
- Push “Share,” “Save session,” and “Export” in UI so every power user hits a natural paywall (more saves only; export free).

If you tell me which of these you want to build first (e.g. Share + Saved session), I can outline exact UI placement and data shape for the frontend.
