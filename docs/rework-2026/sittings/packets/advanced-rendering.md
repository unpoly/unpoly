# Sitting packet: Advanced rendering chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: A49-A54, B4 (attributes-and-options part), B20, B21 (794062ab2).
Deferred duplication items carried here: C16 (/advanced-rendering), C17 (/attributes-and-options),
C18 (/navigation-defaults, other side on /render-lifecycle), C19 (/targeting-fragments, other side on
/target-derivation). B22 (/providing-html "Rendering a `<template>`") is already in the Scripting packet as
templates pointer 1, with a draft for providing-html.md:214-236. It is not repeated here.

| Page | Pointers |
|------|----------|
| advanced-rendering | 3 |
| attributes-and-options | 1 |
| navigation-defaults | 1 |
| targeting-fragments | 1 |
| target-derivation | 0 |
| failed-responses | 0 |
| preserving-elements | 0 |
| providing-html | 0 (B22 in the Scripting packet, 1 clear fix) |
| render-lifecycle | 0 (1 clear fix) |


## Advanced rendering (`/advanced-rendering`, 149 lines)

Chapter overview: one function behind every update, targeting, navigation defaults, failed responses,
the render lifecycle; target derivation, preserving elements and providing HTML in "Also in this topic".

**Changed since writing**
- 794062ab2 (B20): "You can also ignore error codes with [`[up-fail=false]`](/up-follow#up-fail), decide yourself what
  counts as a failure, or react to requests that were aborted or never reached the server." (advanced-rendering.md:104-105)

### 1. "Navigation defaults" copies the navigation-defaults intro (C16, deferred duplication)

> Following a link or submitting a form counts as *navigation*. When a navigation swaps
> the main content, Unpoly behaves like a full page load would: the URL and history are updated, the page scrolls to the top,
> focus moves to the new fragment, and the response is cached. A plain `up.render()` call
> only updates the fragment, with none of these side effects.

(advanced-rendering.md:63-66)

> When a link or form updates the main content of the page, Unpoly behaves like a full page load would:
> the URL and history change, the page scrolls to the top, focus moves to the new content and the
> response is cached. We call such an update a *navigation*. A plain `up.render()` call only
> swaps the fragment, and you opt into each side effect on your own.

(navigation-defaults.md:4-7)

The same four effects in the same order, and the same closing sentence about `up.render()`. The overview has its own
angle one section up: everything a render pass does "is a *render option*" (advanced-rendering.md:28-30).
Navigation is exactly that, a preset of render options (`up.fragment.config.navigateOptions`, fragment.js:260-268).
The draft also fixes a small inaccuracy: caching does not depend on swapping the main content
(`cache: 'auto'` caches any `GET`, network.js:142), but the copy puts it under "when a navigation swaps the main content". (Pattern 5)

- **A.** Re-angle as a preset of render options.
- **B.** Leave it.

**Lean: A (medium).** Draft for advanced-rendering.md:63-66:

```md
Following a link or submitting a form is a *navigation*. A navigation adds a preset of render options
that make the update feel like a full page load: responses are cached, and when the main content changes,
the URL updates, the page scrolls to the top and focus moves to the new content.
A plain `up.render()` call has none of these defaults.
```

### 2. The two other copied examples (C16, deferred duplication)

a) The `.tasks:after, .next-page` example (advanced-rendering.md:42-51) is the one at targeting-fragments.md:123-132,
with one `<li>` less.

b) The `X-Maintenance` listener:

> When a maintenance page should never be rendered as a fragment, make a full page load instead:
>
> ```js
> up.on('up:fragment:loaded', function(event) {
>   if (event.response.header('X-Maintenance')) {
>     event.preventDefault() // mark-line
>     event.request.loadPage()
>   }
> })
> ```

(advanced-rendering.md:121-131, code identical to render-lifecycle.md:239-246)

Both are teaser snippets with their own sentences around them. (a) is followed by the origin rule, which the
detail section doesn't have. (b) is introduced by its own sentence about what `up:fragment:loaded` can do. This is the
case of the `/network` offline listener (Network packet, pointer 3), where the lean was also to keep. Swapping in
different examples would need a second paging or maintenance scenario that is no better. (Pattern 5)

