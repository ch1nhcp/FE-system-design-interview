# Phase 5 audit

Recorded on 2026-11-28 against a Next.js 16.2.9 production build, served on port 3101 because another worktree owns port 3100.
The build includes all 81 English topics and 14 section overviews, with Vietnamese UI and the documented content fallback.
Vietnamese topic and overview translations follow in Phase 6.

## Static delivery

The baseline build listed locale pages as dynamic and returned `Cache-Control: private, no-cache, no-store`.
Only four entries existed in the prerender manifest.
Nested layouts now set the validated request locale before rendering translated server components.
The locale root uses `dynamic = 'error'`, so accidental request-only data access fails the build instead of silently switching pages to dynamic rendering.
The build now prerenders all 196 public pages and all 196 share images with no runtime fallback.
The E2E suite checks `x-nextjs-cache: HIT` on representative pages in both locales and requests every URL published in the sitemap.
The locale setup follows [next-intl's static rendering guidance](https://next-intl.dev/docs/routing/setup#static-rendering).

## Performance

Run a production preview, then execute `pnpm audit:performance`.
Use `AUDIT_BASE_URL` to select another preview and `AUDIT_OUTPUT_DIR` to choose the report folder.
The script writes full Lighthouse HTML/JSON reports and a compact summary under the ignored `artifacts/performance/` directory.
It runs three cold navigations per route using Lighthouse 13.6.0's default simulated mobile throttling and Playwright Chromium 159.0.8154.6 on Node.js 24.15.0.

| Route                | Performance score, all three runs | Median LCP | Median CLS | Median TBT |
| -------------------- | --------------------------------- | ---------- | ---------- | ---------- |
| `/`                  | 100                               | 905 ms     | 0          | 8.5 ms     |
| `/topics/websockets` | 100                               | 905 ms     | 0          | 10.5 ms    |
| `/vi/framework`      | 100                               | 905 ms     | 0          | 8 ms       |
| `/flashcards`        | 100                               | 1054 ms    | 0          | 10 ms      |

Across all twelve runs, LCP ranges from 904 to 1056 ms, CLS remains zero and TBT ranges from 7 to 14.5 ms.
An additional unthrottled desktop interaction walkthrough reveals an answer, moves cards, marks a topic for review and types into search.
Its Event Timing observer records 43 event entries at or above the 16 ms observation threshold, with a maximum duration of 48 ms.
This is a laboratory interaction sample, not a field INP measurement.
TBT is a navigation diagnostic, not a replacement for INP.

The [Core Web Vitals targets](https://web.dev/articles/vitals) are LCP at most 2.5 seconds, INP at most 200 ms and CLS at most 0.1 at the 75th percentile of real visits, split by device class.
These local reports establish a reproducible lab baseline and do not establish a production field percentile.
After deployment and sufficient traffic, evaluate the deployed origin through CrUX/PageSpeed Insights or a real-user measurement service.

## Accessibility

`e2e/accessibility.spec.ts` uses axe-core 4.14.1 through Playwright, including WCAG 2 A/AA, 2.1 A/AA, 2.2 AA and best-practice rules.
The matrix covers 13 representative routes in light and dark themes on desktop and mobile, plus expanded flashcards and populated search results.
It includes the dashboard, Vietnamese UI, RADIO, section lists, code panels, diagrams and every animation family.

The initial browser audit reproduced these defects:

- Search displayed a shortcut that was missing from its accessible name.
- Muted text on muted surfaces fell below 4.5:1 contrast.
- Inline code in navigation inherited the insufficient muted contrast.
- The default syntax theme included orange tokens with only 3.48:1 contrast on white.

Search now includes the displayed text in its name and declares its keyboard shortcuts.
The light muted-foreground token is darker, selected search breadcrumbs follow the selected foreground and inline code uses the foreground token.
Shiki now uses its bundled high-contrast GitHub themes in both modes.
No axe violations remain in the checked matrix.

Keyboard walkthroughs cover the skip link, section selection, filter selection, answer reveal, previous/next cards, empty-state recovery, search selection, Escape and focus return.
Existing topic tests also check keyboard-operable disclosures and visual tabs, reduced-motion animation behavior and mobile navigation.
Visual checks cover 320-pixel reflow, desktop reading, visible focus and English/Vietnamese share images, including long titles and Vietnamese diacritics.
Text-only enlargement to 200% exposed clipped header controls and an oversized visual column.
Named container queries now adapt the header, section navigation and reading columns to the available space and root font size.
Regression coverage checks both UI languages at 200% text and the drawer/sidebar transition boundaries at normal and doubled text size.
Automated checks and visual/keyboard walkthroughs do not constitute a complete assistive-technology conformance assessment, as [W3C's evaluation guidance](https://www.w3.org/WAI/test-evaluate/tools/) explains.

## Discovery and release configuration

`SITE_URL` is the canonical origin used by metadata, JSON-LD, the sitemap, robots and share image URLs.
Production builds require it and reject values containing credentials, paths, queries or fragments.
Development defaults to `http://localhost:3000`.
The production validation build uses `https://study.example.org` as an explicit test fixture, not as a claimed deployment domain.
The actual deployment domain has not been supplied yet.
Set it before building the release; changing only a runtime variable cannot rewrite prerendered metadata.
The Docker builder accepts `--build-arg SITE_URL=https://your-domain.example` for the same reason.

All public pages expose a canonical URL, reciprocal English/Vietnamese alternatives, an English `x-default`, Open Graph metadata and a Twitter large-image card.
The sitemap lists 196 unique canonical URLs with reciprocal language alternatives and no redundant `/en` URLs.
JSON-LD describes a page, section collection or learning resource and its parent website, escaping `<` before embedding authored text.
Topic schemas preserve the actual content language while translations are pending.
Share images are static 1200 by 630 PNGs, use a locally bundled OFL-licensed IBM Plex Sans font and remain crawlable through robots rules.
The E2E suite verifies image responses, dimensions, unknown-image 404s, delivered metadata and sitemap destinations.

## Standards

The review found duplicated site-name copy outside the locale messages and a responsive navigation gap caused by differently sized containers.
Both are fixed, and the final standards review has no unresolved findings.

## Spec

The review found that robots rules blocked the share images and confirmed the responsive navigation gap.
Both are fixed with browser regressions, and the final spec review has no unresolved findings.

## Verification

The production build, type-check, lint and formatting pass.
All 853 unit tests pass with 94.48% line coverage.
All 222 desktop/mobile E2E tests pass, with ten device-specific skips.
