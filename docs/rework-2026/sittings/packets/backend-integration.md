# Sitting packet: Backend integration chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: A44-A48, B19 (410a93574). Decided, applied separately: C15 (open item 9D,
/optimizing-responses #version becomes "Detecting a full page load" plus the #title sentence).
Deferred duplication item carried here: C14. Its /polling side stays as is (Live fragments packet, polling
pointer 1, lean "fix the literal copy at Backend integration"), so the fix lands on /backend-integration.

| Page | Pointers |
|------|----------|
| backend-integration | 1 |
| optimizing-responses | 1 |
| conditional-requests | 0 |
| handling-asset-changes | 0 |
| server-protocol | 0 |


## Backend integration (`/backend-integration`, 112 lines)

Chapter overview: plain HTTP by default, rendering only what is targeted, skipping unchanged content,
reacting to new deployments, steering the frontend from the server.

**Changed since writing**
- 410a93574 (A44): "Unpoly extracts the `.profile` element from the response and discards the rest,
  except [hungry elements](/hungry-elements) and the `<head>`." (backend-integration.md:22-23)
- 410a93574 (B19): "Steering the frontend" now lists the whole response-header family, then says what the
  example does (backend-integration.md:93-96).

### 1. Two map sections copy their detail pages (C14, deferred duplication)

a) The "1 KB" sentence, third copy:

> When nothing changed, the server can answer with an empty `304 Not Modified`
> and Unpoly finishes the render pass without changes.
> The exchange then costs about 1 KB and no rendering time.

(backend-integration.md:65-67)

> When Unpoly reloads a fragment that has not changed, your server can answer with an empty `304 Not Modified`.
> The exchange then costs about 1 KB and no rendering time.

(conditional-requests.md:4-5; "…which costs about 1 KB and no rendering time" also at polling.md:156)

b) The deployment opener:

> Since Unpoly updates fragments instead of loading new pages, users keep running the JavaScript and CSS they loaded
> when they opened the page.

(backend-integration.md:75-76)

> After you deploy a new version of your app, users with an open page keep running the old JavaScript and CSS,
> since Unpoly updates fragments instead of loading new pages.

(handling-asset-changes.md:4-5)

(a) is a literal copy. (b) is the same sentence turned around. The chapter's angle is the server developer's.
So the overview can say what each feature asks of the server: for (a), a version check instead of a render;
for (b), nothing beyond fingerprinted asset URLs in the `<head>`. The family sentence at backend-integration.md:85
("notify the user, reload at the next navigation, or swap in the new stylesheets") is the teaser of the
three reaction sections, so it stays. (Pattern 5)
Facts: the poll interval defaults to 30 s (radio.js:46). Assets are compared by their outer HTML
(script.js:961-973), so an unchanged URL is never detected, and only responses with a `<head>`
are compared (from_content.js:86-89).

- **A.** Re-angle both.
- **B.** Re-angle only (a), the literal copy.
- **C.** Leave both.

**Lean: A (medium).** Draft for backend-integration.md:65-67:

```md
When nothing changed, the server can answer with an empty `304 Not Modified`, and the fragment stays as it is.
For a fragment that polls every 30 seconds, your server then compares a version string
instead of rendering the page each time.
```

Draft for backend-integration.md:75-77:

```md
Users keep running the JavaScript and CSS of the page they opened, even after you deploy a new version.
Your deployment needs no extra step for Unpoly to notice. As long as your asset URLs are fingerprinted,
Unpoly emits an `up:assets:changed` event when a response's `<head>` links different scripts or stylesheets:
```


## Optimizing responses (`/optimizing-responses`, 273 lines)

Rendering only the target (title, fail target), different content for overlays, for Unpoly requests and for
layer context, caching optimized responses and how cache entries are matched.

**Changed since writing**
- 410a93574 (A44): the intro says hungry elements and the `<head>` are also read (optimizing-responses.md:6-7).
- 410a93574 (A45): "`X-Up-Target` does not list [hungry elements](/hungry-elements) like [flashes](/flashes).
  Keep rendering them in shortened responses, or they stop updating." (optimizing-responses.md:37-38)
- 410a93574 (A46): `Vary` also protects the browser's HTTP cache and CDNs (optimizing-responses.md:166-168).
- Pending: open item 9D rewrites #version (optimizing-responses.md:108-130) and adds a sentence to #title.

