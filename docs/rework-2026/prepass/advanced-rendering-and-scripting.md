# Pre-pass: Advanced rendering and Scripting

Checked against the maintainer patterns in `docs/rework-2026/writer-brief.md` (1-8).
Line numbers refer to the state of `docs-rework` at the time of the pass.
Claims I inferred from reading code without running it are marked *unverified*.
Not re-raised (already decided): attributes-and-options #layers, the /handling-all-links#defaults
link, the date picker / lightbox examples, enhancing-elements#no-load-event, legacy-scripts#migrate-to-compiler.


## /advanced-rendering

1. **Pattern 5.** The overview copies three detail-page passages almost literally:
   - The `.tasks:after, .next-page` example with "Wash car" / "Fix tent" (advanced-rendering.md:42-51)
     is the example from targeting-fragments.md:122-132.
   - "Navigation defaults" (advanced-rendering.md:63-66):

     > Following a link or submitting a form counts as *navigation*. When a navigation swaps
     > the main content, Unpoly behaves like a full page load would: the URL and history are updated, the page scrolls to the top,
     > focus moves to the new fragment, and the response is cached. A plain `up.render()` call
     > only updates the fragment, with none of these side effects.

     is the intro of navigation-defaults.md:4-7, nearly word for word.
   - The `X-Maintenance` listener (advanced-rendering.md:121-128) is the one in render-lifecycle.md:239-246.

   Proposal: re-angle, don't delete. For the lifecycle section, replace the second code block with a
   family sentence (also pattern 3):

   > Before a loaded response is rendered, an `up:fragment:loaded` listener can inspect it and change
   > the render options, skip the response, or make a full page load instead.

   For targeting, show a different combination than the detail page, e.g. only the multi-target
   `.content, .unread-count`, and mention `:after` in a sentence. For navigation, phrase it from the
   user's side ("Clicking a link that swaps the main content feels like a page load: …") and leave
   the exact list to the detail page.

2. **Pattern 3.** "Handling failed responses" shows only `failTarget`. The family is larger: ignoring
   error codes, deciding what counts as a failure, falling back for unexpected content, and requests
   that never got a response. Proposed sentence before the read-more:

   > You can also ignore error codes with `[up-fail=false]`, decide yourself what counts as a failure,
   > or react to requests that were aborted or never reached the server.


## /attributes-and-options

1. **Pattern 5 (within the page).** Now that #layers teaches precedence, two later sections teach it again:
   - #options (attributes-and-options.md:113-145) ends with

     > If you pass other options, these will override (or supplement) any options parsed
     > from the link's attributes:
     > ```js
     > // This overrides the [up-meta-tags=false] attribute
     > up.follow(link, { metaTags: true })
     > ```

     which is the `up.follow(link, { transition: 'none' })` step from #layers again.
   - #config (line 161):

     > A configured value becomes the new default. Elements and function calls
     > can still override it with their own attributes and options.

   Proposal: re-angle #options to what it alone explains, the *parsing* (attributes become a camel-cased
   options object, so `up.follow(link)` needs no options). Drop the "This overrides" block, or reduce it
   to "Options you pass win over parsed attributes, see [above](#layers)." Cut the #config sentence.

Rails: ERB and `link_to` examples at attributes-and-options.md:90-98 (pattern 8, global fix-round task).


## /navigation-defaults

