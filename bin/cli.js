#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILL_FILE = path.join(__dirname, '..', 'SKILL.md');
const README_FILE = path.join(__dirname, '..', 'README.md');

const skillContent = fs.readFileSync(SKILL_FILE, 'utf-8');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function printHelp() {
  console.log(`
${BOLD}supabase-nextjs-security${RESET} — Security skill for AI coding agents

${BOLD}USAGE${RESET}
  npx supabase-nextjs-security                 Interactive mode (default)
  npx supabase-nextjs-security --print          Output SKILL.md to stdout
  npx supabase-nextjs-security --check          Scan current project for security issues
  npx supabase-nextjs-security --install <agent>  Install skill for a specific agent

${BOLD}AGENTS${RESET}
  cursor        Copy to .cursorrules
  claude        Copy to .claude/instructions.md
  copilot       Copy to .github/copilot-instructions.md
  workbuddy     Copy to .workbuddy-ai/skills/security-guard/SKILL.md
  chatgpt       Output system prompt for ChatGPT Custom GPT
  windsurf      Copy to .windsurfrules
  continue      Copy to .continue/rules.md
  all           Install for all detected agents

${BOLD}EXAMPLES${RESET}
  npx supabase-nextjs-security --install cursor
  npx supabase-nextjs-security --check
  npx supabase-nextjs-security --print | pbcopy

${BOLD}OPTIONS${RESET}
  --help, -h     Show this help
  --print        Output skill content to stdout
  --check        Scan project for security vulnerabilities
  --version, -v  Show version

${YELLOW}Source: https://github.com/Kunci-Tech/security-skill${RESET}
`);
}

function installForAgent(agent) {
  const cwd = process.cwd();
  const targets = {
    cursor: { path: '.cursorrules', label: 'Cursor (.cursorrules)' },
    claude: { path: '.claude/instructions.md', label: 'Claude (.claude/instructions.md)' },
    copilot: { path: '.github/copilot-instructions.md', label: 'GitHub Copilot (.github/copilot-instructions.md)' },
    workbuddy: { path: '.workbuddy-ai/skills/security-guard/SKILL.md', label: 'WorkBuddy (.workbuddy-ai/skills/security-guard/SKILL.md)' },
    windsurf: { path: '.windsurfrules', label: 'Windsurf (.windsurfrules)' },
    continue: { path: '.continue/rules.md', label: 'Continue (.continue/rules.md)' },
  };

  if (agent === 'chatgpt') {
    console.log(`\n${CYAN}${BOLD}ChatGPT Custom GPT — System Prompt${RESET}\n`);
    console.log('─'.repeat(60));
    console.log(skillContent);
    console.log('─'.repeat(60));
    console.log(`\n${YELLOW}Paste the above into:${RESET}`);
    console.log('  ChatGPT → Explore → GPTs → Create → Configure → Instructions');
    console.log(`\n${GREEN}✓${RESET} Done. Paste the system prompt into your Custom GPT.\n`);
    return;
  }

  if (agent === 'all') {
    let installed = 0;
    for (const [name, target] of Object.entries(targets)) {
      const fullPath = path.join(cwd, target.path);
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, skillContent);
      console.log(`${GREEN}✓${RESET} Installed for ${target.label}`);
      installed++;
    }
    console.log(`\n${GREEN}${BOLD}Installed for ${installed} agents.${RESET}\n`);
    return;
  }

  const target = targets[agent];
  if (!target) {
    console.log(`${RED}Unknown agent: ${agent}${RESET}`);
    console.log(`Available: cursor, claude, copilot, workbuddy, windsurf, continue, chatgpt, all\n`);
    process.exit(1);
  }

  const fullPath = path.join(cwd, target.path);
  const dir = path.dirname(fullPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, skillContent);
  console.log(`\n${GREEN}✓${RESET} Installed for ${target.label}`);
  console.log(`  ${CYAN}${fullPath}${RESET}\n`);
  console.log(`${YELLOW}The skill will be active next time your agent reads its rules file.${RESET}\n`);
}

