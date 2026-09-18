# Supabase + Next.js Security Skill

> An AI agent skill that enforces security best practices for Supabase + Next.js applications — based on real penetration testing findings, not theoretical checklists.

## What This Is

A copy-pasteable skill file (`SKILL.md`) that you feed to your AI coding agent (Cursor, Claude, WorkBuddy, Copilot, ChatGPT, Windsurf, etc.) so it automatically:

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

---

## Quick Start

### Install via npx (recommended)

```bash
# Interactive mode — pick your agent, auto-install
npx supabase-nextjs-security

# Or install for a specific agent
npx supabase-nextjs-security --install cursor

# Or scan your project for security issues
npx supabase-nextjs-security --check
```

### Copy-paste manually

1. Copy the contents of [`SKILL.md`](./SKILL.md)
2. Paste into your agent's rules file (see per-agent instructions below)

### Clone the repo

```bash
git clone git@github.com:Kunci-Tech/supabase-nextjs-security.git .agent-security
```

---

## npx Commands

| Command | Description |
|---------|-------------|
| `npx supabase-nextjs-security` | Interactive mode (default) — choose agent, scan, or print |
| `npx supabase-nextjs-security --install <agent>` | Install skill for a specific agent |
| `npx supabase-nextjs-security --check` | Scan current project for security vulnerabilities |
| `npx supabase-nextjs-security --print` | Output SKILL.md to stdout (pipe to clipboard) |
| `npx supabase-nextjs-security --help` | Show all options |
| `npx supabase-nextjs-security --version` | Show version |

### Available `--install` targets

| Agent | Target File | Command |
|-------|-------------|---------|
| `cursor` | `.cursorrules` | `npx supabase-nextjs-security --install cursor` |
| `claude` | `.claude/instructions.md` | `npx supabase-nextjs-security --install claude` |
| `copilot` | `.github/copilot-instructions.md` | `npx supabase-nextjs-security --install copilot` |
| `workbuddy` | `.workbuddy-ai/skills/security-guard/SKILL.md` | `npx supabase-nextjs-security --install workbuddy` |
| `windsurf` | `.windsurfrules` | `npx supabase-nextjs-security --install windsurf` |
| `continue` | `.continue/rules.md` | `npx supabase-nextjs-security --install continue` |
| `antigravity` | `.agents/skills/agent-security/SKILL.md` | `npx supabase-nextjs-security --install antigravity` |
| `chatgpt` | Outputs system prompt | `npx supabase-nextjs-security --install chatgpt` |
| `all` | All of the above | `npx supabase-nextjs-security --install all` |

### The `--check` scanner

Run `npx supabase-nextjs-security --check` in your project root to scan for:

- Missing CSP in `next.config.*`
- Missing `httpOnly: true` in Supabase client/middleware
- Wildcard CORS in middleware
- Unstripped `provider_token` in auth callback
- Sensitive data in localStorage
- Missing security headers (X-Frame-Options, nosniff, HSTS, Referrer-Policy, Permissions-Policy)
- Missing `poweredByHeader: false`
- Missing `security.txt`
- `.env` without `.gitignore`

Outputs a security score out of 100 with specific file references.

---

## Per-Agent Installation Guide

### Cursor

```bash
# Option A: npx (recommended)
npx supabase-nextjs-security --install cursor

# Option B: manual
cp SKILL.md .cursorrules
```

Cursor reads `.cursorrules` from the project root. The skill will be active for all AI completions and chat in that workspace.

> **Tip:** You can also place it at `.cursor/rules/security.md` for project-scoped rules.

### Claude (Anthropic Console / Claude Code)

```bash
# Option A: npx
npx supabase-nextjs-security --install claude

# Option B: manual
mkdir -p .claude
cp SKILL.md .claude/instructions.md
```

Claude Code reads `.claude/instructions.md` as project-level custom instructions. The skill will be applied to all code generation and review in that workspace.

> **For Claude Desktop / Claude.ai:** Paste the SKILL.md content into a new Project, then reference it in your conversation: "Follow the security rules in the project instructions."

### GitHub Copilot

```bash
# Option A: npx
npx supabase-nextjs-security --install copilot

# Option B: manual
mkdir -p .github
cp SKILL.md .github/copilot-instructions.md
```

Copilot reads `.github/copilot-instructions.md` (requires Copilot Chat in VS Code or JetBrains). The skill will guide Copilot's code suggestions and review comments.

> **Note:** Requires Copilot Business or Copilot Enterprise for custom instructions.

### ChatGPT (Custom GPT)

```bash
# Output the system prompt for ChatGPT
npx supabase-nextjs-security --install chatgpt
```

This prints the full skill content formatted as a system prompt. To use it:

1. Go to [ChatGPT](https://chat.openai.com) → **Explore** → **GPTs** → **Create**
2. Click **Configure**
3. Paste the output into the **Instructions** field
4. Name it "Supabase Security Guard" (or whatever you like)
5. Optionally add your project's repo as a Knowledge base file
6. Save and use it for code review, security audits, and architecture discussions

> **Tip:** For best results with ChatGPT, also upload your `next.config.js`, `middleware.ts`, and `package.json` as Knowledge files so the GPT can reference your actual configuration.

### WorkBuddy AI

```bash
# Option A: npx
npx supabase-nextjs-security --install workbuddy

# Option B: manual
mkdir -p .workbuddy-ai/skills/security-guard
cp SKILL.md .workbuddy-ai/skills/security-guard/SKILL.md
```

WorkBuddy reads skills from `.workbuddy-ai/skills/`. The skill will auto-activate when working on auth flows, Supabase config, Next.js headers, or deployment.

> **User-level (all projects):** Install to `~/.workbuddy-ai/skills/security-guard/SKILL.md` to apply across all projects.

### Windsurf (Codeium)

```bash
# Option A: npx
npx supabase-nextjs-security --install windsurf

# Option B: manual
cp SKILL.md .windsurfrules
```

Windsurf reads `.windsurfrules` from the project root. The skill will be active for all AI completions and Cascade interactions.

### Continue.dev

```bash
# Option A: npx
npx supabase-nextjs-security --install continue

# Option B: manual
mkdir -p .continue
cp SKILL.md .continue/rules.md
```

Continue reads `.continue/rules.md` as project-level instructions for its AI assistants.

### Google Antigravity (Antigravity IDE & CLI)

```bash
# Option A: npx
npx supabase-nextjs-security --install antigravity

# Option B: manual
mkdir -p .agents/skills/agent-security
cp SKILL.md .agents/skills/agent-security/SKILL.md
```

Antigravity auto-discovers skills from `.agents/skills/<skill-name>/SKILL.md` and enforces constraints placed in `AGENTS.md` and `.agents/AGENTS.md`.

### Antigravity Browser Bridge

If you use [Antigravity](https://github.com/Kunci-Tech/antigravity-browser-extension) (CDP-based browser bridge for authenticated testing), the security skill integrates with your authenticated audit workflow:

1. **Install the skill** for your coding agent (Cursor, Claude, etc.):
   ```bash
   npx supabase-nextjs-security --install cursor
   ```

2. **Run a security scan** before deploying:
   ```bash
   npx supabase-nextjs-security --check
   ```

3. **Use Antigravity for authenticated verification** — after your coding agent implements the fixes, connect the Antigravity Bridge to your real browser and verify:
   - `document.cookie` no longer returns auth tokens (HttpOnly working)
   - No `provider_token` in the session blob
   - CSP header present in response headers
   - RLS blocks unauthenticated API access

4. **Recommended Antigravity eval snippets for post-fix verification:**
   ```javascript
   // Verify HttpOnly is working — should return empty or only non-auth cookies
   document.cookie.length
   // Expected: < 100 (no auth tokens visible)

   // Verify CSP is present
   document.querySelector('meta[http-equiv="Content-Security-Policy"]')
   // Or check response headers via the bridge's /navigate endpoint

   // Verify no provider_token in session
   // (should not be present in the cookie blob anymore)
   ```

> **The workflow:** Code with the skill → Scan with `--check` → Verify with Antigravity → Deploy with confidence.

### Generic / Any AI Agent

If your agent supports custom instructions or rules files but isn't listed above:

```bash
# Print to stdout and pipe to clipboard (macOS)
npx supabase-nextjs-security --print | pbcopy

# Linux
npx supabase-nextjs-security --print | xclip -selection clipboard

# Windows (PowerShell)
npx supabase-nextjs-security --print | Set-Clipboard
```

Then paste into whatever rules/instructions file your agent uses.

### All Agents at Once

```bash
npx supabase-nextjs-security --install all
```

Installs for Cursor, Claude, Copilot, WorkBuddy, Windsurf, and Continue simultaneously. Useful for monorepos or teams using multiple tools.

---

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

---

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

---

## Stack Specificity

This skill is specifically written for:
- **Supabase** (`@supabase/ssr`, Supabase Auth, Supabase REST API)
- **Next.js** (App Router, Server Components, middleware, Route Handlers)
- **Google OAuth** (provider_token handling)
- **Vercel** deployment (header stripping)
- **Cloudflare** edge (Transform Rules)

Not using all of these? The core principles (CSP, HttpOnly, no wildcard CORS, RLS, rate limiting) apply to any web stack. Remove the sections that don't apply.

---

## Contributing

Found a gap? Suffered through a vulnerability this skill should have caught?

1. Fork the repo
2. Add the finding to `SKILL.md` with:
   - The vulnerable pattern (what NOT to do)
   - The correct pattern (what TO do)
   - Severity rating
3. Submit a PR

### Development

```bash
git clone git@github.com:Kunci-Tech/supabase-nextjs-security.git
cd supabase-nextjs-security

# Test the CLI locally
node bin/cli.js --check
node bin/cli.js --print | head -20
node bin/cli.js --install cursor

# Publish to npm (requires npm login)
npm login
npm publish
```

---

## License

MIT — Use it, fork it, ship it. No attribution required.

---

*Based on real penetration testing of a production Supabase + Next.js application. No theoretical fluff — every finding was found in the wild.*