1. **Pattern 2 (failed responses after opting out).** "Opting out of navigation" says:

   > Clicking the link updates the `.users` list and nothing else. The URL stays the same,
   > the scroll position is kept and the response is not cached.

   An expert will ask what happens to an error page. With `[up-navigate=false]` the link also loses
   `{ fallback: true }`, and links have no default fail target. A failed response then renders nothing,
   and the promise rejects with `up.CannotMatch` ("No target selector given for failed responses").
   Proposal: append

   > The link also no longer falls back to the main element. When the server responds with an error,
   > nothing is rendered unless you set an [`[up-fail-target]`](/failed-responses#fail-options).

   Evidence: `src/unpoly/link.js:338-341` (no fallback/failTarget default for links),
   `src/unpoly/fragment.js:261-269` (`fallback: true` only in navigateOptions),
   `src/unpoly/classes/render_options.js:248-257` (fail options = renderOptions defaults + shared keys),
   `src/unpoly/classes/change/from_content.js:174-175` (the error). *Unverified* (not run).

2. **Pattern 5.** "Defaults that depend on the origin" uses the same example and almost the same sentence as
   render-lifecycle#changing-options-before-rendering:

   > The code below opens all links inside a form in an overlay, so the user does not lose their form data:

   (navigation-defaults.md:126, render-lifecycle.md:122). Proposal: keep the section here, but give it a
   navigation angle and link to render-lifecycle for the mechanism, e.g. changing a navigation default for
   some links:

   > ```js
   > up.on('up:link:follow', '.tabs a', function(event) {
   >   event.renderOptions.scroll = false // mark-line
   > })
   > ```
   > See [changing options before rendering](/render-lifecycle#changing-options-before-rendering) for more.

   render-lifecycle keeps the overlay example.


## /targeting-fragments

1. **Wrong vs. implementation (wording).** Three sentences say a target must be missing in *both* places:

   > If a target selector doesn't match in either, an error `up.CannotMatch` is thrown. (line 86)

   > If no matching element is found in either, an error `up.CannotMatch` is thrown. (line 267)

   > If no element matches `.content` in either page or response, Unpoly updates the `body` element. (line 282)

   A target that is missing in only one of them already fails (before the request when missing on the page,
   after it when missing in the response). Proposal: "If a target selector is missing in the current page
   or in the response, …" in all three places.
   Evidence: `src/unpoly/classes/change/from_content.js:61,156,159-165` (`_cannotMatchPreflightTarget`, `_cannotMatchPostflightTarget`).

2. **Pattern 5.** "Targeting an element object" (targeting-fragments.md:304-317) repeats the opening example of
   target-derivation.md:10-13 literally (`document.querySelector('#foo')` / `up.reload(element) // Derives the target '#foo'`).
   Proposal: keep the section's own point (the element is also used as the origin) and drop the code block:

   > When you pass an `Element` instead of a selector, Unpoly [derives](/target-derivation) a selector that
   > matches it, and uses the element as the [origin](#ambiguous-selectors) of the update.


## /target-derivation

1. **Pattern 3 / accuracy.** The feature list leaves out the feature that sends most readers here:

   > Features that must derive targets include `[up-poll]`, `[up-hungry]`, `[up-viewport]`,
   > [`up.reload(Element)`](/up.reload) and [`up.render(Element)`](/up.render).

   `[up-keep]` derives a target for every kept element (preserving-elements' important box links here),
   and so does `[up-validate]` for the field group. Proposal: add `[up-keep]` and `[up-validate]` to the list.
   Evidence: `src/unpoly/fragment.js:1027` (`tryToTarget(oldElement)` in the keep plan),
   `src/unpoly/classes/form_validator.js` (uses `up.fragment.tryToTarget`).


## /failed-responses

1. **Accuracy.** The list of failed responses includes a request that never got one:

   > - The request is [aborted](/aborting-requests) by a second request [targeting](/targeting-fragments) the same fragment.

   An aborted request renders no fail options; the promise rejects with `up.Aborted`. The intro already
   separates "react to requests that never got a response". Proposal: remove the bullet (aborts keep their
   own section further down).
   Evidence: `src/unpoly/classes/render_job.js:189`; the page's own #handling-aborted-requests.

2. **Pattern 3.** "Handling fatal network errors" names only the request-level event:

   > When a request encounters a fatal error (like a timeout or loss of network connectivity), Unpoly
   > emits `up:request:offline` and does not render.

   A render pass also emits `up:fragment:offline` (which can retry the render), calls `{ onOffline }` /
   `[up-on-offline]`, and rejects with `up.Offline`. Proposal:

   > When a request encounters a fatal error (like a timeout or loss of network connectivity), nothing
   > is rendered. You can handle this with an `[up-on-offline]` callback or an `up:fragment:offline`
   > listener, which can also retry the request. See [[network-issues]].

   Evidence: `src/unpoly/classes/change/from_url.js:93`, render-lifecycle.md:262-264 (table already lists all three).


## /preserving-elements

1. **Pattern 2 (compilers and destructors).** After

   > The kept element is the *old* element, so it still plays `song1.mp3`.
   > Its event listeners and any state set by a [compiler](/enhancing-elements) survive the update.

   the expert asks: does the compiler run again, and does the destructor run? Neither. Proposal: append

   > Its compilers don't run again and its destructors are not called. Once an update no longer contains a
   > match, the element is destroyed like any other, and its destructors run.

   Evidence: `src/unpoly/classes/change/update_steps.js:104-106` (keepables are preserved before `up.script.clean()`),
   `src/unpoly/classes/hello_fragment.js:151-160` (a compiler runs once per element).

2. **Pattern 2 (secondary: targeting the kept element itself).** "What if my link targets the `[up-keep]`
   element itself?" Then the whole swap is skipped and nothing changes. Proposal, at the end of "Keeping an element":

   > When you target an `[up-keep]` element directly, it is kept as well, so the update changes nothing.
   > To replace it, [force an update](#forcing-updates).

   Evidence: `src/unpoly/classes/change/update_steps.js:60-62` (`keepPlan` on the swap step → `_executeKeepEverythingStep`). *Unverified* (not run).


## /providing-html

1. **Pattern 5 / 1.** "Rendering a `<template>`" (providing-html.md:214-236) is the "Rendering a template"
   section of templates.md:11-33 with the same code block and nearly the same sentence:

   > The template is cloned and the `.target` is updated with a matching element from the clone.

   [[templates]] owns this. Proposal: reduce to the angle that belongs here, without the example:

   > Any attribute or option that accepts HTML also accepts the selector of a `<template>` element.
   > The template is cloned and rendered without a server request. See [[templates]] for examples and
   > [dynamic templates](/templates#dynamic) with variables.

   Keep the `{#template}` anchor (the sanitizing section links to it).


## /render-lifecycle

No findings of its own. It shares two examples with other pages; the proposals keep them here and change the
other pages (see /advanced-rendering 1 and /navigation-defaults 2).


## /scripting

1. **Pattern 5.** The "Enhancing elements" section repeats start/elements.md almost literally, and
   enhancing-elements#registration a third time:

   > The function is called once for each `.current-time` element, when the page first
   > loads and when a matching fragment is rendered later. This replaces listening
   > to `DOMContentLoaded`, which only fires for the initial page.

   (start/elements.md:26-31: "The function is called **once for each matching element**: when the page first
   loads, and again whenever a fragment update inserts a `.current-time` element. This replaces listening to
   `DOMContentLoaded`."). The next section, "The page is long-lived", then restates the destructor sentence
   just above it ("keeps effects like timers or global listeners from outliving their element").
   Proposal: re-angle the overview to *lifetime*, since the reader already met the plain compiler in Start.
   Lead with the destructor example (keep `.current-time` for continuity), fold "The page is long-lived" into
   its intro, and drop the first, destructor-less code block. Draft:

   > When Unpoly updates a fragment, the browser keeps the same document and JavaScript environment,
   > often through many navigations. A compiler scopes your behavior to an element's lifetime: Unpoly calls it
   > when a matching element enters the page, and calls the *destructor* it returns when the element is removed.


## /enhancing-elements

1. **Pattern 2 (memory leaks: who calls the destructor?).** "Cleaning up after yourself" says:

   > Unpoly will call this destructor when the element is destroyed:

   An expert asks: "What if my own code removes the element?" Unpoly has no MutationObserver. Destructors run
   only when Unpoly removes the element. Proposal: after the `.scroll-to-hide` example:

   > Destructors run when Unpoly removes the element, e.g. when its fragment is swapped, when it is destroyed
   > with `up.destroy()`, or when its overlay closes. When your own code removes an element, use `up.destroy()`
   > so its destructors run.

   Evidence: no `MutationObserver` in `src/`; `up.script.clean()` is called from
   `src/unpoly/classes/change/update_steps.js:126` and `src/unpoly/classes/change/destroy_fragment.js:41`.
   Overlay closing → destroy_fragment is *unverified*.

2. **Pattern 2 (nested compilers: order).** The page never says in which order compilers run. "Can my container's
   compiler rely on the compilers of its children?" Only if those were registered first: each compiler handles
   all its matches in the new fragment before the next compiler runs, in registration order. Proposal: one
   sentence at the end of #registration:

   > Compilers run in the order they were registered, each for all its matches in the new fragment.
   > To change the order, pass a [`{ priority }`](/up.compiler#order).

   Evidence: `src/unpoly/classes/hello_fragment.js:66-91` (loop over compilers, then matches),
   `src/unpoly/script.js:221-226,467` (priority queue).

3. **Pattern 2 / 6 (the date picker example).** The new example is

   > ```js
   > up.compiler('input.date-picker', function(input) {
   >   new DatePicker(input)
   > })
   > ```

   Many date pickers append their calendar popup to the `<body>` or listen on `document`. That is exactly the
   global effect that leaks (next section). Proposal: keep the code minimal, add one sentence after it:

   > If the library adds elements or listeners outside the input, like a calendar popup in the `<body>`,
   > return a [destructor](#destructor) that calls the library's clean-up method.


## /data

1. **Pattern 2 (key collisions).** "Merging data attributes" shows disjoint keys. "What if `data-age` and
   `[up-data]` both set `age`?" `[up-data]` wins, and data passed by the render pass (`[up-use-data]`) wins over
   both. Proposal: append to "Merging data attributes":

   > When both set the same key, the value from `[up-data]` wins.

   and to #override: "Keys from `[up-use-data]` win over the element's own data."
   Evidence: `src/unpoly/script.js:864-869` (`{ ...upTemplateData, ...dataset, ...parsedJSON, ...upCompileData }`).


## /templates

1. **Pattern 6 (incorrect example).** Option 1 references the wrong template:

   > ```html
   > <a up-fragment="#my-template" up-use-data="{ description: 'Buy toast' }">
   > ```

   `#my-template` renders a `.target`, but the compiler below is registered on `.task`, which lives in
   `#task-template` (templates.md:76). Proposal: `up-fragment="#task-template"` (templates.md:101).


## /islands

1. **Pattern 6.** The `[up-keep]` island has no `[id]`, and the text says a class match is enough:

   > Elements are matched by their [derived target](/target-derivation): any element with the same `.color-picker`
   > class in the new HTML counts as a match, even when its `[up-data]` differs.

   That holds only while the class is unique on the layer. With two color pickers, the second one cannot be
   targeted and is silently replaced (a warning is logged). preserving-elements says the element "needs a
   derivable target selector, like an `[id]`". Proposal: give the example an id and match the text to it:

   > ```html
   > <div id="theme-color" class="color-picker" up-data="{ value: '#a2d8ff' }" up-keep></div>
   > ```
   > Elements are matched by their [derived target](/target-derivation), here `#theme-color`. A matching element in
   > the new HTML counts, even when its `[up-data]` differs.

   Evidence: `src/unpoly/fragment.js:1027-1031` ("Cannot keep untargetable"), target-derivation#verification.


## /legacy-scripts

1. **Wrong vs. implementation.** "Avoid loading your application scripts in the `<body>`" opens with

   > When allowing inline scripts to run, mind that the `<body>` element is a default [main target](/main).

   This reads as if script execution were opt-in. By default (`scriptElementPolicy: 'auto'`) Unpoly runs
   `<script>` elements in new fragments whenever the CSP allows them. The example is also an external script,
   not an inline one. Proposal:

   > Unpoly runs `<script>` elements in new fragments, as long as your CSP allows them
   > (see [script elements](/script-security#script-elements)). Mind that the `<body>` element is a default
   > [main target](/main).

   Evidence: `src/unpoly/script.js:83`, `src/unpoly/classes/script_gate.js:252-263` (`auto` resolves to `pass`
   unless the CSP has `strict-dynamic`).


## /script-security

1. **Pattern 5 (within the page).** The `<meta name="csp-nonce">` paragraph and code block appear three times
   word for word (lines 100-108, 195-203, 247-255: "For Unpoly to be able to verify nonces, you must include a
   `<meta name="csp-nonce">` tag in the `<head>` of the initial page load"), and

   > Nonces in your HTML only need to match the response you're currently rendering.

   appears three times (lines 124, 223, 280). Proposal: keep both in "Providing the document nonce" {#meta-csp-nonce}
   and #response-processing. In #callback-nonces and #script-element-nonces, replace them with one sentence:
   "This requires the [document nonce in a `<meta>` tag](#meta-csp-nonce)."

2. **Open item, not a finding.** The commented-out "General advice" block (lines 9-33) still waits for the
   resurrect/delete/leave verdict from the Scripting sitting.


## Considered, not raised

- Pattern 7: /templates could be read as an HTML source for rendering (Advanced rendering, next to providing-html).
  It was approved in the Scripting sitting (2026-10-06) and promoted to a scripting.md map rung, so I left it.
- Rails examples (pattern 8): only attributes-and-options.md:90-98 (ERB + `link_to`). No other page in these two chapters.