- **A.** Leave both.
- **B.** Name the one to change.

**Lean: A (medium).** No change.

### 3. The failed-responses family sentence lists edge cases (B20, applied in the fix round)

> You can also ignore error codes with [`[up-fail=false]`](/up-follow#up-fail), decide yourself what counts as a failure,
> or react to requests that were aborted or never reached the server.

(advanced-rendering.md:104-105)

The fix round added this as a pattern-3 family sentence. On /history you dropped the B7 family sentence:
edge cases don't belong on the overview. This one is three edge cases. Two of them are not even failed responses:
aborted and offline requests render nothing and get no fail options (from_url.js:90-109).
The section already ends on the main point, that forms re-render themselves by default.

- **A.** Remove the sentence.
- **B.** Keep it.

**Lean: A (medium).** Draft: delete advanced-rendering.md:104-106 (sentence and blank line). The section then ends:

```md
is `[up-fail-target]`. For forms, Unpoly already defaults to re-rendering the form itself.

<p class="read-more"><a href="/failed-responses">Read more: Handling failed responses</a></p>
```


## Attributes and options (`/attributes-and-options`, 195 lines)

Three layers (config, attribute, option), Unpoly attributes (modifiers, booleans, structured values),
JavaScript options, global config, auto-attributes.

**Changed since writing**
- 794062ab2 (B4): Rails note after the ERB and `link_to` examples (attributes-and-options.md:101).
- 1888c354b: "handle every link on the page" links /handling-all-links#following-all-links again
  (attributes-and-options.md:168, your Forms-sitting correction).
- (2026-10-09, duplication-scan outcome 3: you rewrote #layers to teach precedence, 9bed81093 and 54b2ebc31.)

### 1. #options and #config teach precedence again (C17, deferred duplication)

> If you pass other options, these will override (or supplement) any options parsed
> from the link's attributes:
>
> ```js
> // This overrides the [up-meta-tags=false] attribute
> up.follow(link, { metaTags: true })
> ```

(attributes-and-options.md:141-147, end of "Overriding attributes with JavaScript options" {#options})

> A configured value becomes the new default. Elements and function calls
> can still override it with their own attributes and options.

(attributes-and-options.md:163-164, in #config)

Your #layers rewrite now owns precedence: config, then attribute, then option, shown with
`up.follow(link, { transition: 'none' })` (attributes-and-options.md:16-41). #options repeats the last step with a
second example, and #config repeats the first. What #options alone explains is the *parsing*: attributes become
a camel-cased options object, so `up.follow(link)` needs no options. Its heading names the override, though.
`#options` has six inbound links that promise "supplement or override" or "always take precedence"
(link.js:219, :975, form.js:353, :982, radio.js:290, CHANGELOG_3.x.md:1637). The draft keeps one override sentence
in #options, so these links still land on the answer. `#config` has no inbound links. (Pattern 5, 4)

- **A.** Retitle #options to the parsing, replace the override block with one pointer sentence, cut the #config sentence.
- **B.** Only cut the #config sentence.
- **C.** Leave both.

**Lean: A (medium).** Draft for attributes-and-options.md:115-116 (heading):

```md
Parsing attributes into options {#options}
-------------------------------
```

Draft for attributes-and-options.md:141-147:

```md
Options you pass yourself [win over](#layers) the parsed attributes.
```

Draft: delete attributes-and-options.md:163-165 (the two sentences and the blank line after them).


## Navigation defaults (`/navigation-defaults`, 138 lines)

What counts as navigation, the defaults table, opting out, opting in, customizing defaults, origin-dependent defaults.

**Changed since writing**
- 794062ab2 (A49): "The link also no longer falls back to the main element. When the server responds with an error,
  nothing is rendered unless you set an [`[up-fail-target]`](/failed-responses#fail-options)." (navigation-defaults.md:75-76)

### 1. "Defaults that depend on the origin" shares its example with render-lifecycle (C18, deferred duplication)

> The code below opens all links inside a form in an overlay, so the user does not lose their form data:
>
> ```js
> up.on('up:link:follow', function(event, link) {
>   if (link.closest('form')) {
>     event.renderOptions.layer = 'new' // mark-line
>   }
> })
> ```

(navigation-defaults.md:128-136)

> The code below opens all links within a form in an overlay, so the user's form data is not lost:
>
> ```js
> up.on('up:link:follow', 'form a', function(event) {
>   event.renderOptions.layer = 'new' // mark-line
> })
> ```

(render-lifecycle.md:122-128)

Same scenario, nearly the same sentence. On this page it is also off-topic: `layer` is not a navigation default
(fragment.js:260-268), so the example doesn't change any default from the table above. An example that changes one of
those defaults for some links fits here. render-lifecycle keeps the overlay example, since there it shows the mechanism.
A listener's `scroll = false` wins over the navigation default, because defaults are merged in
`up.RenderOptions.preprocess()` after the guard event (render_job.js:48-52). `[up-scroll=false]` touches no scroll positions
(scrolling.md:153). (Pattern 5)

- **A.** Navigation-angled example, plus a pointer to render-lifecycle.
- **B.** Leave it.

**Lean: A (medium).** Draft for navigation-defaults.md:128-136:

````md
The code below keeps the scroll position when the user switches tabs, even though each tab swaps the main element:

```js
up.on('up:link:follow', '.tabs a', function(event) {
  event.renderOptions.scroll = false // mark-line
})
```

See [changing options before rendering](/render-lifecycle#changing-options-before-rendering) for more.
````


## Targeting fragments (`/targeting-fragments`, 331 lines)

Swapping, the main element, multiple and optional targets, appending, children, `:none`, `:layer`, ambiguous selectors,
missing targets and fallbacks, element objects, changing the target in flight.

**Changed since writing**
- 794062ab2 (A50): "in either" became "in the current page or in the response" in three places
  (targeting-fragments.md:86, :267, :282).

### 1. "Targeting an element object" repeats the target-derivation opening (C19, deferred duplication)

> When you pass an `Element` object to a rendering function, Unpoly [derives](/target-derivation)
> a selector that matches the element:
>
> ```js
> let element = document.querySelector('#foo')
>
> up.reload(element) // Derives the target '#foo' from the given element
> ```
>
> The element is also used as the [origin](#ambiguous-selectors) of the update.

(targeting-fragments.md:307-316)

> ```js
> let element = document.querySelector('#foo')
> up.reload(element) // Derives the target '#foo' from the given element
> ```

(target-derivation.md:10-13, the page's opening example)

The code block is a literal copy, and target-derivation owns it. The section's own point is the origin, and it
fits in one sentence (verified: an `Element` target also becomes `{ origin }`, fragment.js:1700-1702). (Pattern 5)

- **A.** Drop the code block, keep the derivation and origin sentences.
- **B.** Leave it.

**Lean: A (medium).** Draft for targeting-fragments.md:307-317:

```md
When you pass an `Element` instead of a selector, Unpoly [derives](/target-derivation) a selector
that matches it, like `#foo` for `<div id="foo">`.
The element is also used as the [origin](#ambiguous-selectors) of the update.
```


## Target derivation (`/target-derivation`, 126 lines)

Identifying properties, derivation patterns, verification, deriving programmatically.

**Changed since writing**
- 794062ab2 (A51): `[up-keep]` and `[up-validate]` added to the feature list (target-derivation.md:15).

No pointers. It owns the `#foo` example; the copy is targeting-fragments pointer 1.
(Checked: the default deriver list matches fragment.js:26-33 and :227-244. Verification looks the derived target up in the
element's layer and requires the same element back (fragment.js:2147-2150), so the second `.card` is rejected.
A detached element skips verification, so `toTarget()` on a fresh element returns `.klass`.)


## Handling failed responses (`/failed-responses`, 192 lines)

Fail options and which options have fail variants, fail targets for links, ignoring error codes, custom failure
detection, local content, unexpected content, network errors, aborts, detecting failure in code.

**Changed since writing**
- 794062ab2 (A52): the "aborted by a second request" bullet was removed from the list of failed responses.
- 794062ab2 (B21): "Handling fatal network errors" names `[up-on-offline]` and `up:fragment:offline`
  (failed-responses.md:151-153).

No pointers. (Checked: `fallback` and `history` are shared with fail options, while scroll, focus and layer
are not (render_options.js:30-80, :243-260). A link's failed response reaches the main element through the shared
`fallback: true` of navigation. An `up.Aborted` has the name `'AbortError'` (errors/aborted.js:1, error.js:30).)


## Preserving elements (`/preserving-elements`, 225 lines)

Keeping an element, keep conditions (same HTML, same data, custom), forcing updates, updating data of kept elements.

**Changed since writing**
- 794062ab2 (A53): compilers don't rerun and destructors aren't called on a kept element (preserving-elements.md:52-53).
- 794062ab2 (A54): targeting an `[up-keep]` element directly keeps it (preserving-elements.md:55-56).

No pointers. (Checked: the partner is looked up by the derived target, and an `[up-keep=false]` partner prevents
keeping (fragment.js:1028-1052). `newData` comes from the discarded partner (fragment.js:1062). `[up-on-keep]` gets
`newFragment` and `newData` (fragment.js:935-938). Keeping a direct target: fragment_keep_spec.js:448.)


## Providing HTML to render (`/providing-html`, 279 lines)

Loading from a URL, strings (`content`, `fragment`, `document`), omitting `[href]`, sanitizing, templates,
`Element` objects, `up.Response` objects.

**Changed since writing**
- Nothing on 2026-10-10/11.

No pointers. B22 ("Rendering a `<template>`" shrinks to a pointer) is templates pointer 1 in the Scripting packet.
One wording fix is under "Clear fixes".


## Render lifecycle (`/render-lifecycle`, 338 lines)

Lifecycle diagram, running code after rendering, changing options before rendering, deferring, preventing and
skipping, handling errors.

**Changed since writing**
- Nothing on 2026-10-10/11.

No pointers. It keeps both shared examples: the overlay listener (navigation-defaults pointer 1 changes the other side)
and the `X-Maintenance` listener (advanced-rendering pointer 2, lean leave). One wording fix is under "Clear fixes".
(Checked: `{ onRendered }` is skipped for an empty result (render_job.js:85). A failed response doesn't call `{ onError }`,
since `_handleResult()` returns true for an `up.RenderResult` (render_job.js:67-68, :79-117). `up:form:validate`
is a guard event and can be prevented (form_validator.js:314).)


## Clear fixes (apply without asking)

1. targeting-fragments.md:28-29. Hungry elements in the response are updated too. Every render pass has
   `hungry: true` (fragment.js:249), and radio_hungry_spec.js:34-41 shows `up.render('.target', { url })`
   updating a hungry element. Same fix as A44 on /backend-integration and /optimizing-responses.
   `element matching \`.content\` is updated on the page. Other elements from the response are discarded.` →
   `element matching \`.content\` is updated on the page. Other elements from the response are discarded,`
   + new line `except [hungry elements](/hungry-elements).`

2. providing-html.md:38-39. Same fact.
   `The response may contain other HTML, but only the element matching \`.target\` is extracted and placed into the page.`
   `Other elements in the response are discarded, and the corresponding elements on the page stay unchanged.` →
   `The response may contain other HTML, but only the element matching \`.target\` is extracted and placed into the page.`
   `Apart from [hungry elements](/hungry-elements), other elements in the response are discarded,`
   `and the corresponding elements on the page stay unchanged.`

3. render-lifecycle.md:215-216. A `204 No Content` is not an answer to a conditional request.
   `Such responses occur when a [conditional request](/conditional-requests)` /
   `is answered with HTTP status \`304 Not Modified\` or \`204 No Content\`.` →
   `Such responses occur when the server answers a [conditional request](/conditional-requests)` /
   `with \`304 Not Modified\`, or responds with \`204 No Content\`.`

4. fragment.js:186-187 (doc comment of `up.fragment.config.skipResponse`). The same sentence, plus a typo ("in answered").
   `Such responses occur when a [conditional request](/conditional-requests)` /
   `in answered with HTTP status \`304 Not Modified\` or \`204 No Content\`.` →
   `Such responses occur when the server answers a [conditional request](/conditional-requests)` /
   `with \`304 Not Modified\`, or responds with \`204 No Content\`.`
