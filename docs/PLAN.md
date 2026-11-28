# Interview Prep Site Plan

Rebuild the system design checklist into a study site for front end system design interviews.
Every checklist topic gets its own cheatsheet page with examples, diagrams and animations, plus study tools.

## Decisions

- Depth: each topic is a one-screen cheatsheet, followed by a collapsed "Deep dive" section.
- Visuals: every topic page has a visual panel next to the cheatsheet with an animation, a diagram or a code example.
- Language: English content first. Vietnamese UI stays; topic pages without a Vietnamese translation show the English content with a notice.
- The full completion goal includes Vietnamese topic content and section overviews after the core phases.
- Case studies remain out of scope.
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

| Phase                 | Work                                                                                                        | Done when                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 0. Foundations        | Commit current work, this plan, Vitest and Playwright in CI, Fumadocs spike, one animation prototype (done) | Tests run in CI, content pipeline and visual approach decided                   |
| 1. Site skeleton      | Layout, routes, topic registry, progress store v2, dashboard (done)                                         | Every route renders with placeholder content and tests pass                     |
| 2. Template and pilot | Two-column topic layout, visual components, the full Real-time updates section                              | The user reviews depth and tone before more content is written                  |
| 3. English content    | The remaining 13 sections, one or two sections per PR                                                       | All 14 sections are written                                                     |
| 4. Study tools        | RADIO guide, Cmd+K search, flashcards, "review again" filter                                                | All study flows work in both UI locales with keyboard and mobile coverage       |
| 5. Polish             | Core Web Vitals, accessibility audit, production SEO and Open Graph images                                  | Documented performance/accessibility evidence and validated production metadata |
| 6. Vietnamese content | Vietnamese topic pages and section overviews                                                                | All 81 topics and 14 overviews translated, with language and layout checks      |
| Later                 | Case studies                                                                                                | Outside the current completion goal                                             |

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

| Batch | Sections                        | Topics | Status    |
| ----- | ------------------------------- | ------ | --------- |
| 1     | Architecture, State management  | 9      | Merged    |
| 2     | Back end APIs, Component APIs   | 9      | Merged    |
| 3     | Networking techniques           | 8      | Merged    |
| 4     | Performance                     | 14     | Merged    |
| 5     | Images, Accessibility           | 12     | Merged    |
| 6     | SEO, User experience            | 10     | Merged    |
| 7     | Security, i18n, Common patterns | 15     | In review |

Topics already written in an earlier section are not counted again, such as Optimistic updates under Performance.

Batch 2 adds all five Back end APIs topics and all four Component APIs topics, with a comparison overview for each section.
There are now 81 English topic pages out of 81 unique topics.
Content tests require every registered topic and all fourteen section overviews to remain present.
The new topics reuse `FlowDiagram` and code panels because their main concepts are contracts, ownership and request structure rather than timing.
Batch 2 summaries are checked at a 1440 by 900 desktop viewport with answers and the deep dive collapsed.
From the TL;DR heading to the deep dive, the summary must fit within 820 pixels, leaving space for the sticky header when scrolled into view.
Detailed key points live under "Design details" in the deep dive; the visible bullets stay short enough for quick review.

Batch 3 adds all eight Networking techniques topics and a section overview that explains how their safeguards compose.
`RetryAnimation` compares immediate retries, exponential backoff and full jitter for three clients, using fixed jitter samples for repeatable playback.
`RaceAnimation` compares unguarded completions with a latest-generation guard while both requests finish out of order.
Both animations use the existing playback controls, localized captions and reduced-motion behavior.
Networking summaries use the same 820-pixel desktop height check as Batch 2, with desktop/mobile E2E coverage for navigation, code tabs, disclosures and English fallback.

