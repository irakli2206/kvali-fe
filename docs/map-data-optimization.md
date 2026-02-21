# Map data optimization: static export vs compressed RPC

## Option 2: Static / build-time export (implemented)

**Idea:** Export map samples to a static file (e.g. in `public/` or to a CDN) at build time or via a cron job. The client fetches from that URL instead of calling Supabase. **Supabase egress = once per export** (e.g. once per day or per build), not per user.

### Flow

1. **Export step** (build or cron):
   - Run a script or API route that fetches from Supabase (same query as today).
   - Write result to a file: `public/data/map-samples.json` (or upload to Vercel Blob / S3 and store the URL in env).
2. **Client:**
   - Instead of calling the `getMapSamples` server action, fetch from the static URL (e.g. `/data/map-samples.json` or `process.env.NEXT_PUBLIC_MAP_SAMPLES_URL`).
   - Same parsing and cache (React Query) as today; only the data source changes.

### Implementation

- **Script:** `scripts/export-map-samples.mjs` – run `npm run export-map-samples` (uses `.env.local`). Writes `public/data/map-samples.json`.
- **App:** Set `NEXT_PUBLIC_USE_STATIC_MAP_SAMPLES=true`; `useMapSamples` then fetches `/data/map-samples.json` (no Supabase egress). File is in `.gitignore`; run export in CI or before deploy when using static mode.

### Implementation outline (original)

- **Build-time:** Add a script `scripts/export-map-samples.mjs` (or `.ts` run with ts-node) that uses `@supabase/supabase-js` with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, runs the same select, writes JSON to `public/data/map-samples.json`. Run it in `package.json` `prebuild` or `postbuild`, or manually before deploy.
- **Cron (e.g. Vercel):** Use a cron job that hits an API route (or server action) that fetches from Supabase and uploads to Vercel Blob; update an env or a small “manifest” file with the new URL. App reads the manifest or a fixed env to get the current URL.
- **App:** Add a data source layer: e.g. `NEXT_PUBLIC_MAP_SAMPLES_SOURCE=static` and `NEXT_PUBLIC_MAP_SAMPLES_URL=/data/map-samples.json`. In `useMapSamples`, if those are set, `fetch(MAP_SAMPLES_URL)` and parse JSON; otherwise call `getMapSamples()` as today.

### Trade-offs

- **Freshness:** Data is as fresh as the last export. Fine if map data updates daily or less.
- **Deploy:** Build-time export means every deploy gets a new snapshot. Cron means you can refresh without redeploying.

---

## Option 4: Database RPC that returns compressed/binary

**Idea:** A Postgres function runs the same query and returns the result in a compressed (or compact binary) form. The client receives fewer bytes from Supabase, so **egress is lower** (Supabase bills on bytes transferred).

### A. Compressed RPC (Postgres `compress()`)

- Postgres has `pg_catalog.compress(data bytea, type text)` – compresses using the same LZ algorithm as `bytea` large objects.
- Create a function that:
  - Selects the same columns from `dna` (where `g25_string IS NOT NULL`, limit 20000).
  - Aggregates to one value (e.g. `json_agg(row_to_json(t))::text`), then `convert_to(..., 'UTF8')` to get bytea, then `compress(...)`.
  - Returns the compressed `bytea`.
- Supabase RPC returns that bytea (PostgREST typically base64-encodes it in JSON: `{"result": "<base64>"}`).
- Client: base64-decode → decompress. **Catch:** Postgres `compress()` uses a specific LZ format; you need a JS decompressor that matches. Libraries like `lz-string` may not match. So you may need to use an extension (e.g. `pg_read_binary_file` + external gzip) or a different approach.

**Simpler alternative:** Use an **Edge/API route** that calls Supabase (normal JSON/CSV), then compresses with gzip and sends to the client. That **does not** reduce Supabase egress (your server still pulls full size from Supabase), but it reduces client↔your-server transfer. To reduce Supabase egress, compression must happen **inside** Supabase (e.g. RPC returning compressed bytea with a format you can decompress in JS).

### B. Compact binary RPC (no compression, smaller than JSON/CSV)

- Postgres function that builds a binary blob: e.g. for each row, write fixed-width id (16 bytes UUID or 36 bytes hex), 8-byte double lat, 8-byte double lng, then length-prefixed strings for culture, country, y_haplo, mean_bp, object_id.
- Return that as `bytea`. Client decodes: read 16+8+8 bytes per row, then length-prefixed strings. No compression, but binary is much smaller than CSV/JSON (no repeated keys, no commas/quotes).
- Egress = size of that bytea. Typically 30–50% smaller than CSV for the same rows.

### Implementation outline (compact binary RPC)

1. **Postgres:** Create a function, e.g. `get_map_samples_binary()` that:
   - Loops or uses a single aggregated expression to build a bytea (e.g. with `string_agg` of raw bytes, or a custom aggregate, or return a setof bytea and aggregate in app – simpler: one row per sample, each row = one bytea; client concatenates. Or use `encode(..., 'base64')` and return a single text if Postgres is easier with text).
   - Actually building binary in Postgres is verbose. Simpler: return **rows as JSON** but with minimal keys (single-letter keys) and no spaces: `json_agg(json_build_object('i',id,'o',object_id,'a',latitude,'n',longitude,'c',culture,'y',country,'h',y_haplo,'b',mean_bp))::text`. That cuts a lot of bytes vs full column names. Then optionally compress that text in Postgres if we have a compress that’s decompressible in JS.
2. **Client:** Call `supabase.rpc('get_map_samples_binary')`, then parse the result (decode base64 if needed, then JSON parse or binary parse). Map short keys back to your app’s field names.

### Recommendation

- **Static export (2):** Easiest and biggest win for Supabase egress. Add a build or cron step + static URL and point the client at it when the env is set.
- **Compressed/binary RPC (4):** Good if you want data always fresh from the DB. Start with a **minimal JSON RPC** (short keys, no spaces) to shrink payload without dealing with binary or LZ; if that’s not enough, add a compact binary format or investigate Postgres compression + a matching JS decompressor.

If you tell me which you want first (static export vs RPC), I can outline the exact code changes (script + env + `useMapSamples` for static, or SQL + client for RPC).
