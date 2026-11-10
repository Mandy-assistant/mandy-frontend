# mandy-frontend

Mandy web app: Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (base-ui, `base-nova` style),
TanStack Query, Motion.

Same architecture and tokens as `outreach-automation-frontend`, simplified for Next.js.

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Dev server                           |
| `npm run build`     | Production build                     |
| `npm run lint`      | ESLint                               |
| `npm run typecheck` | Generate route types and run `tsc`   |

While `NEXT_PUBLIC_USE_MOCK_API` is not `false`, every request returns its mock from `src/mocks`.

## Structure

```
src/
  app/                 routes (replaces react-router + pages/)
    (app)/home         signed-in pages, wrapped in ProtectedGuard + TopNavBar
  components/
    ui/                shadcn primitives (add more with `npx shadcn add <name>`)
    atoms/ molecules/ organisms/ templates/ icons/
  services/            API calls: request.ts + one folder per resource
  hooks/               TanStack Query hooks wrapping services
  types/ mocks/ constants/ utils/ lib/ config/
  providers/           QueryProvider, ToastProvider
  guards/              ProtectedGuard (client-side, token in localStorage)
  styles/tokens.css    design tokens
```

Data flow: **component → hook (`useTasks`) → service (`tasksApi`) → `api.get` in `request.ts`**.
To add a resource, copy the `task` files: `types/task.ts`, `mocks/tasks.ts`, `constants/task.ts`,
`services/tasks/tasks.ts`, `hooks/useTasks.ts`.

## Tokens

Everything lives in `src/styles/tokens.css`. Edit that file; there is no generator or build step.

1. **Palette:** raw colours (`bg-neutral-13`, `text-blue-1`)
2. **Roles:** what a colour is for (`--primary`, `--border`), overridden under `.dark`
3. **Bridge:** roles as utilities (`bg-primary`, `text-body`, `border-border`)

Use role utilities in components; use the palette only for one-off accents.
