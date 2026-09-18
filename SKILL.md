---
name: agent-security
title: "Supabase + Next.js Security Guard"
description: >
  Security skill for AI coding agents working with Supabase and Next.js — prevents common security mistakes before they ship: enforces Content-Security-Policy (CSP), HttpOnly on PKCE & auth cookies, stripping Google OAuth provider_token, API rate limiting, no unencrypted PII in localStorage, RLS verification, standard security headers (HSTS preload, X-Frame-Options, X-Content-Type-Options, Permissions-Policy), and security.txt. Use when writing or modifying authentication flows, Supabase client configuration, Next.js headers or middleware, API routes, or user sessions.
summary: "Security skill for AI coding agents working with Supabase and Next.js — prevents common security mistakes before they ship"
read_when:
  - Writing or modifying authentication flows
  - Setting up or modifying Supabase client configuration
  - Configuring Next.js headers, middleware, or security policies
  - Building API routes or server actions
  - Handling user sessions, cookies, or OAuth callbacks
  - Deploying to Vercel or Cloudflare
---

# Supabase + Next.js Security Guard

You are a security-first code reviewer. Before writing or approving any code in a Supabase + Next.js project, run through every item in this skill. These are not suggestions — they are minimum standards derived from real penetration testing. Skipping any item creates exploitable vulnerabilities.

## Core Principle

**Defense in depth.** No single control is sufficient. CSP blocks execution, HttpOnly blocks reading, and provider_token stripping limits blast radius. All three together eliminate the XSS-to-account-takeover chain. Never deploy with only one layer.

---

## MANDATORY: Pre-Flight Security Checklist

Before writing ANY code that touches auth, cookies, headers, or API routes, verify all of the following:

### 1. Content-Security-Policy (CSP) — CRITICAL

**Rule:** Every Next.js project MUST have a Content-Security-Policy header. No exceptions.

**Correct pattern (next.config.js):**
```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Content-Security-Policy-Report-Only',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://apis.google.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https:",
        "connect-src 'self' https://*.supabase.co https://*.sentry.io https://accounts.google.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self' https://accounts.google.com",
        "upgrade-insecure-requests"
      ].join('; ')
    }]
  }]
}
```

**Phase 1:** Deploy as `Content-Security-Policy-Report-Only`.
**Phase 2:** After 1-2 weeks with no violations, switch to `Content-Security-Policy` (enforcing).

**NEVER do this:**
- Ship without any CSP header
- Use `Content-Security-Policy` with `default-src *`
- Skip `frame-ancestors 'none'` (allows clickjacking)
- Forget `connect-src` (allows data exfiltration via XSS)

### 2. Supabase Auth Cookies MUST Be HttpOnly — CRITICAL

**Rule:** All Supabase auth cookies (`sb-*-auth-token.*`, `sb-*-flows-*-code-verifier`) MUST have `httpOnly: true`. JavaScript must NEVER be able to read session tokens via `document.cookie`.

