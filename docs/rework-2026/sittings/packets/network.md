# Sitting packet: Network & caching chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: A37-A39, B15, B16 (37c4ab32d). Decided, applied separately: C11 (open item 5A,
drop the first `autoCache` example on /caching). Deferred duplication items carried here: C9 and B14 (/network),
C12 (/network-issues), plus three extra /network overlaps found 2026-10-11. C10 (/caching copies the tracking
compiler) is in the History packet, tracking-page-views pointer 1; its /caching side is caching.md:260-276.

| Page | Pointers |
|------|----------|
| network | 4 |
| caching | 2 |
| aborting-requests | 0 |
| network-issues | 1 |


## Network & caching (`/network`, 128 lines)

Chapter overview: requests in the background, instant revisits from the cache, aborting conflicting requests,
handling disconnects, making requests from JavaScript.

**Changed since writing**
- Nothing on 2026-10-10/11. (234bf038f on 2026-10-09 softened the "never stale" claim.)

### 1. The revalidation sentences copy /caching (C9, deferred duplication)

> A cache entry is only considered fresh for 15 seconds. When Unpoly renders older content,
> it reloads the fragment from the server right after. This is called *revalidation*:
> the user sees the cached version immediately and the fresh version a moment later.

(network.md:49-51)

> Cache entries are only considered *fresh* for [15 seconds](/up.network.config#config.cacheExpireAge).
> When Unpoly renders older content from the cache, it reloads the fragment from the server right after.
> This process is called *cache revalidation*.

(caching.md:44-46)

The first two sentences are a near-literal copy. You re-angled the History overview from the user's
side (C3). Here the user's side is already in the passage ("sees the cached version immediately"),
it only comes last. Leading with it, and folding in the `POST` sentence that follows (network.md:52-53),
makes the teaser say what the user experiences, then the two rules. Facts: 15 s is `cacheExpireAge`
(network.js:138), a non-safe request expires the whole cache when it is sent (network.js:143, :495). (Pattern 5)

- **A.** Re-angle, same facts.
- **B.** Leave it.

**Lean: A (medium).** Draft for network.md:49-53:

```md
When the cached content may be outdated, Unpoly reloads the fragment from the server right after rendering it.
The user sees the cached version immediately and the fresh version a moment later.
This is called *revalidation*. Content counts as outdated after 15 seconds, or as soon as the user
submits a form with a method like `POST`, since that has probably changed data on the server.
```

### 2. Caching teaser family sentence (B14, deferred)

The pre-pass proposed adding, before the read-more link at network.md:55:

> You can [preload](/preloading) links before the user clicks, expire or evict entries after a change,
> answer revalidation with [`304 Not Modified`](/conditional-requests), or turn caching off for a single link.

On /history you dropped the B7 family sentence because edge cases don't belong on the overview.
Preloading already has its own chapter, and the other three are /caching sections. (Pattern 3 vs. your history call)

- **A.** Add the sentence.
- **B.** Don't add it.

**Lean: B (strong).** No change.

### 3. "Handling disconnects" copies the listener and the slow-server paragraph (C9, deferred duplication)

> ```js
> up.on('up:fragment:offline', function(event) {
>   if (confirm('You are offline. Retry?')) event.retry() // mark: event.retry()
> })
> ```
>
> Requests that time out are handled the same way. Pages already in the cache remain accessible while offline.
>
> A server that is slow to respond is not a network issue. Unpoly shows a [progress bar](/progress-bar)
> after 400 ms, and can show [loading state](/loading-state) in the targeted fragment while the user waits.

(network.md:86-95)

The listener is identical to network-issues.md:26-30. The slow-server paragraph repeats
network-issues.md:122-127 ("This is not a network error … shows an animated progress bar when a request takes
longer than 400 ms. You may also show loading state …").

Two different cases. The listener is the section's only example, and every map section shows one.
You left such teaser snippets on /history and /overlays when they had their own sentence around them,
as this one does. The slow-server paragraph is a "what it is not" edge case on the overview, the kind you cut
from /history. If you take C12 (network-issues pointer 1), this would be its third copy. (Pattern 1, 5)

- **A.** Drop the slow-server paragraph, keep the listener.
- **B.** Also replace the listener with the per-link `[up-on-offline]` example from network-issues.md:46-48.
- **C.** Leave both.

**Lean: A (medium).** Draft: delete network.md:94-96 (paragraph and blank line). The section then ends:

```md
Requests that time out are handled the same way. Pages already in the cache remain accessible while offline.

<p class="read-more"><a href="/network-issues">Read more: Handling network issues</a></p>
```

### 4. Three more overlaps (found 2026-10-11, all lean leave)

a) Aborting teaser vs. the aborting-requests intro:

> When the user clicks *A* and then *B* before *A* has loaded, the request for *A* is aborted.
> Only the response to *B* is rendered, regardless of which response arrives first.
> Requests targeting other fragments are not affected.

(network.md:69-71)

> When two requests [target](/targeting-fragments) the same element, Unpoly aborts the earlier request.
> Only the later response is rendered, regardless of the order in which responses arrive.

(aborting-requests.md:4-5; "Requests targeting other fragments are not aborted." at :13)

The overview tells it through the A/B example, the detail page states the rule. That's a re-angle.

b) Examples copied from network.js doc comments:

> `let response = await up.request('/search', { params: { query: 'sunshine' } })`

(network.md:107, from network.js:321)

> `event.request.headers['X-Client-Time'] = Date.now().toString()`

(network.md:121, from network.js:844, where it also sets a timeout for `/stocks`)

Guide vs. reference, and the guide shortens both. No other guide page uses them.

c) The A/B link markup:

> `<a href="/pages/a" up-target="article">A</a>`
> `<a href="/pages/b" up-target="article">B</a>`

(network.md:65-66, also links.md:27-28)

On /links it teaches `[up-target]`. Here it sets up a race. Same markup, different point.

- **A.** Leave all three.
- **B.** Name the one to change.

**Lean: A (medium).** No change.


## Caching (`/caching`, 304 lines)

Which responses are cached, revalidation, expiration, disabling caching, eviction, reacting to revalidation
in code, optimized responses, redirects.

**Changed since writing**
- 37c4ab32d (B15): "Enabling caching" retitled "Which responses are cached", anchor `{#enabling}` kept (caching.md:9).
- 37c4ab32d (A37): error responses aren't cached and evict the URL; a second request for a loading URL waits
  for it (caching.md:36-38).
- 37c4ab32d (B16): "Caching optimized responses" and "How cache entries are matched" merged into one section,
  the second anchor kept as a shim (caching.md:279-289).
- Pending: open item 5A removes the first `autoCache` example (caching.md:24-30).

### 1. "Controlling revalidation" configures the default and repeats the expiry setting

> You can configure both the expiry age and the rule:
>
> ```js
> up.network.config.cacheExpireAge = 20_000 // expire after 20 seconds
> up.fragment.config.autoRevalidate = (response) => response.expired
> ```

(caching.md:76-81)

The `autoRevalidate` line is the default (fragment.js:281), so it teaches nothing. Same case as the
`autoCache` example you dropped in 5A. The `cacheExpireAge` line repeats "Expiration" (caching.md:120), which owns it.
The useful `autoRevalidate` example (exempting a URL) is already under "Disabling revalidation" (caching.md:97-101).
(Pattern 6, 1)

- **A.** Replace the code block with two pointer sentences.
- **B.** Keep the code block, drop only the `autoRevalidate` line.
- **C.** Leave it.

**Lean: A (medium).** Draft for caching.md:76-81:

```md
To change when cache entries [expire](#expiration), configure `up.network.config.cacheExpireAge`.
To exempt some responses from revalidation, see [disabling revalidation](#disabling-revalidation).
```

### 2. "Disabling the cache globally" leaves preloading on

> [Navigation](/navigation-defaults) is the only moment when Unpoly caches by default.
>
> You can disable caching globally like so:
>
> ```js
> up.fragment.config.navigateOptions.cache = false
> ```

(caching.md:163-169)

Preloading also caches by default: `up.link.preload()` passes `cache: true` (link.js:527), which beats the
navigation default. After this config, preloads still fill the cache, but links render with `cache: false`
and never read from it (network.js:500, `willCache()` at classes/request.js:562). Every preload becomes a wasted
request. The expert's question "and my `[up-preload]` links?" has no answer here. (Pattern 2)

