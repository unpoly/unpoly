# Sitting packet: Scripting chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
You approved all seven pages in the Scripting sitting (2026-10-06/07, plan.md:1184-1227). Since then only the
fix round touched them. So this packet carries only the fix-round changes and the deferred items:
C20 (/scripting), B22 (/templates side; the change would be on /providing-html), B23 (/script-security).
Already decided and applied: A55-A61 (794062ab2). Decided, applied separately: C21 / open item 15A
(delete the commented-out "General advice" block, script-security.md:9-33).

| Page | Pointers |
|------|----------|
| scripting | 1 |
| enhancing-elements | 0 |
| data | 0 |
| templates | 1 |
| islands | 0 |
| legacy-scripts | 0 |
| script-security | 1 |


## Scripting (`/scripting`, 121 lines)

Chapter overview: enhancing elements, the long-lived page, attaching data, rendering templates,
mounting framework components.

**Changed since writing**
- Nothing on 2026-10-10/11.

### 1. "Enhancing elements" is the third copy of the plain compiler (C20, deferred duplication)

> The function is called once for each `.current-time` element, when the page first
> loads and when a matching fragment is rendered later. This replaces listening
> to `DOMContentLoaded`, which only fires for the initial page.

(scripting.md:20-22, after the same `.current-time` compiler as start/elements.md:21-23)

> The function is called **once for each matching element**: when the page first
> loads, and again whenever a fragment update inserts a `.current-time` element.
>
> This replaces listening to `DOMContentLoaded`. Because Unpoly updates fragments,
> the browser keeps the same document through many navigations, …

(start/elements.md:26-31)

> The compiler function is called once for each matching element, when
> the page first loads and when a matching fragment is rendered later.

(enhancing-elements.md:32-33)

Then "The page is long-lived" (scripting.md:39-45) restates the destructor sentence just above it
("keeps effects like timers or global listeners from outliving their element"). It is also the only map
section without a read-more link.

Readers reach this overview after Start, where they met the plain compiler. What the overview can add is
the element's *lifetime*: enter, live, leave. The second code block (the clock with a destructor) already
shows all of it. You approved this page before the duplication scan existed. (Pattern 5)
No inbound links to `/scripting#the-page-is-long-lived` (grepped src/ and ../unpoly-site/source).

- **A.** Re-angle to lifetime: lead with the destructor example, fold "The page is long-lived" into it,
  drop the first code block.
- **B.** Leave it.

**Lean: A (medium).** Draft for scripting.md:9-45 (the intro at :4-6 stays):

````md
Enhancing elements
------------------

When Unpoly updates a fragment, the browser keeps the same document and JavaScript environment,
often through many navigations. A compiler scopes your behavior to an element's lifetime.
Unpoly calls it when a matching element enters the page, and calls the *destructor* it returns
when the element is removed:

```js
up.compiler('.current-time', function(element) {
  let update = () => element.textContent = new Date().toString()
  let timer = setInterval(update, 1000)
  return () => clearInterval(timer) // mark: return
})
```

The clock starts for every `.current-time` element, at the initial page load or with a later
fragment update. When the fragment around it is swapped, the destructor stops the timer,
so the long-lived page collects no stale timers.

<p class="read-more"><a href="/enhancing-elements">Read more: Enhancing elements with JavaScript</a></p>
````


## Enhancing elements (`/enhancing-elements`, 267 lines)

**Changed since writing**
- 794062ab2 (A56): compilers run in registration order, `{ priority }` changes it (enhancing-elements.md:35-36).
- 794062ab2 (A57): a library that adds a popup or listeners outside the input needs a destructor (:81-82).
- 794062ab2 (A55): destructors run only when Unpoly removes the element; use `up.destroy()` in your own code (:158-160).

No pointers. (Checked: the loop runs each compiler over all its matches before the next one,
hello_fragment.js:66-91; `/up.compiler#order` exists, script.js:223.)


## Attaching data to elements (`/data`, 244 lines)

**Changed since writing**
- 794062ab2 (A58): `[up-data]` wins over `data-*` (data.md:105), `[up-use-data]` wins over both (data.md:177).

No pointers. (Checked: merge order template data → `dataset` → `[up-data]` → compile data, script.js:864-869.)


## Templates (`/templates`, 236 lines)

**Changed since writing**
- 794062ab2 (A59): the Option 1 link now references `#task-template` (templates.md:101).

