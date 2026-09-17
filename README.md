# Supabase + Next.js Security Skill

> An AI agent skill that enforces security best practices for Supabase + Next.js applications — based on real penetration testing findings, not theoretical checklists.

## What This Is

A copy-pasteable skill file (`SKILL.md`) that you feed to your AI coding agent (Cursor, Claude, WorkBuddy, Copilot, etc.) so it automatically:

- Enforces HttpOnly on Supabase auth cookies
- Requires Content-Security-Policy on every route
- Strips Google OAuth `provider_token` from client-side sessions
- Blocks wildcard CORS on auth endpoints
- Verifies Supabase RLS is enabled
- Prevents PII in localStorage
- And 10+ other security controls — **before code ships**

## Why

Most Supabase + Next.js security vulnerabilities aren't from exotic zero-days — they're from the same recurring mistakes:

1. **Auth cookies without HttpOnly** (default `@supabase/ssr` behavior)
2. **No Content-Security-Policy** anywhere
3. **Google provider_token left in client-accessible cookies**
4. **Wildcard CORS on auth endpoints**
5. **No rate limiting on API routes**

These compound into a kill chain: a single XSS → full session theft → Google account takeover.

This skill makes your AI agent catch these *before* they reach production.

## Quick Start

### Option A: Copy-paste into your agent's rules file

1. Copy the contents of [`SKILL.md`](./SKILL.md)
2. Paste into your agent's custom instructions / rules file:
   - **Cursor**: `.cursorrules` or `.cursor/rules/security.md`
   - **Claude**: `.claude/instructions.md` or project instructions
   - **WorkBuddy**: `.workbuddy-ai/skills/` directory
   - **GitHub Copilot**: `.github/copilot-instructions.md`
   - **Any agent**: Paste into your project's `CONTRIBUTING.md` or `SECURITY.md`

### Option B: Clone into your project

```bash
git clone git@github.com:Kunci-Tech/security-skill.git .agent-security
```

Then reference it in your agent's config:

```json
// .cursor/config.json (example)
{
  "rules": [".agent-security/SKILL.md"]
}
```

## What It Covers

| # | Control | Severity | Why It Matters |
|---|---------|----------|----------------|
| 1 | Content-Security-Policy | Critical | Blocks XSS execution + data exfiltration |
| 2 | HttpOnly Supabase cookies | Critical | Prevents JS from reading auth tokens |
| 3 | Strip Google provider_token | High | Prevents Google account takeover via XSS |
| 4 | All security headers | High | X-Frame-Options, nosniff, HSTS, Referrer-Policy, Permissions-Policy |
| 5 | No wildcard CORS | High | Prevents cross-origin data reading |
| 6 | RLS verification | High | Ensures Supabase tables aren't publicly readable |
| 7 | Rate limiting | Medium | Prevents data enumeration and brute force |
| 8 | No PII in localStorage | Medium | Privacy law compliance (GDPR, UU PDP) |
| 9 | Cache-Control on auth pages | Medium | Prevents caching of authenticated content |
| 10 | security.txt | Low | Enables responsible disclosure |

## The Attack Chain It Prevents

```
XSS payload injected (no CSP)
    → reads document.cookie (non-HttpOnly cookies)
    → steals JWT + refresh_token + Google provider_token
    → reads localStorage PII
    → exfiltrates to attacker server (CSP doesn't block)
    → full session theft + Google account takeover
```

**Fix any one layer to break the chain. Fix all three to eliminate it.**

## Stack Specificity

This skill is specifically written for:
- **Supabase** (`@supabase/ssr`, Supabase Auth, Supabase REST API)
- **Next.js** (App Router, Server Components, middleware, Route Handlers)
- **Google OAuth** (provider_token handling)
- **Vercel** deployment (header stripping)
- **Cloudflare** edge (Transform Rules)

Not using all of these? The core principles (CSP, HttpOnly, no wildcard CORS, RLS, rate limiting) apply to any web stack. Remove the sections that don't apply.

## Contributing

Found a gap? Suffered through a vulnerability this skill should have caught?

1. Fork the repo
2. Add the finding to `SKILL.md` with:
   - The vulnerable pattern (what NOT to do)
   - The correct pattern (what TO do)
   - Severity rating
3. Submit a PR

## License

MIT — Use it, fork it, ship it. No attribution required.

## Suggested Repo Names

If you're forking and want a better name:

| Name | Vibe |
|------|------|
| `next-supabase-security` | Clear, professional, SEO-friendly |
| `supabase-nextjs-guard` | Catchy |
| `sb-nx-security` | Short, developer-friendly |
| `secure-supabase-next` | Descriptive |
| `audit-shield` | Generic, brandable |

---

*Based on real penetration testing of a production Supabase + Next.js application. No theoretical fluff — every finding was found in the wild.*
