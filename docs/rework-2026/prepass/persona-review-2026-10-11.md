# Persona review of the reworked unpoly.com (localhost:4567, 3.14.3)

Read-only review. The start page was read as HTML, everything else as `.md`. All 108 Learn/API index pages were also fetched and grepped, to check whether gaps are real.

## Persona A: backend developer (Rails/Django/Laravel)

**Path:** `/` → `/learn` → `/start/overview` → `/install` → `/start/links` → `/start/forms` → `/start/overlays` → `/start/elements` → `/start/api` → `/start/next` → `/main` → `/forms` → `/validation` → `/reactive-server-forms` → `/overlays` → `/subinteractions` → `/backend-integration` → `/protocol-implementations` → `/server-protocol` → `/failed-responses`

**Understood:** "I keep my controllers and templates. I put `up-target` / `up-layer=new` / `up-validate` on links and forms, and Unpoly fetches my normal pages and swaps just the part I name. Overlays and dependent selects come almost for free, and the server stays the source of truth."

**Would try it?** Yes, quickly. The "start with one screen" message, CDN install with no build step, the Rails controller snippets and the protocol-library table (Django, Laravel, Rails) all fit. Open doubt: "Rails already ships Turbo. Why switch?" No page answers that.

**Stuck / misled:**
- `/start/forms`: "This is the one thing Unpoly asks of your backend: … respond with an error code like HTTP 422". `/backend-integration`: "Forms work the same way, with one convention". `/start/links`: "Nothing on the server needs to change." The home page then advertises `<form up-validate>` and reactive forms "wired with one attribute". Only `/validation#backend` and `/reactive-server-forms#server` reveal that the server needs a third branch that **must not save** when `X-Up-Validate` is present. Without that branch, a valid blur-validation creates the record.
- `/start/overlays`: "Overlays can also close automatically when the user completes their task, passing a result value…" This sentence has no link, so I had to find `/overlays#closing-with-a-result` myself.
- Django note: invalid forms return 200 by default. `/validation` does link to "customize failure detection", which is fine.

## Persona B: htmx / Hotwire-Turbo developer

**Path:** `/` (read "Is Unpoly right for you?" twice) → `/learn` → `/links` → `/handling-all-links` → `/preloading` (via links) → `/targeting-fragments` → `/navigation-defaults` → `/live-fragments` → `/hungry-elements` (via live-fragments) → `/polling` (summary) → `/network` → `/caching` → `/restoring-history` → `/backend-integration` → `/server-protocol` → `/optimistic-rendering` → `/api`

**Understood:** "It is Turbo Drive plus Frames plus a modal system plus server-validated forms, with more defaults built in. `hx-boost` is `followSelectors.push('a[href]')`, out-of-band swaps are `[up-hungry]`, and Turbo Frames are `[up-target]`. Unlike htmx, it deliberately only lets links and forms make requests."

**Would try it?** Probably, for an app that is heavy on CRUD and overlays. The htmx framing on the home page is honest and gracious. Hesitations: no answer on real-time push (my Turbo Streams use case), no size figure, and I had to build my own htmx/Turbo-to-Unpoly mapping by reading six pages.

**Stuck / misled:**
- No page compares Unpoly with Turbo (the only mention is native shells on `/`), and the htmx comparison lives only on the start page. There is no concept mapping.
- WebSockets/SSE: `/live-fragments` says "There is no persistent connection and nothing new to run on the server." It doesn't say what to do if you need push. "websocket", "EventSource" and "server-sent" appear nowhere in the guides.
- `/` says that on Back, Unpoly "restores the exact screen state". `/restoring-history` says it re-requests the URL (or uses the cache) and replaces `<body>`, then restores scroll and focus. That is not Turbo's snapshot, and the wording made me expect one.
- `/targeting-fragments#optional-targets`: "By default Unpoly expects all targeted fragments to be present … an error `up.CannotMatch` is thrown". For links (the example context), the default is actually to fall back to `:main`, which is stated only ~180 lines later.

## Persona C: React/SPA developer, skeptical

**Path:** `/` → `/learn` → `/start/overview` → `/start/elements` → `/start/api` → `/scripting` → `/islands` → `/up.compiler` → `/optimistic-rendering` → `/templates` (skim) → `/overlays` → `/network` → `/restoring-history` → `/navigation-defaults` → `/api` → `/live-fragments`

**Understood:** "The server owns state and HTML. The browser gets 'smart links' plus a lifecycle hook (compilers) to attach JS to elements as fragments come and go. You can mount React components as islands for genuinely client-heavy widgets, with `[up-keep]` to keep their state across updates."

**Would try it?** For an internal CRUD/admin app, yes. The "Choose another tool when…" list on `/` earned trust, and `/islands` is concrete and honest (the "An island owns its subtree" section is excellent). I would not use it for my editor-style product, and the docs agree. Skeptical points: optimistic UI and real-time.

**Stuck / misled:**
- `/up.compiler`: "Registers a function to be called when a matching element is inserted into the DOM." I read this as a MutationObserver, so it should fire for React-rendered elements too. `/islands` says the opposite: "Elements rendered by the framework are not compiled."
- `/` lists "Optimistic rendering" among the "Built for tough requirements" headline features ("Previews revert cleanly when anything fails"). `/optimistic-rendering` opens with "a recent feature … inherently difficult in a server-driven approach. Expect more changes". That mismatch made me trust the home page less.
- Same "exact screen state" expectation on Back as persona B.
- Real-time (same gap as B), library size (same as B), TypeScript types (not mentioned anywhere).

