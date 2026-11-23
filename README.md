# mandy-frontend

Mandy is a single-user personal assistant: a daily brief, study tasks, a job tracker, learning roadmaps, tech news,
a profile and a resume builder, plus an AI assistant (Google Gemini, free tier). Passwordless sign-in uses passkeys.

**Stack:** Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base-ui),
TanStack Query, motion, react-hook-form + zod, dnd-kit. API: [`mandy-backend`](https://github.com/Mandy-assistant/mandy-backend) (FastAPI).

## Getting started

```bash
# 1. API (see mandy-backend/README.md): Postgres + Redis in Docker, seed data, FastAPI on :8000
cd ../mandy-backend && docker compose up -d && uv run alembic upgrade head \
  && uv run python -m app.scripts.seed --reset && uv run fastapi dev app/main.py --port 8000

# 2. Frontend on :3001
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3001
```

The browser always calls `/api/v1/*` on the frontend's own origin, and `next.config.ts` forwards it to `API_PROXY_TARGET`
(default `http://localhost:8000`). Keeping the auth cookies first-party is what makes passkeys and httpOnly sessions work.

**First run:** with no passkey registered, `/unlock` sends you to `/setup` to create one and save your 8 recovery codes.
For local work without an authenticator, the API's dev-only `POST /api/v1/auth/dev-login` (needs `ENV=dev` and
`DEV_LOGIN_ENABLED=true`) signs in the seeded owner. The e2e tests use it.

**AI:** add a free key from https://aistudio.google.com/apikey to the backend's `GEMINI_API_KEY`. Without it, everything
else still works, and the AI features explain how to turn them on.

| Script               | What it does                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `npm run dev`        | Dev server on :3001                                                   |
| `npm run build`      | Production build                                                      |
| `npm run lint`       | ESLint                                                                |
| `npm run typecheck`  | Route types + `tsc` (includes the API contract check)                 |
| `npm run format`     | Prettier (with the Tailwind class sorter)                             |
| `npm test`           | Unit tests (Vitest + Testing Library)                                 |
| `npm run e2e`        | Playwright on desktop Chrome and Pixel 7, against the running API     |
| `npm run gen:api`    | Regenerate `src/types/api.d.ts` from the API's OpenAPI schema         |
| `npm run analyze`    | Turbopack bundle analyzer                                             |

## Structure

```
src/
  app/
    (auth)/unlock, setup, recover     passkey screens (dark aurora stage)
    (app)/                            signed-in pages: / (daily brief), tasks, jobs, roadmaps[/id],
                                      news, resumes[/id], profile, settings; error/loading states
    styleguide/                       dev-only: every token, primitive and motion pattern
    manifest.ts, icon.svg, opengraph-image.tsx
  proxy.ts                            optimistic auth redirect (reads the `mandy_session` hint cookie)
  components/
    ui/                               shadcn primitives (base-ui; use `render`, not `asChild`)
    layout/                           AppShell, Sidebar, Topbar, BottomNav, CommandPalette (⌘K), ThemeToggle, UserMenu
    motion/                           PageTransition, Stagger/StaggerItem, Pressable, AnimatedNumber
    shared/                           Orb, PageHeader, EmptyState/ErrorState, skeletons, ConfirmDialog
  features/<feature>/                 types.ts · api.ts · keys.ts · hooks.ts · schemas.ts · components/
  lib/                                api client + errors + form-error mapping, motion tokens, nav config
  styles/tokens.css                   design tokens (light + dark)
  types/api.d.ts                      generated from OpenAPI; contract.check.ts keeps feature types honest
tests/unit, tests/e2e
```

Data flow: **component → feature hook (`useJobs`) → feature api (`jobsApi`) → `api.get` in `lib/api/client.ts`**.
A 401 triggers one shared `/auth/refresh` and a retry; if that fails, you land on `/unlock?next=…`.
Failed mutations toast the backend's message unless they set `meta: { silentError: true }` and handle it themselves
(forms map 422s onto fields with `applyApiErrors`).

## Conventions

- **Tokens only.** Colours come from `src/styles/tokens.css` as role utilities (`bg-surface`, `text-muted-foreground`,
  `bg-status-interview`, `bg-priority-high`, `shadow-card`…). Check `/styleguide` in both themes after changing one.
- **Motion:** shared tokens in `lib/motion.ts`. `<MotionConfig reducedMotion="user">` turns off transforms for people
  who ask for less motion, so don't branch on `useReducedMotion()` in first-paint values (it breaks hydration).
- **Cache Components:** components that read `useSearchParams()`/`usePathname()` on dynamic routes need a `<Suspense>`
  boundary, and time-dependent values belong after hydration (`useHydrated()`). Visited routes stay mounted (hidden),
  which is why "Lock Mandy" does a full page load.