### 1. /providing-html copies "Rendering a template" (B22, deferred duplication)

> To refer to a template, pass its CSS selector to any attribute or option that accepts HTML:
>
> ```html
> <a href="#" up-target=".target" up-document="#my-template">Click me</a>
> <div class="target">Old content</div>
> <template id="my-template"><div class="target">New content</div></template>
> ```
>
> When the link is clicked, Unpoly will look for a template matching `#my-template`.
> The template is cloned and the `.target` is updated with a matching element from the cloned template.

(templates.md:18-36, code abridged)

> Instead of passing an HTML string, you may also refer to a [`<template>` element](…)
> in any attribute or option that accepts HTML:
>
> (the same code block)
>
> The template is cloned and the `.target` is updated with a matching element from the clone.

(providing-html.md:214-236)

Same code block, nearly the same sentence. This page owns templates. /providing-html's angle is
"which sources of HTML exist", and its table already lists templates. (Pattern 5, 1)
The `{#template}` anchor stays: providing-html.md:204 links to it.

- **A.** Shrink the /providing-html section to two sentences, no code.
- **B.** Leave both.

**Lean: A (medium).** Draft for providing-html.md:214-236:

```md
Rendering a `<template>` {#template}
------------------------

Any attribute or option that accepts HTML also accepts the selector of a
[`<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).
The template is cloned and rendered without a server request. See [[templates]] for examples,
and [dynamic templates](/templates#dynamic) with variables, loops or conditions.
```


## Framework islands (`/islands`, 159 lines)

**Changed since writing**
- 794062ab2 (A60): the `[up-keep]` island has an `[id]`, and the text matches by `#theme-color` (islands.md:110, :115-116).

No pointers. (Checked: a kept element needs a derivable target, fragment.js:1027-1031.)


## Migrating legacy JavaScripts (`/legacy-scripts`, 128 lines)

**Changed since writing**
- 794062ab2 (A61): "When allowing inline scripts to run" replaced. Unpoly runs `<script>` elements in new
  fragments when the CSP allows them (legacy-scripts.md:88-90).

No pointers. A grammar slip is under "Clear fixes". (Checked: `scriptElementPolicy` defaults to `auto`,
script.js:83; `/script-security#script-elements` exists, script-security.md:158.)


## Script security (`/script-security`, 294 lines)

**Changed since writing**
- Nothing on 2026-10-10/11. Pending: open item 15A deletes the commented-out block at script-security.md:9-33.

### 1. The `<meta name="csp-nonce">` block appears three times (B23, deferred)

> For Unpoly to be able to verify nonces, you must include a `<meta name="csp-nonce">` tag
> in the `<head>` of the initial page load:
>
> ```html
> <head>
>   <meta name="csp-nonce" content="secret123"> <!-- mark: secret123 -->
>   ...
> </head>
> ```

(script-security.md:100-108 in "Restricting callbacks with nonces", word for word again at :195-203 in
"Restricting script elements with nonces", and at :247-255 in "Providing the document nonce", which owns it)

> Nonces in your HTML only need to match the response you're currently rendering.
> Unpoly will [rewrite your HTML](#nonce-rewriting) so all allowed nonces match the current document.

(:124-125, again at :223-224; a third variant at :280)

Literal copies on one page. You approved this page as shipped. The meta block is a setup step, and
the owner section is a link away. The rewrite note is two lines and answers the expert's "do I have to reuse
the first nonce?" right where the examples use `secret123`. (Pattern 5)

- **A.** Replace the two meta blocks with one pointer sentence each, keep the rewrite notes.
- **B.** Also drop the two rewrite notes (pre-pass proposal).
- **C.** Leave it.

**Lean: A (medium).** Draft for script-security.md:100-110:

```md
For Unpoly to verify nonces, provide the [document nonce](#meta-csp-nonce) in a `<meta name="csp-nonce">` tag.
With a document nonce of `secret123`, only callbacks with a matching nonce will be executed:
```

Draft for script-security.md:195-205:

```md
For Unpoly to verify nonces, provide the [document nonce](#meta-csp-nonce) in a `<meta name="csp-nonce">` tag.
Unpoly will now block any script without a matching nonce:
```


## Clear fixes (apply without asking)

1. legacy-scripts.md:41. The subject is "Compilers" (plural) in the line before.
   `> It should not use \`document.querySelectorAll()\` to process elements` →
   `> They should not use \`document.querySelectorAll()\` to process elements`