### 1. The multi-target example targets `.flashes` right after "flashes are not in the header"

> `X-Up-Target` does not list [hungry elements](/hungry-elements) like [flashes](/flashes).
> Keep rendering them in shortened responses, or they stop updating.
>
> A request may target [multiple fragments](/targeting-fragments#multiple).
> The header then lists all selectors, separated by commas, and the response should contain an element for each:
>
> ```http
> X-Up-Target: .menu, .flashes
> ```

(optimizing-responses.md:37-45)

The A45 sentence was inserted above an older example. Now the reader is told that flashes are never in the header,
and the next example has them in the header. Both are true: a link can target `.flashes` explicitly, but a
`[up-flashes]` element is hungry and is matched only after the response arrives (update_layer.js:28-40 vs.
:172-181, radio_hungry_spec.js:189). Without that distinction, the two read as a contradiction.
Any other second selector shows the same thing.

- **A.** Use a non-hungry second selector.
- **B.** Leave it.

**Lean: A (strong).** Draft for optimizing-responses.md:44:

```http
X-Up-Target: .menu, .breadcrumbs
```


## Conditional requests (`/conditional-requests`, 188 lines)

How a reload becomes conditional, ETags, modification times, choosing one, per-fragment versions,
rendering nothing.

**Changed since writing**
- 410a93574 (A47): "The headers of the initial page load are not visible to scripts. To make the first reload of such
  a fragment conditional, render its version into an `[up-etag]` or `[up-time]` attribute." (conditional-requests.md:22-23)

No pointers. This page owns the "1 KB" sentence. The copy is fixed on /backend-integration (pointer 1a).
(Checked: `up.reload()` sends both `If-Modified-Since` and `If-None-Match` when both are known, fragment.js:1869-1880.
Revalidation goes through `up.reload()`, so it is conditional too (from_response.js:88). The response header only
fills a missing `[up-etag]` (addition.js:97-100). An empty body is skipped before `up:fragment:loaded`
(from_response.js:13, fragment.js:291-293), and `{ onRendered }` is not called for an empty result (render_job.js:85).
#rendering-nothing has six inbound links (protocol.js:150, network.js:59, fragment.js:768, :850, request.js:975,
render-lifecycle.md:77), so this page is its owner.)


## Reacting to new deployments (`/handling-asset-changes`, 170 lines)

Detecting a new version, notifying the user, reloading at the next navigation, loading new assets,
polling for a version, backend versions, aborting the render pass.

**Changed since writing**
- 410a93574 (A48): "Responses without a `<head>`, like [shortened responses](/optimizing-responses#target), are not
  compared. If your server shortens every response, use the [polling detector](#polling) below." (handling-asset-changes.md:40-41)

No pointers. The overlap with the overview is pointer 1b on /backend-integration.
(Checked: default assets are `link[rel=stylesheet]`, `script[src]` and `[up-asset]`, minus `[up-asset=false]`
(script.js:85-92). Preventing `up:assets:changed` aborts the render pass before any change, because it is emitted
with `assertEmitted` in `_onPlanApplicable()` (script.js:957-964, from_content.js:86-90). `up-interval="120_000"`
parses, since `up.util.parseNumber()` strips underscores (util.js:2441-2443). The banner example guards against
repeated events. That matters, because new assets are never inserted, so the event fires again on every later render.)


## Server protocol (`/server-protocol`, 126 lines)

What the server can read, what it can send, other conventions (CSRF, method wrapping, `_up_method` cookie).

**Changed since writing**
- Nothing on 2026-10-10/11.

No pointers. (Checked: every request carries `X-Up-Version`, and the target, mode, context and origin-mode headers
are only sent when set (request.js:900-913). The CSRF token is sent only with unsafe same-origin requests
(request.js:802-806). After a redirect, Unpoly assumes `GET` unless `X-Up-Method` says otherwise (protocol.js:583-595).
`wrapMethod` defaults to `true` (network.js:136). `X-Up-Events` is parsed as relaxed JSON (protocol.js:712-714),
so the single-quoted example at server-protocol.md:85 is valid.)


## Clear fixes (apply without asking)

None found.