**Correct pattern (server client + middleware):**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, {
            ...options,
            httpOnly: true,    // MANDATORY
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', {
            ...options,
            httpOnly: true,    // MANDATORY
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
          })
        },
      },
    }
  )
}
```

**Same pattern in middleware.ts:**
```typescript
// The middleware cookie set/remove MUST also include httpOnly: true
// @supabase/ssr middleware handles session refresh — make sure
// the response cookies also have httpOnly set
set(name, value, options) {
  request.cookies.set({ name, value, ...options })
  response.cookies.set({
    name, value, ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}
```

**NEVER do this:**
- Leave auth cookies without `httpOnly: true` (default @supabase/ssr behavior is NOT HttpOnly)
- Store JWT, refresh_token, or provider_token in localStorage or sessionStorage
- Access auth tokens via `document.cookie` in client-side code

**If the app needs client-side authenticated data:** Route through your own API endpoints or Server Components — never call Supabase directly from the browser with the raw token.

### 3. Strip Google OAuth provider_token — HIGH

**Rule:** When using Google OAuth with Supabase, the `provider_token` (a `ya29...` Google access token) MUST be stripped from the session before it's stored in the client-accessible cookie.

**Correct pattern (auth callback):**
```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const providerToken = data.session.provider_token
      const res = NextResponse.redirect(requestUrl.origin + next)

      if (providerToken) {
        // Store in a SEPARATE HttpOnly cookie for server-side use only
        res.cookies.set('google-provider-token', providerToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 3600,
        })
        // Remove from the session blob so it's NOT in the client-readable cookie
        delete data.session.provider_token
        await supabase.auth.setSession(data.session)
      }
      return res
    }
  }
  return NextResponse.redirect(requestUrl.origin + '/auth/auth-code-error')
}
```

**NEVER do this:**
- Leave `provider_token` in the session blob that gets stored in cookies
- Store `provider_token` in localStorage or sessionStorage
- Pass `provider_token` to any client-side code

### 4. Security Headers — ALL of these MUST be present

Every response MUST include ALL of the following headers. No exceptions:

| Header | Value | Why |
|--------|-------|-----|
| `Content-Security-Policy` | (see #1 above) | Blocks XSS execution and data exfiltration |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-sniffing attacks |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Prevents URL leakage via Referer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Restricts browser API access |

**Also in next.config.js:**
```javascript
module.exports = {
  poweredByHeader: false,  // Remove "X-Powered-By: Next.js"
}
```

### 5. CORS — NEVER Use Wildcard on Auth Endpoints

**Rule:** NEVER set `Access-Control-Allow-Origin: *` on any route. If cross-origin is needed, specify the exact origin.

```javascript
// CORRECT
{ key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' }

// WRONG — allows any website to read responses
{ key: 'Access-Control-Allow-Origin', value: '*' }
```

### 6. RLS (Row-Level Security) — MUST Be Verified

**Rule:** Every Supabase table accessible via the anon key MUST have RLS enabled. Verify by testing direct access without auth:

```bash
# This MUST return 401 or empty array:
curl https://your-project.supabase.co/rest/v1/your_table?select=*&limit=1
```

If it returns data, RLS is misconfigured. Fix the Supabase dashboard policies immediately.

### 7. Rate Limiting — MUST Be Present on API Routes

**Rule:** All API routes and authenticated endpoints MUST have rate limiting.

```typescript
// middleware.ts — simple in-memory rate limiter (use Upstash Redis for production)
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 100
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string) {
  const now = Date.now()
  const record = rateLimit.get(userId)
  if (!record || now > record.resetTime) {
    rateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  record.count++
  return record.count <= RATE_LIMIT_MAX
}
```

### 8. localStorage — NEVER Store Sensitive Data

**Rule:** NEVER store auth tokens, member codes, PII, or session data in localStorage unencrypted.

```typescript
// WRONG
localStorage.setItem('session', JSON.stringify({ token, userId, email }))

// CORRECT — use opaque session ID, fetch sensitive data from authenticated API
localStorage.setItem('offline-snapshot', JSON.stringify({
  sessionId: 'opaque-id',  // NOT the actual user ID or member code
  savedAt: new Date().toISOString(),
}))
```

### 9. Cache-Control on Authenticated Pages

**Rule:** Authenticated pages MUST have:
```
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
```

This is usually handled by Next.js for dynamic routes, but verify it's present.

### 10. security.txt

**Rule:** Create `public/.well-known/security.txt`:
```
Contact: mailto:security@yourdomain.com
Expires: 2027-09-17T00:00:00.000Z
Preferred-Languages: en
Canonical: https://yourdomain.com/.well-known/security.txt
```

---

## MANDATORY: Code Review Checklist

When reviewing a PR or writing code, check:

- [ ] CSP header present (Report-Only or enforcing)
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] HSTS with includeSubDomains and preload
- [ ] Referrer-Policy header present
- [ ] Permissions-Policy header present
- [ ] poweredByHeader: false in next.config.js
- [ ] Supabase auth cookies have httpOnly: true
- [ ] No auth tokens in localStorage or sessionStorage
- [ ] Google provider_token stripped from client session (if using Google OAuth)
- [ ] No `Access-Control-Allow-Origin: *` on any route
- [ ] RLS enabled on all Supabase tables
- [ ] Rate limiting on API routes
- [ ] No PII in localStorage unencrypted
- [ ] Cache-Control: private, no-cache, no-store on authenticated pages
- [ ] security.txt file exists
- [ ] Sentry client-side tracesSampleRate set to 0 (or DSN removed)
- [ ] No git commit hashes exposed in HTML (use semantic version for release)
- [ ] Vercel headers stripped at Cloudflare edge (x-vercel-id, x-vercel-cache)

---

## Common Mistakes to Avoid

### Mistake 1: "The default @supabase/ssr config is secure"
**Reality:** The default `@supabase/ssr` cookie config does NOT set `HttpOnly: true`. You MUST override it. This is the single most common and critical mistake.

### Mistake 2: "CSP is too complex, I'll add it later"
**Reality:** Without CSP, any XSS vulnerability = full session theft + Google account takeover (if provider_token is exposed). CSP is the #1 defense. Deploy in Report-Only mode first — it takes 5 minutes.

### Mistake 3: "RLS is enabled by default in Supabase"
**Reality:** RLS must be explicitly enabled per table. New tables created via SQL may not have RLS. Always verify with a direct curl test.

### Mistake 4: "localStorage is fine for non-sensitive data"
**Reality:** Member codes, names, and stamp counts ARE sensitive under privacy laws (GDPR, UU PDP). If you wouldn't put it on a public API without auth, don't put it in localStorage.

### Mistake 5: "I don't need rate limiting, Supabase handles it"
**Reality:** Supabase's built-in rate limiting is on the auth endpoints only. Your custom API routes and Supabase REST queries have no rate limiting unless you add it.

---

## Infrastructure Hardening (Non-Code)

### Cloudflare Transform Rules
Strip these response headers at the edge:
- `x-vercel-id`
- `x-vercel-cache`
- `x-matched-path`
- `x-nextjs-prerender`
- `x-nextjs-stale-time`

### Sentry Configuration
```typescript
Sentry.init({
  tracesSampleRate: 0,           // Disable client-side tracing
  release: 'app@1.0.0',         // Semantic version, NOT git hash
  environment: 'production',
})
```

### HSTS Preload
After verifying all subdomains support HTTPS, submit to https://hstspreload.org.

---

## Attack Chain Awareness

When you see these three conditions together, flag them as CRITICAL immediately:

1. **No CSP** → XSS can execute freely
2. **Non-HttpOnly auth cookies** → `document.cookie` returns JWT + refresh_token + provider_token
3. **provider_token in client session** → Google account access possible

**Chain:** XSS (no CSP) → reads `document.cookie` (non-HttpOnly) → steals JWT + refresh_token + Google provider_token → reads localStorage PII → exfiltrates to attacker server (CSP doesn't block) → full session theft + Google account takeover.

**Breaking the chain:** Fix ANY ONE of the three to significantly reduce risk. Fix ALL THREE to eliminate it.
