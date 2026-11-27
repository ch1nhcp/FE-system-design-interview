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

- Structure: `src/lib/topics/registry.ts` lists the 14 sections and their topic slugs in reading order. It is the single source of truth for navigation, progress and routes.
- Content: `content/topics/<slug>.mdx` in English and `content/topics/<slug>.vi.mdx` for a translation, with frontmatter (`description`, `visual`) validated by Zod.
- Topic and section titles live in the `Topics` and `Sections` messages, so navigation is translated even before content is.
- Content tests fail when a file does not match a registry topic, a translation has no English file, or frontmatter is invalid. A test that every topic has English content is added once Phase 3 is done.
- Progress store v2 keys progress by topic, with the states not started, learned and review again, and migrates v1 data.
- All pages are statically generated; only progress, search and flashcards run on the client.
- SEO: per-page metadata, `hreflang` alternates, `sitemap.ts`, JSON-LD and Open Graph images.
- Tests: Vitest and Testing Library for units, content tests for the content rules, Playwright for the main user flows, all in CI.

## Phases

| Phase                 | Work                                                                                                        | Done when                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 0. Foundations        | Commit current work, this plan, Vitest and Playwright in CI, Fumadocs spike, one animation prototype (done) | Tests run in CI, content pipeline and visual approach decided  |
| 1. Site skeleton      | Layout, routes, topic registry, progress store v2, dashboard (done)                                         | Every route renders with placeholder content and tests pass    |
| 2. Template and pilot | Two-column topic layout, visual components, the full Real-time updates section                              | The user reviews depth and tone before more content is written |
| 3. English content    | The remaining 13 sections, one or two sections per PR                                                       | All 14 sections are written                                    |
| 4. Study tools        | Cmd+K search, flashcards, "review again" filter                                                             |                                                                |
| 5. Polish             | Core Web Vitals, accessibility audit, Open Graph images                                                     |                                                                |
| Later                 | Vietnamese content, case studies                                                                            |                                                                |

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

## Phase 1 findings

- Routes: `/`, `/sections/[section]`, `/topics/[topic]`, `/framework` and `/flashcards`, all statically generated for both locales with `dynamicParams = false`.
- Layout: the `(library)` route group adds the sections sidebar on wide screens; small screens get a drawer. Both scroll their own list so the current page stays visible without moving the page.
- A topic shared by two sections has one page and one progress status, and appears in both sections of the dashboard and sidebar.
- The frontmatter summary is named `description`. Fumadocs types `PageData` with only optional fields, and TypeScript's weak type check rejects a schema that shares none of them.
- A server component must not import plain constants from a `'use client'` module, since they arrive as client references. Shared constants live in `src/components/site/constants.ts`.
- The shadcn CLI (4.12, radix-nova style) writes `import { cn } from "cn"` and installs an unrelated `cn` package. After `shadcn add`, remove the package and point the import at `@/lib/utils`.
- The `Dialog` and `Sheet` primitives read their "Close" label from the `Common` messages instead of hard-coding English.
- Accessible names: a link that wraps a card reads its whole text, so section cards use a stretched link with only the title inside it.

## Phase 2 findings

- Topic template: TL;DR (at most 3 sentences), `<VisualPanel>` right after it, Key points (3 to 5), Trade-offs table, 2 to 4 `<InterviewQuestion>`s and a `<DeepDive>` with edge cases, common mistakes and references. Content tests enforce these rules.
- MDX components (`VisualPanel`, `VisualTab`, `InterviewQuestion`, `DeepDive`, visuals) are provided to MDX without imports, from `src/components/mdx/mdx-components.tsx`.
- The two-column layout is pure CSS: MDX hands its `wrapper` the whole document as a single element, so React cannot split out the panel. On `xl` screens `.topic-body:has(> .topic-visual)` becomes a grid with the panel sticky in the second column; on smaller screens the panel stays inline after the TL;DR.
- Prose spacing uses top margins only, because grid items do not collapse margins.
- `html, body { overflow-x: hidden }` from the starter made `body` a scroll container and silently broke every `position: sticky` (header, sidebar, panel). It is now `overflow-x: clip`.
- Section overviews live in `content/sections/<section>.mdx` and render below the topic list, for example the "How to choose" table of Real-time updates.
- The transport animation covers short polling, long polling, SSE and WebSocket, with held requests, the open connection and client-to-server messages, so each topic opens on its own mode and can be compared with the others.
- Code examples in the 25rem panel scroll horizontally; code blocks are focusable so keyboard users can scroll them.
- The development-only `/lab` page is removed.

## Phase 3 progress

| Batch | Sections                        | Topics | Status      |
| ----- | ------------------------------- | ------ | ----------- |
| 1     | Architecture, State management  | 9      | In review   |
| 2     | Back end APIs, Component APIs   | 9      | In review   |
| 3     | Networking techniques           | 8      | Not started |
| 4     | Performance                     | 14     | Not started |
| 5     | Images, Accessibility           | 12     | Not started |
| 6     | SEO, User experience            | 10     | Not started |
| 7     | Security, i18n, Common patterns | 15     | Not started |

Topics already written in an earlier section are not counted again, such as Optimistic updates under Performance.

Batch 2 adds all five Back end APIs topics and all four Component APIs topics, with a comparison overview for each section.
There are now 22 English topic pages out of 81 unique topics.
Content tests require every topic and the overview of each completed section to remain present, while unfinished sections can still use placeholders.
The new topics reuse `FlowDiagram` and code panels because their main concepts are contracts, ownership and request structure rather than timing.
Batch 2 summaries are checked at a 1440 by 900 desktop viewport with answers and the deep dive collapsed.
From the TL;DR heading to the deep dive, the summary must fit within 820 pixels, leaving space for the sticky header when scrolled into view.
Detailed key points live under "Design details" in the deep dive; the visible bullets stay short enough for quick review.

### Visual building blocks

- `RealtimeTransportAnimation`: short polling, long polling, SSE and WebSocket.
- `RenderingTimelineAnimation`: CSR, SSR, SSG/ISR and streaming with Server Components, with a browser mock and server, network and browser lanes.
- `FlowDiagram`: a vertical chain of steps with an optional loop, for topics about structure rather than timing.
- `AnimationFrame` and `useTimelinePlayback` hold what every step-through animation shares, so a new animation only needs a model and a picture.
- Animations still planned for later batches: debounce and throttle, retries with backoff, race conditions, loading waterfalls and list virtualization.
