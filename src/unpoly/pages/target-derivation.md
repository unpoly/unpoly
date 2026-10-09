Target derivation
=================

When Unpoly is given an element instead of a selector, it guesses a CSS selector that
[matches that element](/targeting-fragments). This is called *target derivation*.
A good guess needs an identifying attribute like `[id]`, and you can configure how the guess is made.

In the example below, Unpoly derives a target selector for an element that is being reloaded:

```js
let element = document.querySelector('#foo')
up.reload(element) // Derives the target '#foo' from the given element
```

Features that must derive targets include `[up-poll]`, `[up-hungry]`, `[up-viewport]`,
[`up.reload(Element)`](/up.reload) and [`up.render(Element)`](/up.render).


Identifying properties
----------------------

To build a good selector, the element needs an *identifying property* that distinguishes it
from other elements on the same [layer](/up.layer). The most important properties that Unpoly looks for are:

- The element's `[id]` or `[up-id]` attribute
- The tag name of a page-unique element (`<html>`, `<head>`, `<body>`, `<main>`)
- The element's `[name]` attribute
- The element's `[class]` names, ignoring `up.fragment.config.badTargetClasses`

When none of these properties are found, Unpoly tries [additional derivation patterns](#derivation-patterns)
before giving up.

When Unpoly cannot derive a good target for an element, or when the derived target matches
the wrong element, give the element an `[id]` attribute. That is HTML's standard way of
identifying an element on the page.


Derivation patterns
-------------------

The patterns for target derivation are configured in `up.fragment.config.targetDerivers`.
Each pattern produces a target selector when it applies to the element.
Patterns are tried in order, so earlier entries have priority.

These are the default patterns, with examples of the selectors they produce:

```js
up.fragment.config.targetDerivers = [
  '[up-id]',                     // [up-id="foo"]
  '[id]',                        // #foo
  'html',                        // html
  'head',                        // head
  'body',                        // body
  'main',                        // main
  '[up-main]',                   // [up-main="root"]
  (element) => { ... },          // up-modal (the tag name of <up-*> elements)
  'link[rel][type]',             // link[rel="alternate"][type="application/rss+xml"]
  'link[rel=preload][href]',     // link[rel="preload"][href="/font.woff2"]
  'link[rel=preconnect][href]',  // link[rel="preconnect"][href="https://cdn.example.com"]
  'link[rel=prefetch][href]',    // link[rel="prefetch"][href="/next.html"]
  'link[rel]',                   // link[rel="canonical"]
  'meta[property]',              // meta[property="og:title"]
  '*[name]',                     // input[name="email"]
  'form[action]',                // form[action="/users"]
  'a[href]',                     // a[href="/users"]
  '[class]',                     // .foo.bar (filtered by up.fragment.config.badTargetClasses)
  '[up-flashes]',                // [up-flashes=""]
  'form',                        // form
]
```

A pattern only applies to elements it describes. The pattern `'link[rel]'` only applies
to `<link rel="...">` elements and is skipped for anything else.

An attribute in a pattern is expanded to include the element's actual attribute value, so the
pattern `a[href]` produces a target like `a[href="/users"]`. An asterisk (`*`) is expanded to
the element's tag name. Values are fixed for a few attributes, like `rel=preload`.

To derive targets for elements that none of the patterns describe, push a pattern string of your own:

```js
up.fragment.config.targetDerivers.push('[data-id]') // [data-id="5"]
```

If your deriver can't be expressed in a pattern string, push a function that
takes an `Element` and returns a selector. A function that cannot handle the given element
should return `undefined`, so the next pattern is tried.


Derived target verification {#verification}
---------------------------

Unpoly verifies that a derived target actually matches the element it was derived from.
When another element is matched instead, the next applicable pattern in `up.fragment.config.targetDerivers` is tried.

For example, the second card below cannot use its class as a target, since `.card` would match the first card:

```html
<div class="card">...</div>
<div class="card">...</div> <!-- chip: no target can be derived -->
```

Verification rejects `.card` and moves on to the next pattern. If no pattern produces a matching target,
an error `up.CannotTarget` is thrown. In such cases, give the element an `[id]` attribute,
or configure a new [derivation pattern](#derivation-patterns).

Verification can be [disabled](/up.fragment.config#config.verifyDerivedTarget) with
`up.fragment.config.verifyDerivedTarget = false`, which is almost always a bad idea.


Deriving a target programmatically
----------------------------------

Your JavaScript can use `up.fragment.toTarget()` to derive a target from an element:

```js
let element = up.element.createFromHTML('<span class="klass">...</span>')
let selector = up.fragment.toTarget(element) // result: ".klass"
```

Also see the [options for `up.fragment.toTarget()`](/up.fragment.toTarget#parameters).

To test whether a selector can be derived from an element, use `up.fragment.isTargetable()`.


@page target-derivation