Batch 4 adds the fourteen new Performance topics and a diagnostic overview; Optimistic updates reuses its Networking page.
`RateAnimation` compares trailing debounce with leading-only throttle on the same numbered input events.
`LoadingAnimation` compares serial resource discovery with resources known early enough to load in parallel, with illustrative task durations.
`VirtualizationAnimation` models a 1,000-item fixed-height list with five visible rows and two overscan rows per side.
The list drawing is a viewport sketch, and its mounted-row counts describe the model rather than a live DOM benchmark.
All three animations reuse deterministic playback, localized captions and reduced-motion behavior.
Performance content uses the same 820-pixel desktop summary check, locale fallback and mobile interaction coverage as earlier batches.

Batch 5 adds all seven Images topics, all five Accessibility topics and an overview for each section.
The new content uses code examples and the existing `FlowDiagram` rather than introducing animations.
Heading hierarchy has one page shared by Accessibility and SEO.
Image examples distinguish source dimensions, CSS slots, art direction, loading priority, preload reuse and text alternatives.
Accessibility examples use native controls where possible and explain ARIA state, keyboard contracts, focus transitions and visual presentation separately.
E2E coverage includes all twelve reading flows and locale fallbacks, the 820-pixel desktop summary limit, keyboard tab/disclosure operation, mobile-drawer focus return and a narrow 320-pixel reading layout.

Batch 6 adds five new SEO topics, five User experience topics and both section overviews.
Heading hierarchy reuses its Accessibility page, and Infinite scrolling is shared with Common patterns at a single URL and progress state.
The new content reuses code panels and `FlowDiagram` for document contracts, request state and recovery decisions.
SEO examples distinguish discovery, indexing, metadata, structured-data eligibility and rendering rather than promising ranking outcomes.
User experience examples distinguish initial loading from refresh, ambiguous writes from confirmed failures, and incremental loading from virtualization.
E2E coverage includes all ten reading flows, delivered descriptions, locale fallbacks, the 820-pixel desktop summary limit, shared Infinite scrolling progress and 320-pixel reading layout.

Batch 7 completes Security, i18n and Common patterns with fifteen new topics and three overviews.
All registered English content is now mandatory, and the topic and section-list placeholder paths are removed.
Common patterns reuses Infinite scrolling and Event sourcing without duplicating their URLs or progress.
The new topics use code and diagrams to explain trust boundaries, language-sensitive presentation, state history, playback and concurrent writes.

### Visual building blocks

- `RealtimeTransportAnimation`: short polling, long polling, SSE and WebSocket.
- `RenderingTimelineAnimation`: CSR, SSR, SSG/ISR and streaming with Server Components, with a browser mock and server, network and browser lanes.
- `RetryAnimation` and `RaceAnimation`: retry scheduling across clients and accepting only the current search result, sharing a request timeline diagram.
- `RateAnimation`, `LoadingAnimation` and `VirtualizationAnimation`: input scheduling, resource discovery and moving list windows.
- `FlowDiagram`: a vertical chain of steps with an optional loop, for topics about structure rather than timing.
- `AnimationFrame` and `useTimelinePlayback` hold what every step-through animation shares, so a new animation only needs a model and a picture.
- The animations originally planned through the Performance batch are implemented.

## Phase 4 progress

- RADIO now has an original guide in both UI languages, with suggested practice pacing, concrete prompts and links to relevant lessons.
- Search evaluates and uses Fumadocs' built-in multilingual static index, exported at `/api/search` and loaded when the search dialog is used.
- The dialog supports the header trigger, Cmd/Ctrl+K, keyboard selection, Escape, focus return and a recoverable index-load failure.
- Flashcards are extracted from the authored `InterviewQuestion` MDX AST, preserving answer paragraphs, code, lists, emphasis and links without evaluating arbitrary expressions.
- Flashcards support section and review filters, answer reveal, previous/next navigation and the existing topic-level progress store.
- The dashboard also filters the checklist to review topics while preserving overall and full-section progress counts.
- Removing a reviewed topic moves focus to the next question, a recovery action or the checklist summary instead of leaving focus on the page body.
- Topic translations remain Phase 6 work; flashcards retain the actual content language until each translation is published.

