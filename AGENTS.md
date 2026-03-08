# Repository Guidelines

## Project Structure & Module Organization
`app/` contains the Next.js App Router entry points, route groups, and server actions. Admin pages live under `app/admin/*`; auth pages are under `app/(auth)/*`; API handlers are in `app/api/*`. Reusable UI is split between `components/admin/` for feature components and `components/ui/` for shared shadcn-style primitives. Put server-side helpers in `lib/` (`auth.ts`, `prisma.ts`, localization helpers). Database schema, migrations, and seed data live in `prisma/`. Static assets and uploaded images are served from `public/`, including `public/uploads/inventory/`.

## Build, Test, and Development Commands
Use `npm run dev` to start the local dev server on `http://localhost:3000`. Use `npm run build` to create the production build and catch route or type issues surfaced by Next.js. Use `npm run start` to serve the built app locally. Use `npm run lint` to run the repo ESLint config. Database workflow is Prisma-based: `npx prisma migrate dev` creates/applies local migrations, `npx prisma generate` refreshes the client, and `npx prisma db seed` runs `prisma/seed.ts`.

## Coding Style & Naming Conventions
The codebase uses TypeScript, React 19, and Next.js 16. Follow the existing style: 2-space indentation, single quotes, semicolon-free statements, and named exports for shared utilities/components. Use `PascalCase` for React components, `camelCase` for functions and variables, and kebab-case for component filenames in `components/` (for example, `inventory-table.tsx`). Keep server actions close to the route they support as `actions.ts`.

## Testing Guidelines
There is no dedicated automated test suite yet. Until one is added, treat `npm run lint` and `npm run build` as the minimum verification for every change. For data-model updates, also run the relevant Prisma command and verify the affected admin flow manually. When adding tests later, place them near the feature or in a dedicated `__tests__/` directory and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent commits use very short summaries (`finished`, `completed census`). Keep commits small, imperative, and specific instead: `add sales payment breakdown migration`. In pull requests, include a short description, note schema or env changes, link the issue if one exists, and attach screenshots for UI changes in `app/admin/*`. Call out any manual verification steps, especially for Clerk auth, uploads, and Prisma migrations.

## Security & Configuration Tips
Secrets belong in `.env`; do not commit production credentials. Review changes touching `lib/auth.ts`, Clerk routes, or `app/api/admin/*` carefully because they gate admin access. Avoid editing generated output such as `.next/` or Prisma client artifacts by hand.
