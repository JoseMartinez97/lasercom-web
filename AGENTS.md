# Agent Instructions

## Project overview
The website of Lasercom, a laser cutting, engraving and marking workshop in Riba-roja de Túria (Valencia), founded in 2007. Astro with React islands, TypeScript, Tailwind CSS v4 and shadcn/ui. Tooling and rules come from the Kaizencode site (`kaizencode-sl/kaizencode-web`). The goal of the site is local SEO and getting quote requests. See `PRODUCT.md` (who it is for, what is true) and `DESIGN.md` (how it looks and moves).

## Framework details
- Component paths are aliased via `@/*` in tsconfig.json
- Tailwind CSS is configured through `@tailwindcss/vite`
- Uses strict TypeScript config from `astro/tsconfigs/strict`
- shadcn/ui components can be added with `pnpm dlx shadcn@latest add <component>`
- Node.js >=22.23.4 required
- Use pnpm (not npm) for all package management commands

## Key commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Run TypeScript checks
- `pnpm test` - Build and smoke-test `dist/` (titles, canonicals, hreflang twins, sitemap, structured data)
- Keep TypeScript on 6.x until typescript-eslint and `@astrojs/check` support 7

## Project structure
- Pages: `src/pages/[...path].astro` renders every page in both languages from the table in `src/lib/pages.ts`; add a page by adding an entry there (no per-language files)
- Services: `src/lib/services.ts` lists the 11 service pages (Spanish and English paths, photos, related services); their copy is `svc.<id>.*` in `src/i18n/messages/materials.ts` and `clients.ts`, rendered by `src/components/custom/service-content.astro`
- Business data (name, address, phones, hours, map): `src/lib/business.ts` only. It must match the Google Business Profile exactly
- Real work: `src/lib/work.ts` and photos in `src/assets/work/` (alt text in `src/i18n/messages/photos.ts`)
- Legal pages: Markdown in `src/content/legal/`, Spanish only
- Components: `src/components/`, layouts: `src/layouts/`, motion: `src/lib/animations.ts`

## SEO rules
- Never change the Spanish path of a service page that existed on the old WordPress site: they keep their Google ranking. If a path must change, add a redirect in `astro.config.mjs`
- Every page has its title and description in the messages, a canonical, hreflang (except legal pages) and LocalBusiness structured data from the layout; service pages add Service and FAQPage data
- Name, address and phone everywhere come from `src/lib/business.ts`

## Component usage guidelines
- Before creating a new component, check if shadcn or animate-ui already provides one
- Compose new components under `src/components/custom/`
- Photos go through `work-photo.astro`: it multiplies white-background shots into the page (`cutouts` in `src/lib/services.ts`)

## Internationalization (i18n)
- Astro's built-in i18n with `es` (default, at the root) and `en` (under `/en/` with English slugs)
- All text content must be provided in **both Spanish (`es`) and English (`en`)**; the legal pages are the one Spanish-only exception
- Translations live in `src/i18n/messages/*.ts` (one file per area, each with `en` and `es`), merged by `src/i18n/ui.ts`, with flat, dot-separated keys; English must define every Spanish key (enforced by `satisfies`)
- Use `useTranslations(lang)` from `@/i18n/utils` in Astro components; React islands receive `lang` and look keys up in `ui`

## Text and copy guidelines
- Use sentence case for all text content
- Never invent facts: prices, delivery times, machine specs, clients or reviews. Only what the owner has confirmed or what was on the old site (see `PRODUCT.md`)
