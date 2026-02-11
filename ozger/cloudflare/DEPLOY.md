# Cloudflare Workers deployment

This deploys the static frontend plus a small API layer to a stable
`*.workers.dev` URL. All API keys stay in Cloudflare environment bindings.

## Prerequisites

- Cloudflare account
- `wrangler` installed (`npm i -g wrangler`)
- API token with **Workers Scripts:Edit** and **Workers KV Storage:Read**
  (the second permission is required for static assets).

## Configure environment variables

Use values from your existing env files:
- Supabase keys: `ozgerai/.env`
- AI Teacher API keys: `ozgerai/ozger/backend/aiapi/.env` (not used by the Worker)

Set secrets once (they are stored in Cloudflare, not in git):

```
cd ozgerai/ozger
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put AI_TEACHER_API_URL
```

## Deploy

```
cd ozgerai/ozger
wrangler deploy
```

After deploy, you will receive a stable URL like:

```
https://ozger.<your-account>.workers.dev
```

This URL is static and does not require a custom domain.

## Notes

- The Worker serves static files from `frontend/`.
- API endpoints provided:
  - `GET /api/config`
  - `GET /api/rating`
  - `GET/POST /api/materials`
  - `GET/POST /api/favorites`
  - `GET/PUT /api/profile`
  - `GET /health`
- Socket.IO and AI Teacher API are not part of the Worker.
