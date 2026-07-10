# Hair by William — Startup MVP Build Spec (NEXUS-Sprint)

**Mode:** NEXUS-Sprint  
**Runbook:** `C:\Users\SysMigrator\.agency-agents\strategy\runbooks\scenario-startup-mvp.md`  
**Product:** Local luxury salon landing site for real El Paso clients.  
**Live URL (canonical):** https://william-site-snowy.vercel.app/  
**Date:** 2026-07-09

## Tooling stack (do not forget)

| Layer | Path |
|-------|------|
| Agency agents (source) | `C:\Users\SysMigrator\.agency-agents\` |
| Agency skills (project) | `c:\Users\SysMigrator\william-site\.agents\skills\` (254) |
| Cursor rules mirror | `c:\Users\SysMigrator\william-site\.cursor\rules\` |
| Claude agents mirror | `c:\Users\SysMigrator\william-site\.claude\agents\` |
| **CC Switch** | `C:\Users\SysMigrator\.cc-switch\` + app `AppData\Local\Programs\CC Switch` |
| **Skills Manager** | `C:\Users\SysMigrator\.skills-manager\` |
| Taste / soft design | `C:\Users\SysMigrator\.claude\skills\sacred-linguistics\taste-skill\` |

### Skills to use for UI composition (read SKILL.md first)
1. `C:\Users\SysMigrator\.claude\skills\sacred-linguistics\taste-skill\skills\soft-skill\SKILL.md`
2. `C:\Users\SysMigrator\.claude\skills\sacred-linguistics\taste-skill\skills\redesign-skill\SKILL.md`
3. `C:\Users\SysMigrator\.claude\skills\sacred-linguistics\taste-skill\skills\minimalist-skill\SKILL.md`
4. `c:\Users\SysMigrator\william-site\.agents\skills\design-ux-architect\SKILL.md`
5. `c:\Users\SysMigrator\william-site\.agents\skills\design-ui-designer\SKILL.md`
6. QA: `testing-evidence-collector` + `testing-reality-checker`

## MVP definition (real users)

A visitor can:
1. Understand who William is (27 years, El Paso, Suite 13C).
2. See proof of work (extensions / blowout / color-cut) early under a short hero.
3. Call `915-920-7823` in one tap from hero, nav, booking, FAB.
4. Find address + directions.
5. Experience a stable page on mobile (WebGL degrades gracefully).

Out of scope for MVP (do not block launch):
- OmniRoute / Ultimate MCP / Antigravity Hub infra
- Growth Team (week 3+)
- Online payment / full booking calendar (unless already shipping)

## Current evidence (Phase 1 inventory)

| Signal | Evidence | Status |
|--------|----------|--------|
| Live site HTTP | `https://william-site-snowy.vercel.app/` → **200** | PASS |
| GA4 | `G-T4274Q1Q1D` in `index.html` | PASS |
| Phone CTA | `tel:915-920-7823` in App | PASS |
| Address | Suite **13C** | PASS |
| Hours | call for availability (unverified times) | WARN |
| Portfolio under hero | Vertical stack; dead hero gutter removed | FIX APPLIED — re-QA |
| OmniRoute | unhealthy | OUT OF MVP SCOPE |

## Phase gates (no skip)

1. Analysis & Planning → 2. Architecture / UX → 3. Dev ↔ QA loop → 4. Reality Checker (default NEEDS WORK) → 5. Soft launch → 6. Real users → 7. Growth week 3+

## Non-goals this sprint

- Do not block salon MVP on OmniRoute health
- Do not deploy Ultimate MCP god-mode for launch
- Do not invent Friday/Saturday clock times without William confirmation
