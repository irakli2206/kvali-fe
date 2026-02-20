This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment

For **Dodo Payments** (one-time “Put me on the map” / DNA upload):

- `DODO_API_KEY` – Dodo API key (Developer → API Keys; keep secret). Use full access for creating checkouts.
- `DODO_PRODUCT_ID` – Product ID of your one-time “DNA → G25” product (create in Dodo dashboard).
- `DODO_WEBHOOK_SECRET` – Webhook signing secret (Developer → Webhooks → create endpoint → copy secret).
- `SUPABASE_SERVICE_ROLE_KEY` – Used by the webhook to insert into `dna_entitlements` (keep secret).
- `DODO_USE_TEST` – Set to `true` for test mode (test.dodopayments.com), or omit/`false` for live.
- `DODO_CHECKOUT_REDIRECT_URL` – (Optional) Base URL for success redirect. Defaults to request origin. Use e.g. your ngrok URL in dev if needed.

Create a product in the Dodo dashboard, then set `DODO_PRODUCT_ID`. Add a webhook for `payment.succeeded` → `https://your-domain.com/api/dodo/webhook` and copy the secret into `DODO_WEBHOOK_SECRET`.

**Create `dna_entitlements` table:** Supabase Dashboard → SQL Editor → run `supabase/migrations/RUN_ME_dna_entitlements.sql` (or `supabase db push`).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
