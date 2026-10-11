# Review: "Push updates" draft

Draft: `push-updates.md`. Revised draft with the fixes I'm confident about: `push-updates.revised.md`.
I ran the examples on the scratch server (an SSE handler in an `.mjs` page, compilers in `assets/scripts.js`,
Puppeteer driver `run.mjs`, `reconnect.mjs`, `text.mjs`, `wrap.mjs` in this directory). Scratch files are restored
and deleted (`git status` clean).

Findings are ranked by importance.

---

## 1. The signal example reconnects on every message (bug, contradicts the page's own caveat)

**Passage:** `#signal`: `<div id="inbox" data-changes=...>` + `up.reload(element)`.

**Problem:** `up.reload(element)` swaps the connected element itself. Its destructor closes the
`EventSource` and the new element opens a new one, so every signal costs a disconnect, a reconnect and a reload.
Changes made between the reload's response and the new connection are lost. The page's own caveat
"Don't replace the connected element" says not to do this.

**Evidence:** Scratch run: 3 signals per connection, after 4 s there were 6 connections and 5 destructor calls.
With the attribute on a wrapper and `up.reload(element.firstElementChild)`: 3 reloads, 1 connection, 0 destructor calls.
Adding `[up-keep]` (as the caveat suggests) is no fix: a keepable *target* makes the whole render a no-op
(`fragment.js:1018` `findKeepPlan` → `update_steps.js:60` `_executeKeepEverythingStep`). `up.reload('#inbox:content')`
is not supported (throws "not a valid selector").

**Fix (applied):** wrapper element carries the connection, the compiler reloads its child, plus one sentence saying why.
Alternatives in "Open questions".

## 2. A finished stream starts over (missing, breaks progress and token streaming)

**Passage:** `#events` (progress) and the whole SSE part. Nothing says how a stream ends.

**Problem:** When the server ends an event-stream response, `EventSource` reconnects after `retry` (default ~3 s)
and the stream runs again. A finished job's progress or an LLM answer would replay; with the `:after` example,
items would be appended twice.

**Evidence:** `reconnect.mjs`: server sends 2 messages then ends the response with `retry: 500`. In 2.5 s the browser
connected 5 times, received 6 messages, and sent `Last-Event-ID: 1` on each reconnect.

**Fix (applied):** new subsection "Progress and streamed text": tokens are appended as text, a final `done` event
carries the final HTML without the connecting attribute, and swapping it closes the connection (like the server stops
`[up-poll]` by omitting the attribute). Tested (`text.mjs`): text accumulated to "Hello world" (the leading space of
`data:  world` survives), final HTML swapped, 1 connection, no reconnect even though the server ended the response.
Also mentioned `204 No Content` (stops reconnecting per the SSE spec) in the caveat.

## 3. The WebSocket reconnect code leaks a socket

**Passage:** `#websocket`, `if (!destroyed) setTimeout(connect, 2000)`.

**Problem:** If the socket closes (server restart) and the element is destroyed during the 2 s wait, the destructor
runs on the already closed socket, then the timer fires `connect()` and opens a new socket that nobody closes.
Its message handler renders with a detached `origin` (rejects with "Could not find a layer").