- **A.** Correct the first sentence, say "for all navigation", and add one sentence on preloading.
- **B.** Leave it.

**Lean: A (medium).** Draft for caching.md:163-169:

````md
Unpoly caches by default when [navigating](/navigation-defaults) and when [preloading](/preloading) links.

To disable caching for all navigation:

```js
up.fragment.config.navigateOptions.cache = false
```

Navigation then ignores responses that preloading has cached, so stop preloading links as well.
````


## Aborting requests (`/aborting-requests`, 136 lines)

Conflicting requests, the `{ abort }` values, protecting a request, aborting from JavaScript, reacting to aborts,
layer rules, destroyed fragments.

**Changed since writing**
- 37c4ab32d (A38): an aborted request may already have reached the server (aborting-requests.md:67-68).

No pointers. (Checked: polling stops on a foreign abort, fragment_polling.js:30-34, and validations reject,
form_validator.js:35-42; `up.fragment.onAborted()` unsubscribes on destroy, event.js:183-190; preload requests
are `abortable: false`, link.js:525; opening an overlay binds to the base layer's main element, so a later
main update aborts it, open_layer.js:27-36; the overview-teaser overlap is network pointer 4a.)


## Handling network issues (`/network-issues`, 142 lines)

Disconnects (retrying, substituting content, offline cache, preloading, limits), flaky connections and timeouts,
slow server responses, HTTP error codes.

**Changed since writing**
- 37c4ab32d (A39): without an `up:fragment:offline` listener the user gets no feedback (network-issues.md:18-19).

### 1. Merge "Slow server responses" and "HTTP error codes" (C12, deferred)

> Even with a great connection, your server may take long to render expensive pages.
> This is not a network error. The request eventually succeeds, and no `up:fragment:offline` event is emitted.
>
> While the user waits, Unpoly shows an animated [progress bar](/progress-bar) when a request takes
> [longer than 400 ms](/up.network.config#config.lateDelay).
> You may also show [loading state](/loading-state) within the targeted fragment, like a dimmed element or a placeholder.

(network-issues.md:122-127, section "Slow server responses")

> When the server responds with an error code (like `500 Server Error`), no `up:fragment:offline` event is emitted.
> Instead you can tell Unpoly to [render such responses differently](/failed-responses#fail-options) from a successful response.
>
> By default, [navigation](/navigation-defaults) (like clicking a link or submitting a form) will render an error response's
> [main element](/main) in order to convey an error message from the server.
>
> See [Handling failed responses](/failed-responses) for details.

(network-issues.md:133-139, section "HTTP error codes")

Two H2 sections, each explaining a neighbour's topic (progress bar, failed responses) to say it is *not*
a network issue. The useful part is the answer to "does a 500 or a slow server fire `up:fragment:offline`?"
That fits in one short section with two pointers. (Pattern 1)
Anchors: `#slow-server-responses` is the learn-ref of `up:network:late` and `up:network:recover`
(network.js:786, :816), so the draft keeps it. `#http-error-codes` has no inbound links (grepped src/,
docs/changes/ and ../unpoly-site/source).

- **A.** One section, keeping `#slow-server-responses`.
- **B.** Leave both sections.

**Lean: A (medium).** Draft for network-issues.md:119-139:

```md
Slow responses and error codes {#slow-server-responses}
------------------------------

Slow responses and error codes are not network issues, and emit no `up:fragment:offline` event.
While a slow response loads, Unpoly shows a [progress bar](/progress-bar) after
[400 ms](/up.network.config#config.lateDelay), and you can add [loading state](/loading-state)
to the targeted fragment. To render error responses differently from successful ones,
see [[failed-responses]].
```


## Clear fixes (APPLIED by the orchestrator)

1. fragment.js:167 (doc comment of `up.fragment.config.autoRevalidate`). There is no `up.fragment.config.expireAge`;
   the expiry age is `up.network.config.cacheExpireAge` (network.js:77, :138).
   `By default Unpoly verifies cached responses that are older than \`up.fragment.config.expireAge\`:` →
   `By default Unpoly verifies cached responses that are older than \`up.network.config.cacheExpireAge\`:`
