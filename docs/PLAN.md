# Interview Prep Site Plan

Rebuild the system design checklist into a study site for front end system design interviews.
Every checklist topic gets its own cheatsheet page with examples, diagrams and animations, plus study tools.

## Decisions

- Depth: each topic is a one-screen cheatsheet, followed by a collapsed "Deep dive" section.
- Visuals: every topic page has a visual panel next to the cheatsheet with an animation, a diagram or a code example.
- Language: English content first. Vietnamese UI stays; topic pages without a Vietnamese translation show the English content with a notice.
- Case studies are out of scope for now.
- Content is original. The GreatFrontEnd cheatsheet only provides the checklist structure and is credited as the source.

## Information architecture

All routes also exist under `/vi`.

| Route                 | Content                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `/`                   | Dashboard: overall progress, the 14 sections, topics marked "review again" |
| `/sections/[section]` | Section overview, topic list, quick comparison table                       |
| `/topics/[topic]`     | Topic cheatsheet                                                           |
| `/framework`          | RADIO interview framework                                                  |
| `/flashcards`         | Quick review built from the interview questions of each topic              |

Topics listed in two sections (Optimistic updates, Heading hierarchy, Infinite scrolling, Event sourcing) get a single page that both sections link to.

## Topic page

On desktop the page has two columns.
The left column holds the cheatsheet and must fit one screen: TL;DR (max 3 sentences), key points (max 5), trade-offs table, interview questions.
The right column is a sticky visual panel with Animation, Diagram and Code tabs.
On mobile the visual panel sits below the TL;DR.
A collapsed "Deep dive" section at the bottom covers how it works in detail, edge cases, common mistakes and references.

Animations are used where motion explains timing or ordering, such as polling vs WebSocket, debounce vs throttle, retries with backoff, race conditions, loading waterfalls and list virtualization.
They have Play, Pause and Step controls with a caption per step, and they do not autoplay when the user prefers reduced motion.
Other topics use a static diagram or a code example, declared in the topic frontmatter.

## Technical approach

- Content: `content/topics/<slug>/en.mdx` (and later `vi.mdx`), with frontmatter validated by Zod.
- The build fails when a checklist topic has no English content or a `related` link points to a missing topic.
- The checklist registry is generated from content instead of `checklist-data.ts`.
- Progress store v2 keys progress by topic, with the states not started, learned and review again, and migrates v1 data.
- All pages are statically generated; only progress, search and flashcards run on the client.
- SEO: per-page metadata, `hreflang` alternates, `sitemap.ts`, JSON-LD and Open Graph images.
- Tests: Vitest and Testing Library for units, content tests for the content rules, Playwright for the main user flows, all in CI.

## Phases

| Phase                 | Work                                                                                                 | Done when                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 0. Foundations        | Commit current work, this plan, Vitest and Playwright in CI, Fumadocs spike, one animation prototype | Tests run in CI, content pipeline and visual approach decided  |
| 1. Site skeleton      | Layout, routes, topic registry, progress store v2, dashboard                                         | Every route renders with placeholder content and tests pass    |
| 2. Template and pilot | Two-column topic layout, visual components, the full Real-time updates section                       | The user reviews depth and tone before more content is written |
| 3. English content    | The remaining 13 sections, one or two sections per PR                                                | All 14 sections are written                                    |
| 4. Study tools        | Cmd+K search, flashcards, "review again" filter                                                      |                                                                |
| 5. Polish             | Core Web Vitals, accessibility audit, Open Graph images                                              |                                                                |
| Later                 | Vietnamese content, case studies                                                                     |                                                                |

## Phase 0 findings

### Content pipeline: headless Fumadocs

Decision: use `fumadocs-core` 16 and `fumadocs-mdx` 15 through the macro API, without `fumadocs-ui`.

- Setup: `defineDocs` from `fumadocs-mdx/macro` in `src/lib/source.ts`, and `createMDX()` from `fumadocs-mdx/next` wrapping the Next config. No generated `.source` folder or tsconfig alias is needed.
- A spike verified a Next 16 Turbopack build with React Compiler and next-intl, static generation through `generateStaticParams`, and 404 for unknown slugs.
- The spike also verified that a Zod frontmatter extension is typed end to end, client components inside MDX hydrate, and GFM tables and Shiki highlighting (light and dark) work out of the box.
- Leave `macro.include` at its default. A narrow pattern such as `src/lib/source.ts` does not match Turbopack rule keys and the build fails.
- i18n uses `parser: 'dot'`: `websockets.mdx` is English and `websockets.vi.mdx` is Vietnamese.
- A missing translation falls back to English automatically, but `page.locale` still reports `vi`. Detect the fallback with `page.data !== source.getPage(slugs, 'en')?.data` to show the "not translated yet" notice.
- `fumadocs-ui` is not used because the two-column topic layout is custom and it brings its own design system; pages use shadcn/ui instead.
- Unit tests cannot import the macro directly, since it needs the bundler or the `fumadocs-mdx` Node loader. Phase 1 decides how content rule tests load files.
- `fumadocs-core` ships a static search server, to be evaluated for Cmd+K search in Phase 4.
- `fumadocs-mdx` depends on `esbuild`, which needs `esbuild: true` under `allowBuilds` in `pnpm-workspace.yaml`.

### Visuals: time-driven SVG without an animation library

Decision: animations are React SVG rendered from a pure model at a point in time, driven by a small `usePlayback` hook built on `requestAnimationFrame`.

- Every frame is deterministic, which makes Step, Restart, reduced motion and tests simple, so Motion is not needed.
- The prototype lives in `src/components/visuals/realtime-transport/` and compares short polling with WebSocket.
- It has Play, Pause, Step and Restart controls, captions in a polite live region, live stats, and a bar showing how long each update waits on the server.
- It autoplays once half of it is visible, except when the user prefers reduced motion.
- Static diagrams use the same SVG approach instead of Mermaid, so they share theme tokens and can be animated later.
- The neutral theme has no accent color; data-carrying messages use the foreground color and other messages the muted color. An accent token is revisited in Phase 2.
- `/lab` is a development-only playground that returns 404 in production; it is removed in Phase 2.

### Tooling

- pnpm 11 ignores settings in `.npmrc`, so `saveExact` and `strictPeerDependencies` now live in `pnpm-workspace.yaml`.
- Playwright runs against a production build on port 3100, so it never collides with `pnpm dev`.
- `tsconfig.json` excludes test output folders because `checkJs` would otherwise type-check generated reports during `next build`.