**Evidence:** reading the code; `up.Change.FromContent#_cannotMatchLayer` (`classes/change/from_content.js`) for
the render error. (WebSockets can't be served by the scratch server, so not run.)

**Fix (applied):** check `destroyed` at the start of `connect()`; the `close` listener schedules unconditionally.
Same line count, one sentence of explanation.

## 4. HTML broadcast to everyone can't be per-user (missing, a security/correctness trap)

**Passage:** `#html`.

**Problem:** A pushed message is rendered once and broadcast. Readers coming from Turbo Streams know this, others
will push a fragment containing `current_user`-dependent content (edit buttons, "you" labels) or leak data.
The page already has the perfect alternative (the signal pattern), but doesn't say when to prefer it.

**Fix (applied):** an `[important]` admonition pointing to `#signal`.

## 5. Six-connection limit over HTTP/1.1 (missing caveat)

**Problem:** Each `EventSource` holds one of the browser's 6 HTTP/1.1 connections per host, shared across tabs.
A few tabs block all requests to the site. MDN warns about this prominently.

**Evidence:** I hit it by accident: my driver kept 6 pages with open streams, and the 7th page's `goto()` timed out
after 30 s.

**Fix (applied):** caveat "Connections per browser", recommending HTTP/2.

## 6. `up.CannotMatch` when the element is missing; multiple elements per message fail

**Passage:** "Each message carries one element with an ID."

**Evidence:**
- Missing ID: `up.render()` rejects with `up.CannotMatch: Could not find common target in current page and response
  (tried selectors [#nope] in layer "origin")`; Unpoly logs it, and the browser reports an uncaught promise
  rejection. Not silent, but noisy, and likely when the connection lives in the layout (which the caveat recommends).
- Two elements in one message: rejects with `Expected a single element, but got 2 nodes`
  (`response_doc.js` `_parseFragment` → `element.js:827` `extractSingular`). htmx's main multi-target story
  (oob/partials) needs an answer.

**Fix (applied):** one sentence "send one message for each element", one short paragraph on the `CannotMatch`
rejection with `.catch(() => {})` when it is expected.

## 7. `[up-keep]` advice is incomplete

**Passage:** caveat "Don't replace the connected element ... or give it an [up-keep] attribute".

**Evidence:** Scratch run, navigation replacing `<main>` around the connected element: without `[up-keep]` 1 destructor
call and 2 connections; with `[up-keep]` 0 destructor calls and 1 connection, so the compiler and its connection
survive. But (a) it only works when the element is a descendant of the swapped fragment and the response contains a
matching element (`findKeepPlan`, partner lookup), and (b) the kept element keeps all its children, so in the
chat example `#messages` would never be updated by navigation. And it is a no-op for the element's own reload (#1).

**Fix (applied):** say it keeps children too.

## 8. Integration with the chapter (not in the draft file, but needed)

- Missing `@page push-updates` directive (added). It needs a `toc.yml` entry; the plan puts it in LIVE FRAGMENTS
  presumably, after `polling`/`hungry-elements`.
- `live-fragments.md` lead says "There is no persistent connection and nothing new to run on the server."
  (plan.md:202 wants the overview to defuse realtime connotations.) That stays true for the topic's built-in
  features, but the overview's "Also in this topic" needs a line, e.g.
  "To update fragments when your server pushes changes over Server-Sent Events or a WebSocket, see [[push-updates]]."
- No `@learn-ref` candidates (no Unpoly feature is explained here). Probably no `@signature` (not a core feature).
- The persona report suggested a Getting-started "Coming from htmx or Turbo" page; Turbo Streams/`hx-sse`
  should link here.

## 9. Missing reader questions (applied as one-liners)

- **Auth / CSRF:** cookies are sent with same-origin `EventSource`/WebSocket; no custom headers are possible;
  GET streams need no CSRF token; a WebSocket handshake is not same-origin-limited (cross-site WebSocket hijacking),
  so check `Origin`. Added as a caveat "Authentication".
- **Rails / Action Cable:** one sentence: call `up.render()` from the channel's `received` callback.
  (Writer-brief pattern 8 is about Ruby examples; this has no Ruby code, so no "works with any backend" note needed.)
- **Last-Event-ID needs `id:` fields:** the draft says the server "can send missed messages using the `Last-Event-ID`
  request header" but not that messages need `id:` for the browser to send it. Fixed.
- **304:** `up.reload()` sends `If-None-Match`/`If-Modified-Since` (`fragment.js:1861` `conditionalHeaders`), so the
  signal pattern profits from [[conditional-requests]]. One sentence added; cut it if you find it off-topic.

## 10. Verified correct (no change)

- `up.render({ fragment })` derives the target from the fragment's root: `from_content.js` `_improveOptionsFromResponseDoc`
  sets `target ||= responseDoc.rootSelector()` → `up.fragment.toTarget(...)`. Run: swap worked.
- Local-content renders abort by default: `fragment.js:254` `renderOptions.abort: 'target'`,
  `update_layer.js:121` aborts unless `abort === false`. Run: user clicked a slow link targeting `#unread-count`,
  a push arrived during the request. Without `abort: false` the user's request was aborted
  ("Aborted request to GET /push-slow"); with it, the user's response rendered afterwards. Note: it aborts requests for
  the fragment *or its descendants*, and with `abort: false` a slower user response may overwrite newer pushed content.
- `{ origin }` picks the origin's layer: `layer.js:315-317` sets `layer: 'origin'` when an origin is given
  (the documented default `'origin, current'` is equivalent here). Run: with an overlay open, the push updated the
  root layer; without `origin` it rejected with `CannotMatch ... in layer "current"`.
- `{ target: '#messages:after', document }` appends the matching element's children. Run: two messages appended
  `<p>Hi there!</p>` twice after `<p>first</p>`.
- Multi-line `data:` joined with `\n` (run: content `"\n  5 new\n"`). Named events only reach their listeners
  (run: `<progress>` value 75).
- `up.reload(element)`: URL from `[up-source]` (`fragment.js:1860`), `reloadOptions` has `scroll: 'keep', focus: 'keep'`
  and no `navigate`, so no history (`fragment.js:270-274`).
- Links: `/targeting-fragments#appending-or-prepending` (targeting-fragments.md:113), `/preserving-elements`,
  `/aborting-requests`, `/layer-option`, `/enhancing-elements`, `/up.destructor` (script.js:530), `/up.compiler`,
  `/polling` all exist.
- `new WebSocket('/relative')`: relative URLs (and http/https schemes) are accepted since Chrome 125, Firefox 124,
  Safari 17.3 (all early/mid 2024), so within "the last two years". From memory of MDN compat data; not tested here.

## 11. House style and language (minor)

- Blurb: the first sentence "The server can update fragments without waiting for a request" describes the server,
  not what the reader gets, and "without waiting for a request" is vague. Revised: "You can update fragments when the
  server pushes a change, ...". "A compiler of about ten lines" is inaccurate for the WebSocket version (~20 lines);
  changed to "a short compiler".
- Event-stream bodies are fenced as ```` ```http ````. In the pages, `http` is used for headers and requests.
  `text/event-stream` is not HTTP syntax; changed to ```` ```text ````. The trailing blank line inside the fence is
  meaningful but invisible; added "A message ends with a blank line" once.
- Markdown definition lists (`term` / `: definition`) render (Kramdown GFM, styled in `prose.sass:50`) but no current
  guide page uses them. Fine by documentation.md:632, just noting it's a first.
- "Things to watch" is a meta-ish heading; acceptable for a caveats list, but "Running connections in production"
  would name the thing. Not changed.
- Prose is plain and mostly free of AI patterns: no em-dashes, no closers, no triads. Kept the voice.
- Scope: it does not turn into a feature list. Not covered from htmx on purpose (and fine to leave out): POST-initiated
  streams (`fetch` + `ReadableStream`), backoff with jitter, queued sends, JSON envelopes, "release UI early".
  Pausing in background tabs is prose only, which I think is the right depth.

## Open questions

1. Signal pattern shape: `element.firstElementChild` (applied, simplest) vs. a selector in the message
   (`data: #inbox` → `up.reload(event.data, { origin: element })`), which also gives one layout-wide connection that
   reloads many fragments (htmx's multi-target case), at the cost of a missing-element guard.
2. Should the signal reload also pass `{ abort: false }`? Today it aborts the user's pending requests inside `#inbox`
   (like polling does, documented in polling.md), while the HTML section recommends not aborting. Readers will notice
   the inconsistency. With `abort: false`, overlapping reloads can finish out of order.
3. Keep the "Progress and streamed text" subsection at this depth, or split token streaming into its own `{#text}`
   heading so it's findable ("LLM streaming" is a common search)?
4. Placement: Live fragments chapter after Hungry elements, plus an "Also in this topic" line on the overview?
