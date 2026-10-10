# Facts pass: Getting started and Links

Checks every behavioral claim and code example against the implementation on `docs-rework`.
Line numbers refer to the state of `docs-rework` at the time of the pass.
A = doc clearly wrong (correction given). Q = docs and code disagree, intent unclear.


## /start/overview

no findings


## /install

no findings

(Checked: `dist/unpoly.js` and `dist/unpoly.css` exist and are in the npm `files` list;
`[[=version]]` and `[[=npm_tag]]` are substituted by unpoly-site's dynamic tokens, see
`../unpoly-site/spec/lib/unpoly/guide/dynamic_tokens_spec.rb:18-33`; boot on `DOMContentLoaded` per
`src/unpoly/framework.js:2,58`. The `npx skills add --global https://unpoly.com` command is unverified.)


## /start/links

no findings


## /start/forms

no findings


## /start/overlays

no findings


## /start/elements

no findings


## /start/api

no findings


## /start/next

no findings (demo and GitHub URLs unverified)


## /links

1. **A.** links.md:49-50:

   > When a link updates the layer's main element, Unpoly behaves like a full page load would:
   > the browser URL and history are updated, and the new content is scrolled into view.

   With `{ scroll: 'auto' }` and a main target, Unpoly resets the layer's scroll position to the top. It does
   not reveal the new content. Evidence: `up.fragment.config.autoScroll: ['hash', 'layer-if-main']`
   (`src/unpoly/fragment.js:280`); navigation-defaults.md:48 says "Reset scroll positions". The overview
   (start/overview.md:52) also says "The page scrolls to the top".

   Correction: "the browser URL and history are updated, and the page scrolls to the top."


## /following-links

1. **A.** following-links.md:19-21, describing a plain `[up-follow]` link that replaces the main element:

   > Unpoly extracts the response's [main element](/main) and replaces the main element
   > on the current page. The rest of the page stays untouched: scroll positions, focus
   > and unsaved form fields all survive.

   For a main target this is a navigation that resets scroll to the top and moves focus to the new main
   element (`autoScroll` / `autoFocus` with `'layer-if-main'` / `'main-if-main'`, `src/unpoly/fragment.js:279-280`).
   The page itself says so at lines 58-61. Correction: "The rest of the page stays untouched:
   unsaved form fields and running scripts all survive." (scroll and focus are covered under *Navigation defaults*).

2. **A.** following-links.md:60, same wording as /links #1:

   > the browser URL and history are updated, and the new content is scrolled into view.

   Correction: "the browser URL and history are updated, and the page scrolls to the top."

3. **A.** Included partial `no-follow-reasons` (src/unpoly/pages/partials/no-follow-reasons.md:6), shown at
   following-links.md:90 and handling-all-links.md:24:

   > Links with an `[href="#"]` attribute that don't also have local HTML in an `[up-document]`, `[up-fragment]`, or `[up-content]` attribute.

   The exclusion matches every `[href]` that *starts with* `#`, e.g. `#section`, not only `#`:
   ``a[href^="#"]:not(${ATTRS_WITH_LOCAL_HTML})`` (`src/unpoly/link.js:133`). Spec:
   `spec/unpoly/link_spec.js:652` ("returns false for an #anchor link without a path, even if the link has [up-follow]").

   Correction: "Links with an `[href]` that only contains a `#hash` (like `#` or `#section`) and don't also
   have local HTML in an `[up-document]`, `[up-fragment]`, or `[up-content]` attribute."


## /handling-all-links

1. **A.** handling-all-links.md:38-42, the list of links that "will still activate on `click`":

   > - Links with an `[up-instant=false]` attribute.
   > - Links that are not [followable](#following-all-links).
   > - Any additional exceptions configured in `up.link.config.noInstantSelectors`.

   The default `noInstantSelectors` also contains `[onclick]` (`src/unpoly/link.js:136`). Spec:
   `spec/unpoly/link_follow_attr_spec.js:424` ("follows a[onclick] links on click instead of mousedown").
   With `instantSelectors.push('a[href]')` every link with an `onclick` attribute keeps activating on click.

   Correction: add "- Links with an `[onclick]` attribute." before the `noInstantSelectors` item.

(The `[href="#"]` partial finding is listed under /following-links #3 and applies here, too.)


## /preloading

1. **A.** preloading.md:73-77, example cannot work:

   ```js
   up.compiler('link[rel=next]', (link) => {
     return up.on('mouseenter', 'main', () => up.link.preload(link))
   })
   ```

   `up.on(type, selector, fn)` registers a delegating listener on `document` without `{ capture: true }`
   (`src/unpoly/classes/event_listener.js:45,52`). `mouseenter` does not bubble, so a non-capturing listener on
   `document` never sees it for `<main>`. The callback never runs. (Not run as a spec; follows from DOM event
   dispatch. The rest of the example holds: `up.link.preload()` has no followability check,
   `src/unpoly/link.js:511-532`, and the boot compiles `document.documentElement` including `<head>`,
   `src/unpoly/fragment.js:3181`.)

   Correction: use a bubbling event, e.g. `up.on('mouseover', 'main', () => up.link.preload(link))`
   (repeated calls are harmless, the request is cached), or keep `mouseenter` and pass `{ capture: true }`.

2. **A.** preloading.md:91-95:

   > The cached response will be used by any link to the same URL:
   >
   > ```html
   > <a href="/menu">Menu</a>
   > ```

   A bare `<a href="/menu">` is not followable by default (`followSelectors: ['[up-follow]', 'a:is(...)']`,
   `src/unpoly/link.js:123`), so the browser makes a full page load and never reads Unpoly's cache.

   Correction: `<a href="/menu" up-follow>Menu</a>`, and "used by any [followed](/up-follow) link to the same URL".


## /navigation-bars

no findings

(Checked: `navSelectors`, `noNavSelectors`, `currentClasses`, `aria-current="page"`
(`src/unpoly/status.js:48-53,144-147`); comma-separated `[up-alias]` (`u.getSimpleTokens` splits on `[,\s]`,
`src/unpoly/util.js:1846`); hash ignored (`spec/unpoly/status_nav_spec.js:309,318`); `[up-nav]` on a link
itself (`status_nav_spec.js:39`); `[up-layer]` on a nav (`status_nav_spec.js:549-645`); overlays without
visible history still match (`status_nav_spec.js:683`).)


## /faux-interactive-elements

no findings

Side note (code, not docs): `makeClickable()` activates `[role=button]` elements on
`event.key === 'Space'` (`src/unpoly/link.js:671`), but browsers report the space bar as `event.key === ' '`
(`'Space'` is the `event.code`). Faux buttons may therefore not react to the space bar. The page does not
promise space-bar activation, so this is not a doc finding.
