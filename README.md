# Multo

Next.js 16 web application with internationalization (English and Japanese).

## Tech Stack

- **Framework** — Next.js 16 (App Router), React 19, React Compiler enabled
- **Language** — TypeScript (strict, `noUncheckedIndexedAccess`)
- **Styling** — Tailwind CSS v4, `tw-animate-css`
- **UI** — shadcn/ui (radix-nova style), Lucide icons, Sonner toasts, next-themes
- **i18n** — next-intl (`/` for English default, `/ja` for Japanese)
- **Client state** — Zustand
- **Server state / data fetching** — TanStack Query v5 (+ devtools)
- **Forms** — React Hook Form + `@hookform/resolvers` (Zod)
- **Validation** — Zod (shared client/server schemas)
- **Env vars** — T3 Env with Zod validation
- **Tooling** — pnpm, oxlint, oxfmt, husky, commitlint, renovate

## Prerequisites

- Node.js 24 (see [`.nvmrc`](./.nvmrc))
- pnpm 11

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). English is served at `/`, Japanese at `/ja`.

## Docker

The [`Dockerfile`](./Dockerfile) uses a multi-stage build with Next.js `output: 'standalone'`
for a minimal production image.

```bash
docker build -t multo .
docker run -p 3000:3000 multo
```

Pass runtime environment variables with `-e` or `--env-file .env.local`; see [`.env.example`](./.env.example) for what's validated by [`src/lib/env/`](./src/lib/env).

## Scripts

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Start the development server (Turbopack). |
| `pnpm build`        | Create a production build.                |
| `pnpm start`        | Serve the production build.               |
| `pnpm type-check`   | Run `next typegen` + `tsc --noEmit`.      |
| `pnpm lint`         | Lint with oxlint.                         |
| `pnpm lint:fix`     | Auto-fix lint issues.                     |
| `pnpm format`       | Format with oxfmt.                        |
| `pnpm format:check` | Check formatting without writing.         |

## Project Structure

- [`src/app/[locale]/`](./src/app/[locale]) — App Router pages, locale-scoped.
- [`src/components/`](./src/components) — Shared React components.
- [`src/components/ui/`](./src/components/ui) — shadcn/ui primitives.
- [`src/i18n/`](./src/i18n) — next-intl routing, navigation, and request config.
- [`src/messages/`](./src/messages) — Translation files (`en.json`, `ja.json`).
- [`src/stores/`](./src/stores) — Zustand stores.
- [`src/lib/query/`](./src/lib/query) — TanStack Query client factory and provider.
- [`src/lib/env/`](./src/lib/env) — T3 Env schemas for client/server variables.
- [`src/proxy.ts`](./src/proxy.ts) — next-intl middleware (renamed to `proxy.ts` in Next 16).
- [`redirects.ts`](./redirects.ts) — Redirect rules consumed by `next.config.ts`.
- [`global.d.ts`](./global.d.ts) — next-intl `AppConfig` typing (`Locale`, `Messages`).

## Internationalization

Locales are declared in [`src/i18n/routing.ts`](./src/i18n/routing.ts):

- Default locale (English) is served without a URL prefix (`localePrefix: 'as-needed'`).
- Japanese is served under `/ja`.
- Browser language auto-detection is disabled — users switch languages explicitly via the locale switcher.

To add a new locale:

1. Add its code to `routing.locales` in [`src/i18n/routing.ts`](./src/i18n/routing.ts).
2. Add a matching `src/messages/<locale>.json`.
3. Add a label to `localeLabels` in [`src/components/locale-switcher.tsx`](./src/components/locale-switcher.tsx).
4. If the locale needs locale-prefixed redirects (like `/ja/index` → `/ja`), add them to [`redirects.ts`](./redirects.ts).

## Data Fetching (TanStack Query)

`QueryClientProvider` is wired in [`src/app/[locale]/layout.tsx`](./src/app/[locale]/layout.tsx) via [`src/lib/query/query-provider.tsx`](./src/lib/query/query-provider.tsx). The client is created with an `isServer` singleton so each SSR request gets a fresh instance while the browser reuses one.

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';

export function Users() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then((r) => r.json()),
  });
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

Devtools are rendered via `ReactQueryDevtools` (bottom-left floating button in development).

## Forms (React Hook Form + Zod)

`react-hook-form` is paired with `@hookform/resolvers/zod` for schema-first validation:

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ email: z.email() });
type Values = z.infer<typeof schema>;

export function SignInForm() {
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  return <form onSubmit={form.handleSubmit((v) => console.info(v))}>{/* ... */}</form>;
}
```

Run `pnpm dlx shadcn@latest add form` to install the shadcn `Form` primitive that integrates with RHF.

## Environment Variables

Managed with [T3 Env](https://env.t3.gg/). Add variables to:

- [`src/lib/env/client.ts`](./src/lib/env/client.ts) — client-side (must be prefixed `NEXT_PUBLIC_`).
- [`src/lib/env/server.ts`](./src/lib/env/server.ts) — server-side.

Values go in `.env.local` (not committed).

## Git Hooks

Husky is configured in [`.husky/`](./.husky):

- `commit-msg` — commitlint enforces [Conventional Commits](https://www.conventionalcommits.org/).
- `post-merge` — runs `pnpm install` if `pnpm-lock.yaml` changed.
- `pre-commit` — disabled by default. Enable with:
  ```bash
  echo 'HUSKY_ENABLED=true' > .husky/_/pre-commit.options
  ```

## License

MIT — see [LICENSE.md](./LICENSE.md).
