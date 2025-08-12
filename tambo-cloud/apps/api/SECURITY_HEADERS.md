# HTTP Security Headers (Helmet)

This API registers [Helmet](https://helmetjs.github.io) globally in `src/main.ts` to send standard HTTP security headers on every response.

Enabled headers:

- X-Content-Type-Options: `nosniff`
- X-Frame-Options: `DENY` (also enforced via `frame-ancestors` in CSP)
- Content-Security-Policy (CSP): environment-specific defaults with env override support
- Strict-Transport-Security (HSTS): opt-in for production only (disabled by default)

## CSP configuration

The CSP is applied to all responses (it is primarily relevant to HTML responses like the Swagger UI). Defaults are conservative and should not interfere with API clients.

Environment selection: `DEPLOY_ENV` (falls back to `NODE_ENV`). Supported values: `development`, `staging`, `production`.

Important: Values are case‑sensitive. The service compares the raw strings exactly; for example `DEPLOY_ENV` must be `development`, `staging`, or `production` in all lowercase to match the documented environments.

Default directives per environment (can be overridden by env vars listed below):

| Directive         | development                            | staging/production         |
| ----------------- | -------------------------------------- | -------------------------- |
| `default-src`     | `'none'`                               | `'none'`                   |
| `base-uri`        | `'self'`                               | `'self'`                   |
| `object-src`      | `'none'`                               | `'none'`                   |
| `img-src`         | `'self'` `data:` `blob:`               | `'self'` `data:` `blob:`   |
| `font-src`        | `'self'` `data:`                       | `'self'` `data:`           |
| `style-src`       | `'self'` `'unsafe-inline'`             | `'self'` `'unsafe-inline'` |
| `script-src`      | `'self'`                               | `'self'`                   |
| `connect-src`     | `'self'` `http:` `https:` `ws:` `wss:` | `'self'`                   |
| `frame-ancestors` | `'none'`                               | `'none'`                   |

Override any directive via comma-separated env vars (set on the API process):

- `CSP_DEFAULT_SRC`
- `CSP_SCRIPT_SRC`
- `CSP_STYLE_SRC`
- `CSP_IMG_SRC`
- `CSP_FONT_SRC`
- `CSP_CONNECT_SRC`
- `CSP_FRAME_ANCESTORS`

Example:

```
CSP_CONNECT_SRC="'self', https://app.posthog.com"
DEPLOY_ENV=production
```

CSP keywords must be single-quoted in env values: `'self'`, `'none'`, `'unsafe-inline'`, `'unsafe-eval'`, `'strict-dynamic'`, `'report-sample'`, `'unsafe-hashes'`.

Notes:

- Swagger UI works with the defaults above. If you further restrict `style-src`, be sure to test `/api`.
- CSP on JSON responses is ignored by browsers and will not affect front‑ends calling this API.

## HSTS policy

HSTS is disabled by default and only enabled when all of the following are true:

1. `DEPLOY_ENV=production`
2. `ENABLE_HSTS=true`

Case‑sensitivity: The booleans are exact string checks. Use the literal `true` (lowercase). For example:

```
ENABLE_HSTS=true
HSTS_INCLUDE_SUBDOMAINS=true   # optional
HSTS_PRELOAD=true              # optional
```

Tunables (optional):

- `HSTS_MAX_AGE` (seconds, default `15552000` = 180 days)
- `HSTS_INCLUDE_SUBDOMAINS` (`true|false`, default `false`)
- `HSTS_PRELOAD` (`true|false`, default `false`)

When enabled, the header applies to whatever host/domain serves the API. Confirm that HTTPS is enforced on that host before turning this on.

## Open questions (please confirm)

- Exact allowed sources per environment for:
  - `script-src`, `style-src`, `img-src`, `connect-src`, `frame-ancestors`.
  - Known third‑party endpoints (analytics, auth, CDNs) that must be allowed.
- HSTS in production:
  - Should we enable it? If yes, confirm `max-age`, whether to set `includeSubDomains`, and whether to set `preload`.
  - Which production domains will serve this API (so we can assess `includeSubDomains` risk)?

Once confirmed, we will lock in the final CSP and HSTS values and remove any unnecessary allowances.