function checkProject() {
  const cwd = process.cwd();
  const issues = [];
  const passes = [];

  // Check for next.config.js / next.config.ts / next.config.mjs
  const nextConfigs = ['next.config.js', 'next.config.ts', 'next.config.mjs'];
  const configPath = nextConfigs.find(f => fs.existsSync(path.join(cwd, f)));

  if (!configPath) {
    issues.push({ severity: 'WARN', msg: 'No next.config.* found — not a Next.js project or wrong directory' });
  } else {
    const config = fs.readFileSync(path.join(cwd, configPath), 'utf-8');

    // Check CSP
    if (!config.includes('Content-Security-Policy') && !config.includes('content-security-policy')) {
      issues.push({ severity: 'CRITICAL', msg: 'No Content-Security-Policy header in next.config — XSS exploit surface is wide open' });
    } else {
      passes.push('Content-Security-Policy header found');
    }

    // Check X-Frame-Options
    if (!config.includes('X-Frame-Options') && !config.includes('x-frame-options')) {
      issues.push({ severity: 'HIGH', msg: 'No X-Frame-Options header — clickjacking possible' });
    } else {
      passes.push('X-Frame-Options header found');
    }

    // Check X-Content-Type-Options
    if (!config.includes('X-Content-Type-Options') && !config.includes('x-content-type-options')) {
      issues.push({ severity: 'MEDIUM', msg: 'No X-Content-Type-Options: nosniff header' });
    } else {
      passes.push('X-Content-Type-Options header found');
    }

    // Check HSTS
    if (!config.includes('Strict-Transport-Security')) {
      issues.push({ severity: 'MEDIUM', msg: 'No HSTS header — SSL strip attacks possible' });
    } else if (!config.includes('includeSubDomains')) {
      issues.push({ severity: 'LOW', msg: 'HSTS present but missing includeSubDomains' });
    } else {
      passes.push('HSTS with includeSubDomains found');
    }

    // Check Referrer-Policy
    if (!config.includes('Referrer-Policy')) {
      issues.push({ severity: 'LOW', msg: 'No Referrer-Policy header' });
    } else {
      passes.push('Referrer-Policy header found');
    }

    // Check Permissions-Policy
    if (!config.includes('Permissions-Policy')) {
      issues.push({ severity: 'LOW', msg: 'No Permissions-Policy header' });
    } else {
      passes.push('Permissions-Policy header found');
    }

    // Check poweredByHeader
    if (!config.includes('poweredByHeader') || config.includes('poweredByHeader: false')) {
      if (config.includes('poweredByHeader: false')) {
        passes.push('poweredByHeader: false set');
      } else {
        issues.push({ severity: 'LOW', msg: 'poweredByHeader not disabled — X-Powered-By: Next.js leaks framework' });
      }
    }
  }

  // Check for Supabase client files
  const supabasePaths = [
    'lib/supabase/server.ts',
    'lib/supabase/client.ts',
    'lib/supabase/server.js',
    'lib/supabase/client.js',
    'src/lib/supabase/server.ts',
    'src/lib/supabase/client.ts',
    'app/lib/supabase/server.ts',
    'utils/supabase/server.ts',
  ];

  let supabaseFound = false;
  for (const sp of supabasePaths) {
    const fullPath = path.join(cwd, sp);
    if (fs.existsSync(fullPath)) {
      supabaseFound = true;
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check for HttpOnly
      if (!content.includes('httpOnly') && !content.includes('HttpOnly') && !content.includes('httponly')) {
        issues.push({ severity: 'CRITICAL', file: sp, msg: 'No httpOnly: true on Supabase cookies — auth tokens readable by JavaScript (XSS token theft)' });
      } else {
        passes.push(`HttpOnly cookies configured (${sp})`);
      }

      // Check for secure flag
      if (!content.includes('secure')) {
        issues.push({ severity: 'MEDIUM', file: sp, msg: 'No secure flag on Supabase cookies' });
      }

      // Check for sameSite
      if (!content.includes('sameSite') && !content.includes('samesite')) {
        issues.push({ severity: 'LOW', file: sp, msg: 'No sameSite attribute on Supabase cookies' });
      } else {
        passes.push(`SameSite cookie attribute set (${sp})`);
      }
    }
  }

  // Check middleware
  const middlewarePaths = ['middleware.ts', 'middleware.js', 'src/middleware.ts'];
  for (const mp of middlewarePaths) {
    const fullPath = path.join(cwd, mp);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('supabase') && !content.includes('httpOnly') && !content.includes('HttpOnly')) {
        issues.push({ severity: 'CRITICAL', file: mp, msg: 'Middleware handles Supabase cookies but no httpOnly: true — tokens readable by JavaScript' });
      }
      if (content.includes('Access-Control-Allow-Origin') && content.includes("'*'")) {
        issues.push({ severity: 'HIGH', file: mp, msg: 'Wildcard CORS (Access-Control-Allow-Origin: *) detected in middleware' });
      }
    }
  }

  // Check auth callback
  const callbackPaths = [
    'app/auth/callback/route.ts',
    'app/auth/callback/route.js',
    'src/app/auth/callback/route.ts',
    'pages/api/auth/callback.ts',
  ];
  for (const cp of callbackPaths) {
    const fullPath = path.join(cwd, cp);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('provider_token') && !content.includes('delete') && !content.includes('remove')) {
        issues.push({ severity: 'HIGH', file: cp, msg: 'Auth callback exchanges session but does not strip provider_token — Google OAuth token exposed client-side' });
      } else if (content.includes('provider_token') && content.includes('delete')) {
        passes.push(`provider_token stripped in auth callback (${cp})`);
      }
    }
  }

  // Check for localStorage usage with sensitive data
  const srcDirs = ['src', 'app', 'components', 'lib', 'pages'];
  for (const dir of srcDirs) {
    const fullPath = path.join(cwd, dir);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      checkLocalStorageRecursive(fullPath, issues, cwd);
    }
  }
  function checkLocalStorageRecursive(dir, issues, projectRoot) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        checkLocalStorageRecursive(fullPath, issues, projectRoot);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('localStorage.setItem') || content.includes('localStorage[')) {
          const sensitivePatterns = ['token', 'auth', 'session', 'password', 'email', 'member', 'userId', 'provider'];
          const hasSensitive = sensitivePatterns.some(p => content.toLowerCase().includes(p));
          if (hasSensitive) {
            issues.push({ severity: 'MEDIUM', file: path.relative(projectRoot, fullPath), msg: 'localStorage.setItem with potentially sensitive data detected' });
          }
        }
      }
    }
  }

  // Check for .env files
  if (fs.existsSync(path.join(cwd, '.env.local'))) {
    passes.push('.env.local found (env vars not committed)');
  }
  if (fs.existsSync(path.join(cwd, '.env')) && !fs.existsSync(path.join(cwd, '.gitignore'))) {
    issues.push({ severity: 'HIGH', msg: '.env file exists but no .gitignore — secrets will be committed!' });
  }

  // Check for security.txt
  const securityTxtPaths = ['public/.well-known/security.txt', 'static/.well-known/security.txt'];
  const hasSecurityTxt = securityTxtPaths.some(p => fs.existsSync(path.join(cwd, p)));
  if (!hasSecurityTxt) {
    issues.push({ severity: 'LOW', msg: 'No security.txt found — no vulnerability disclosure channel' });
  } else {
    passes.push('security.txt found');
  }

  // Print results
  console.log(`\n${BOLD}Security Scan Results${RESET}\n`);
  console.log('━'.repeat(60));

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, WARN: 4 };
  issues.sort((a, b) => (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5));

  if (issues.length > 0) {
    console.log(`\n${RED}${BOLD}Issues Found: ${issues.length}${RESET}\n`);
    for (const issue of issues) {
      const color = issue.severity === 'CRITICAL' ? RED :
                    issue.severity === 'HIGH' ? RED :
                    issue.severity === 'MEDIUM' ? YELLOW :
                    issue.severity === 'WARN' ? YELLOW : RESET;
      console.log(`  ${color}[${issue.severity}]${RESET} ${issue.msg}`);
      if (issue.file) console.log(`           ${CYAN}→ ${issue.file}${RESET}`);
    }
  }

  if (passes.length > 0) {
    console.log(`\n${GREEN}${BOLD}Passing Controls: ${passes.length}${RESET}\n`);
    for (const p of passes) {
      console.log(`  ${GREEN}✓${RESET} ${p}`);
    }
  }

  const score = Math.round((passes.length / (passes.length + issues.length)) * 100) || 0;
  console.log('\n' + '━'.repeat(60));
  const scoreColor = score >= 80 ? GREEN : score >= 50 ? YELLOW : RED;
  console.log(`  ${BOLD}Security Score: ${scoreColor}${score}/100${RESET}\n`);

  if (issues.length > 0) {
    console.log(`${YELLOW}Run ${BOLD}npx supabase-nextjs-security --install cursor${RESET}${YELLOW} (or your agent) to install the security skill.${RESET}\n`);
  }
}