---

## Findings worth the maintainer's time

1. **No page compares Unpoly with Turbo/Hotwire, and the htmx comparison exists only on the home page.** A (Rails ships Turbo) and B asked "why not Turbo?", and C asked about htmx. `/`: the only Turbo mention is "Hotwire ships ready-made adapters for that". A grep of all guides finds no htmx/Turbo/Hotwire mention outside `/`. *Fix:* add a short Getting-started page "Coming from htmx or Turbo" with a concept mapping (hx-boost → `/handling-all-links`, hx-swap-oob/Turbo Streams → `[up-hungry]`, Turbo Frames → `[up-target]`, frame lazy-load → `[up-defer]`), naming what Unpoly does not have (push streams, native adapters). *Confidence: high that the gap exists; high that A and B want it.*

2. **The docs understate the server work for `[up-validate]`, and following them literally saves records on blur.** `/start/forms`: "This is the one thing Unpoly asks of your backend". `/backend-integration`: "Forms work the same way, with one convention". `/` reactive forms: "wired with one attribute". Only `/validation#backend` says the server "must not save" on `X-Up-Validate`. *Fix:* in `/forms` and `/backend-integration`, name the `X-Up-Validate` branch as the second convention in imperative form ("when this header is present, don't save"), and scope the "one thing" sentence in `/start/forms` to submissions. *Confidence: medium-high.*

3. **Real-time/push is never addressed.** B (Turbo Streams) and C asked "how do I push updates?" `/live-fragments`: "There is no persistent connection and nothing new to run on the server." No guide mentions WebSocket, SSE or EventSource. *Fix:* add one paragraph to `/live-fragments` saying Unpoly has no push channel and showing that your own WebSocket/EventSource handler can call `up.reload()` / `up.render()`. *Confidence: high that the gap exists.*

4. **The home page overclaims history restoration.** B and C both expected a Turbo-style snapshot. `/`: "restores the exact screen state when the user presses Back". `/restoring-history`: "The restored URL is requested with GET… The response's `<body>` replaces the current `<body>`", then scroll and focus are restored. *Fix:* reword to "brings back the page with its scroll positions and focus when the user presses Back". *Confidence: medium (please verify whether anything beyond scroll/focus/selection is restored).*

5. **The `up.compiler()` summary reads like a MutationObserver.** `/up.compiler`: "Registers a function to be called when a matching element is inserted into the DOM." This contradicts `/islands`: "Elements rendered by the framework are not compiled." *Fix:* "…when Unpoly inserts a matching element: on the initial page, with every fragment update, or via `up.hello()`." *Confidence: high.*

6. **Optimistic rendering is advertised as a headline capability, but its own page calls it experimental.** B and C both noticed. `/`: "Optimistic rendering … Previews revert cleanly when anything fails" under "Built for tough requirements". `/optimistic-rendering`: "a recent feature … inherently difficult in a server-driven approach. Expect more changes". *Fix:* either replace this home card with a more settled feature (e.g. lazy loading/polling), or soften the page note to say what is stable (previews) versus what is still evolving. *Confidence: medium (this is a positioning call).*

7. **Unpoly's own size is never stated, while the home page frames htmx as the "minimal footprint" choice.** B and C asked "how big is it?" `/`: "Small primitives give you maximum control and a minimal footprint." The only KB figure on the whole site is for `unpoly-migrate.js` (9.2 KB, `/changes/upgrading`). *Fix:* state the gzipped JS+CSS size on `/install` (and optionally next to "Two lines, no build step" on `/`). *Confidence: high that the figure is missing; medium that it matters.*

8. **Eight guide pages link to German MDN.** For example `/targeting-fragments`: `[Element](https://developer.mozilla.org/de/docs/Web/API/Element)`. The same link appears in `/target-derivation`, `/focus`, `/placeholders`, `/providing-html` (2×), `/scrolling` and `/layer-option`. *Fix:* replace `/de/` with `/en-US/` (or drop the locale). *Confidence: high; trivial fix.*

## Other notes (no action needed)

- `/targeting-fragments#optional-targets` says the default for a missing target is to throw `up.CannotMatch`, but for links/forms the default is to fall back to `:main`. This is resolved later on the same page.
- `/start/overlays` mentions auto-closing with a result value but doesn't link to it.
- The home snippet loads `.min` files and `/install` loads the non-minified ones. Harmless, but a careful reader may wonder which is right.
- TypeScript types are not mentioned anywhere. Only persona C asked.
- The CSRF default (`<meta name="csrf-token">`) is Rails naming. Django users have to configure it, which `/server-protocol` covers.
- The "Is Unpoly right for you?" section and the Carson Gross quote were the most persuasive part of the site for B and C.
- Getting started (8 short pages) worked well. All three personas got the core loop within 5 pages.
- `/islands` "An island owns its subtree" pre-empted C's main objection very well.
- `/subinteractions` and the `up-accept-location` example sold overlays to A immediately.
- Cache numbers (15 s fresh, 90 min evict) are consistent across `/network`, `/caching` and `/network-issues`.