Phase 4 validation uses a production preview on port 3101 because another worktree owns port 3100.
All 844 unit tests pass with 96.84% line coverage.
All 205 desktop/mobile E2E tests pass, with nine device-specific skips.
The keyboard flow covers section selection, review filtering, empty recovery, answer reveal and previous/next navigation.
Navigation clears the revealed answer even when returning to a previously viewed card.
Desktop and 320-pixel mobile layouts were checked in both themes, including search focus visibility and empty review states.
Standards and spec reviews have no unresolved findings.

A subsequent PR review reproduced skipped questions when a reviewed topic was marked learned from a later card.
The deck now adjusts its index for all removed cards, and browser regressions verify that the next topic starts at its first question.

## Phase 5 progress

- All 196 public pages and 196 Open Graph images now prerender, with `dynamic = 'error'` preventing a silent return to request-time rendering.
- Metadata, canonical URLs, reciprocal language alternatives, the sitemap and escaped JSON-LD share the registry and localized page information.
- Share images use a locally bundled font with Vietnamese glyphs and remain crawlable.
- Production requires a validated `SITE_URL` at build time; CI validates an explicit HTTPS fixture origin and Docker retains the build argument.
- Accessibility checks cover representative templates and every animation family in both themes on desktop/mobile, plus search and revealed answers.
- Browser audits fixed search naming, text/syntax contrast, 200% text resizing and navigation visibility at responsive boundaries.
- The reproducible performance audit records three Lighthouse mobile lab runs on each of four routes and a separate browser interaction sample.

Detailed measurements, reproduction commands, release configuration and the limits of the lab/accessibility evidence live in [the Phase 5 audit](./PHASE_5_AUDIT.md).
The actual production domain remains a deployment configuration input; no deployment or field Core Web Vitals result is claimed.
The remaining implementation phase is all 81 Vietnamese topic translations and all 14 Vietnamese section overviews.
Phase 5 validation passes 853 unit tests with 94.48% line coverage and 222 E2E tests, with ten device-specific skips.
The final standards and spec reviews have no unresolved findings.

## Phase 6 progress

| Batch | Sections                  | Topics | Status      |
| ----- | ------------------------- | ------ | ----------- |
| 1     | Real-time updates         | 4      | In review   |
| 2+    | The remaining 13 sections | 77     | Not started |

Batch 1 translates the four Real-time updates topics and the section overview, the same section that piloted the English template.
Vietnamese pages use fixed headings: Tóm tắt, Ý chính, Cân nhắc, Câu hỏi phỏng vấn and, inside the deep dive, Cơ chế hoạt động, Trường hợp biên, Lỗi thường gặp and Tài liệu tham khảo.
Established English terms such as polling, WebSocket, cursor, jitter and backoff stay in English; the surrounding explanation is Vietnamese.
Code comments and sample strings are translated, while identifiers, APIs and protocol fields stay unchanged.
Reference links keep the English URLs with Vietnamese link text.
Content tests apply the one-screen rules to Vietnamese headings and check that each translation keeps its English file's visual, related topics, number of interview questions, code block languages and reference URLs.
Flashcard tests now build cards from every topic file, including translations.
The fallback notice E2E test moves to a topic that is still untranslated, and a new E2E test reads the whole Vietnamese section with `inLanguage: vi` JSON-LD and no fallback notice.
Vietnamese summaries follow the same 820-pixel desktop budget as Batch 2 onwards; trade-off cells are kept short enough not to wrap, since each wrapped row adds about 20 pixels.
Linux CI renders text slightly taller than macOS, so a page measured at 819 pixels locally failed at 820 in CI; keep at least one line (about 25 pixels) of local headroom.
The English pilot pages predate that budget and measure 954 to 1075 pixels, so they do not meet it yet.
Batch 1 validation passes 892 unit tests with 94.48% line coverage and 225 E2E tests, with eleven device-specific skips.