function interactive() {
  console.log(`
${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}
${BOLD}${CYAN}║  Supabase + Next.js Security Skill  v1.0.0   ║${RESET}
${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}

${BOLD}What do you want to do?${RESET}

  ${CYAN}1${RESET}  Install skill for an AI agent
  ${CYAN}2${RESET}  Scan current project for security issues
  ${CYAN}3${RESET}  Print skill to stdout (for piping/clipboard)
  ${CYAN}4${RESET}  View available agents

Choose a number (or pass --help for CLI options):
`);

  process.stdin.resume();
  process.stdin.once('data', (data) => {
    const choice = data.toString().trim();
    switch (choice) {
      case '1':
        console.log(`\n${BOLD}Which agent?${RESET}\n`);
        console.log(`  ${CYAN}cursor${RESET}     .cursorrules`);
        console.log(`  ${CYAN}claude${RESET}     .claude/instructions.md`);
        console.log(`  ${CYAN}copilot${RESET}    .github/copilot-instructions.md`);
        console.log(`  ${CYAN}workbuddy${RESET}  .workbuddy-ai/skills/`);
        console.log(`  ${CYAN}windsurf${RESET}   .windsurfrules`);
        console.log(`  ${CYAN}continue${RESET}   .continue/rules.md`);
        console.log(`  ${CYAN}chatgpt${RESET}    Output system prompt for Custom GPT`);
        console.log(`  ${CYAN}all${RESET}        Install for all agents\n`);
        process.stdin.resume();
        process.stdin.once('data', (d2) => {
          installForAgent(d2.toString().trim());
        });
        break;
      case '2':
        checkProject();
        break;
      case '3':
        console.log(skillContent);
        break;
      case '4':
        printHelp();
        break;
      default:
        console.log(`${RED}Invalid choice${RESET}`);
        printHelp();
    }
  });
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  interactive();
} else if (args.includes('--help') || args.includes('-h')) {
  printHelp();
} else if (args.includes('--version') || args.includes('-v')) {
  console.log('supabase-nextjs-security v1.0.0');
} else if (args.includes('--print')) {
  console.log(skillContent);
} else if (args.includes('--check')) {
  checkProject();
} else if (args.includes('--install')) {
  const agent = args[args.indexOf('--install') + 1];
  if (!agent) {
    console.log(`${RED}Specify an agent: cursor, claude, copilot, workbuddy, windsurf, continue, chatgpt, all${RESET}`);
    process.exit(1);
  }
  installForAgent(agent);
} else {
  printHelp();
}
