Target derivation
=================

Unpoly often needs to guess a CSS selector that will [match an element](/targeting-fragments). This is called *target derivation*.

In the example below Unpoly derives a target selector for an element that is being reloaded:

```js
let element = document.querySelector('#foo')
up.reload(element) // Derives the target '#foo' from the given element
```

Popular features that must derive targets are `[up-poll]`,  `[up-hungry]`, `[up-viewport]`, [`up.reload(Element)`](/up.reload) and [`up.render(Element)`](/up.render).



Identifying properties
----------------------

To build a good selector, the element needs an **identifying property** that distinguishes it from other elements on the same [layer](/up.layer). The most important properties that Unpoly looks for are the following:

- The element's `[id]` or `[up-id]` attribute
- The tag name of a page-unique element (`<html>`, `<head>`, `<body>`, `<main>`)
- The element's `[name]` attribute
- The element's combined `[class]` names, ignoring `up.fragment.config.badTargetClasses`.

When none of these properties are found, Unpoly will attempt [additional derivation patterns](#derivation-patterns) to come up with a good selector before giving up.

Sometimes you may find that Unpoly cannot derive a good target for an element, or that the derived target matches the wrong element. In such cases consider giving your element an `[id]` property, which is HTML's standard way of identifying an element on the page.


Derivation patterns
-------------------

Unpoly lets you configure patterns for target derivation in `up.fragment.config.targetDerivers`.

By default the following patterns are configured, with decreasing priority. Examples for selectors produced can be found in comments:

```js
up.fragment.config.targetDerivers = [
  '[up-id]',         // [up-id="foo"]
  '[id]',            // #foo
  'html',            // html
  'head',            // head
  'body',            // body
  'main',            // main
  '[up-main]',       // [up-main="root"]
  'link[rel]',       // link[rel="canonical"]
  'meta[property]',  // meta[property="og:title"]
  '*[name]',         // input[name="email"]
  'form[action]',    // form[action="/users"]
  'a[href]',         // a[href="/users/"]
  '[class]',         // .foo (filtered by up.fragment.config.badTargetClasses)
  'form',            // form
]
```

Only applicable pattern will produce a target. E.g. the pattern `'link[rel]'` only applies to `<link rel="...">` elements and will be ignored for anything else.

Note how any attribute in a pattern is expanded to include an element's actual attribute value. E.g. the pattern `a[href]` produces a target like `a[href="/users"]`.
Similarily the asterisk (`*`) will be expanded to the element's actual tag name. 

If your deriver can't be expressed in a pattern string, you may also push a `Function(Element): string?`.



Derived target verification
---------------------------

Unpoly verifies if a derived targets will actually match the element. If another element is matched, the next applicable pattern in `up.fragment.config.targetDerivers` is tested.

If no pattern produces a matching target, an error `up.CannotTarget` is thrown. In such cases consider setting an `[id]` attribute, or configure a new [derivation pattern](#derivation-patterns).

Target verification may be [disabled](/up.fragment.config#config.verifyDerivedTarget), which is almost always a bad idea.


Deriving a target programmatically
----------------------------------

Your JavaScript can use `up.fragment.toTarget()` to derive a target from an element:

```js
element = up.element.createFromHTML('<span class="klass">...</span>')
selector = up.fragment.toTarget(element) // returns '.klass'
```

If no [verified](#derived-target-verification) target can be derived, an error `up.CannotTarget` is thrown.

To test if a selector can be derived from a target, use `up.fragment.isTargetable()`.


@page target-derivation
