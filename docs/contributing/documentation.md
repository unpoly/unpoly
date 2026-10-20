# Documentation

Unpoly has a large API surface, and developers meet most of it through the documentation
rather than the source. All public API must be documented thoroughly.

Documentation lives in this repository, beside the code it describes. A sister project
([`unpoly-site`](https://github.com/unpoly/unpoly-site)) parses `src/` and generates
[unpoly.com](https://unpoly.com) with every release; previewing it locally is optional.

<!-- toc -->
- [Where documentation lives](#where-documentation-lives)
- [Anatomy of a doc comment](#anatomy-of-a-doc-comment)
  - [Where to put the comment](#where-to-put-the-comment)
  - [Every symbol gets its own URL](#every-symbol-gets-its-own-url)
- [The feature types](#the-feature-types)
  - [How large a doc comment gets](#how-large-a-doc-comment-gets)
- [Documenting parameters](#documenting-parameters)
  - [Names, optionality and defaults](#names-optionality-and-defaults)
  - [Structured objects](#structured-objects)
  - [Modifying attributes](#modifying-attributes)
  - [Types](#types)
  - [Grouping params into sections](#grouping-params-into-sections)
  - [A note above the params](#a-note-above-the-params)
  - [Return values](#return-values)
- [Visibility](#visibility)
- [Writing prose](#writing-prose)
  - [Markdown flavor](#markdown-flavor)
  - [Referring to features](#referring-to-features)
  - [Rely on autolinking](#rely-on-autolinking)
  - [Line breaks](#line-breaks)
  - [Admonitions](#admonitions)
  - [Marking up code blocks](#marking-up-code-blocks)
  - [Dynamic values](#dynamic-values)
  - [Writing style](#writing-style)
- [Reusing text](#reusing-text)
  - [Markdown partials](#markdown-partials)
  - [Param partials](#param-partials)
  - [Inheriting a single param](#inheriting-a-single-param)
- [Guide pages](#guide-pages)
  - [Listing the page in `toc.yml`](#listing-the-page-in-tocyml)
  - [Linking the reference to a guide](#linking-the-reference-to-a-guide)
  - [Overview pages](#overview-pages)
- [Search ranking](#search-ranking)
  - [Keywords](#keywords)
- [Markdown for agents](#markdown-for-agents)
  - [What a page needs](#what-a-page-needs)
- [The contributing guides](#the-contributing-guides)
- [Modules and classes](#modules-and-classes)
- [Previewing your changes](#previewing-your-changes)
- [Changing the visual presentation on unpoly.com](#changing-the-visual-presentation-on-unpolycom)
<!-- /toc -->


## Where documentation lives

Unpoly has two kinds of documentation, and they do different jobs:

| | **API references** | **Guide pages** |
|---|---|---|
| Purpose | Technical reference for one symbol | Holistic article about one topic |
| Written as | A `/*- … */` comment beside the code | A Markdown file in `src/unpoly/pages/*.md` |
| Reader intent | *"What arguments are accepted?"* | *"How do I implement this requirement?"* |
| Example | [`/api/up.submit`](https://unpoly.com/api/up.submit) | [`/learn/submitting-forms`](https://unpoly.com/learn/submitting-forms) |

A guide is for a reader who doesn't yet know which feature solves their problem: it shows
a use case end to end, with many features working together, and skips most options and
edge cases. A reference is for a reader who has already chosen the feature: it covers every
option, the precise behavior and the edge cases. The same topic often needs both, and some
duplication is intended (see [Reusing text](#reusing-text)).

Both are parsed from files in this repository. The difference is the container:

- In a `.js` file, each `/*- … */` comment is one documentation block. A file can hold
  many blocks.
- In a `.md` file, the **entire file** is one documentation block.

Every block declares what it documents, and the container decides which declarations
are available:

| Container | Can declare |
|---|---|
| `.md` file | `@page`, `@partial` |
| `/*- … */` comment | `@module`, `@class`, `@function`, `@selector`, `@event`, `@property`, `@constructor`, `@header`, `@cookie` |

A block that declares none of these is an error, so every doc comment has exactly one.

The dash in `/*-` is load-bearing:

| Opener | Meaning |
|---|---|
| `/*- … */` | Documentation. Parsed and published. |
| `/* … */`, `// …` | An internal comment for other maintainers. |

Our syntax is a *superset* of JSDoc — it adds directives
JSDoc has no concept of (`@selector`, `@event`, `@section`, `@mix`) and writes `@param`
in ways JSDoc doesn't allow, such as attributes without a type.
We avoid JSDoc's `/**` opener because IDEs and build tools detect it automatically and
would report JSDoc errors.


## Anatomy of a doc comment

Here is a complete one, from `src/unpoly/util.js`:

```js
/*-
Returns whether the given argument is a number.

Note that this will check the argument's *type*.
It will return `false` for a string like `"123"`.

@function up.util.isNumber
@param {any} value
@return {boolean}
@stable
*/
function isNumber(value) {
  return (typeof(value) === 'number') || value instanceof Number
}
```

Four parts, always in this order:

1. **Prose**, as Markdown. Lead with a summary of one or two sentences: the first
   paragraph is reused on its own in module listings and search results, so it must stand alone.
2. **The declaration** — what this is (`@function`) and its plain name (`up.util.isNumber`).
3. **Parameters and return value.**
4. **A mandatory visibility tag.** See [Visibility](#visibility).

Use `##` for headings inside the prose. Levels are normalized on the site, so they
don't need to match the surrounding page.

### Where to put the comment

Put the comment **directly above the code it documents** — the function, the compiler,
the property. Nothing in between.

Some code defines several public APIs at once: a function may emit events, a compiler
implements an attribute. Document what the code *is* above it, and give each API it
merely *produces* its own comment **below** the implementation. So a function `up.thing.verb()`
that emits `up:thing:foo` and `up:thing:bar` events is laid out in this order:

```js
/*-
@function up.thing.verb
*/
function verb() {
  up.emit('up:thing:foo')
  up.emit('up:thing:bar')
}

/*-
@event up:thing:foo
*/

/*-
@event up:thing:bar
*/
```

### Every symbol gets its own URL

The site derives a path by slugifying the declared name. API symbols live under `/api`,
guide pages under `/learn` (or under `/api` when `toc.yml` lists them in the API area):

| Declaration | URL on doc site |
|---|---|
| `@function up.render` | `/api/up.render` |
| `@function up.Layer#accept` | `/api/up.Layer.prototype.accept` |
| `@selector [up-submit]` | `/api/up-submit` |
| `@selector .up-current` | `/api/up-current` |
| `@event up:form:submit` | `/api/up:form:submit` |
| `@property up.form.config` | `/api/up.form.config` |
| `@header X-Up-Target` | `/api/X-Up-Target` |
| `@page submitting-forms` | `/learn/submitting-forms` |

Links in the docs spell out the prefix (`/learn/caching#expiration`). The old root
paths (`/up.render`) only redirect, so don't link to them.


## The feature types

A *feature* is a single documentable symbol. We extended JSDoc with these so we can
document the things JSDoc has no concept of — attributes, events, headers:

| Directive | Documents | Example |
|---|---|---|
| `@function` | A JavaScript function or method | `up.submit`, `up.Layer#accept` |
| `@selector` | An HTML attribute, CSS class or pseudo-selector | `[up-submit]`, `.up-current`, `:none` |
| `@event` | A DOM event Unpoly emits | `up:form:submit` |
| `@property` | A JavaScript value, including every `up.*.config` | `up.form.config`, `up.Layer#size` |
| `@constructor` | A class constructor | `up.Params` |
| `@header` | An HTTP header in the [server protocol](https://unpoly.com/api/up.protocol) | `X-Up-Target` |
| `@cookie` | A cookie in the server protocol | `_up_method` |

`@selector` covers all three CSS-ish shapes, because that's how a developer reaches the
feature — by writing something in their HTML or CSS.

### How large a doc comment gets

Feature comments range from a handful of lines to well over a hundred. Both ends are
normal, and the syntax is the same either way.

At the small end, a method with one argument and a return value. Note the `#` for an
instance method, and that a return value can carry its own description:

```js
/*-
Returns the first param value with the given `name`.

Returns `undefined` if no param value with that name is set.

@function up.Params#getFirst
@param {string} name
@return {any}
  The value of the param with the given name.
@experimental
*/
```

At the other end, `up.render()` — the function most of Unpoly delegates to. The real
comment in `src/unpoly/fragment.js` runs 131 lines; this is trimmed hard, with `...`
marking what's left out:

```js
/*-
Replaces elements on the current page with matching elements from a server response or HTML string.

## Choosing which fragment to update

...

@function up.render

@section Targeting
  @param {string|Element|jQuery|Array<string>} [target]
    The [target selector](/learn/targeting-fragments) to update.

    Instead of passing the target as the first argument, you may also pass it as
    a `{ target }` option. See [`{ target }`](#options.target) for details.

  @mix up.render/targeting

@section Navigation
  @mix up.render/navigation

@section Request
  @mix up.render/request

... nine more sections ...

@section Lifecycle hooks
  @mix up.render/lifecycle-hooks

@return {up.RenderJob}
  A promise that fulfills with an `up.RenderResult` once the page has been updated.

  ...

@stable
*/
```

Notice what carries the weight: thirteen `@section` groups, but only a *single* literal
`@param`. Everything else arrives through `@mix` from [param
partials](#param-partials). That's what keeps one option's description consistent across
`up.render()`, `up.follow()`, `up.submit()` and their HTML attributes — see
[Reusing text](#reusing-text).

The prose is worth a look too: a feature this large gets `##` sections explaining
concepts before the parameter list, because someone landing on `/api/up.render` needs to
understand targeting before any individual option means anything.


## Documenting parameters

`@param` describes a function argument, an option, an attribute or an event property.
It's by far the most common directive.

### Names, optionality and defaults

```jsdoc
@param {string} name          // required
@param {string} [name]        // optional
@param {string} [name='get']  // optional, with a default
```

Square brackets mean *optional*, as in JSDoc. Quote string defaults.

### Structured objects

Option objects keep their argument name as a prefix. This groups them into a single
argument in the rendered signature:

```jsdoc
@function up.submit
@param {Element} form
@param {boolean} [options.trim=false]
@param {string} [options.method='post']
```

Recognized prefixes include `options`, `attrs`, `params`, `config`, `eventProps` and
`props`.

### Modifying attributes

For a `@selector`, the params are its modifying attributes:

```jsdoc
@selector [up-poll]
@param [up-interval]      // optional attribute [up-interval]
@param [up-method='get']  // optional, with a default
```

The square brackets denote optionality, not the CSS attribute selector.
The site adds the attribute's own brackets when it displays `[up-interval]`.

### Types

Types go in braces before the name. They are **required** on params of `@function`,
`@property`, `@event` and `@constructor` — the site build fails without them. They are
meaningless on `@selector`, `@header` and `@cookie` params, which describe attributes
and header values, so those are written without a type.

The notation is **loosely** inspired by TypeScript, but there's nothing formal about it and
nothing verifies it. It documents intent for the reader:

| Type | Meaning |
|---|----|
| `{string}`                             | primitives, lowercased |
| `{Element}`                            | DOM and JS built-ins, capitalized |
| `{up.Layer}`                           | an Unpoly class |
| `{string\|Element\|jQuery}`            | a union |
| `{string\|undefined}`                  | optional value |
| `{Array<string>}`                      | an array |
| `{Object<string, string>}`             | a keyed object |
| `{List<Element>}`                      | an array-like value (Array, NodeList, arguments, etc.) |
| `{Function(element, index): boolean}`  | a function, by argument name |
| `{Function(up.Response): boolean}`     | a function, by argument type |
| `{Function(event, [element])}`         | a function with optional arguments |
| `{any}`                                | deliberately unconstrained |

Class names and built-ins inside a type are linked automatically, so `{up.Layer}` links
to its page and `{Element}` links to MDN.

### Grouping params into sections

Features with many params group them under `@section` headings, which become a mini
table of contents on the page. Params are indented under their section:

```js
@selector [up-poll]

@section Trigger
  @param [up-interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`, which defaults to 30 seconds.

@section Request
  @param [up-href]
    The URL from which to reload the fragment.

@stable
```

Sections only affect display. Use them once a feature has enough params that a flat
list stops being scannable.

### A note above the params

`@params-note` renders an admonition above the parameter list. It's mostly used to say
that a feature also accepts another feature's attributes:

```js
@selector [up-poll]
@params-note
  All modifying attributes for `[up-follow]` may also be used.
```

### Return values

```js
@return {boolean}
```

A description is optional, and goes indented below:

```js
@return {Array}
  An array of all values with the given name.
```


## Visibility

Every feature needs exactly one visibility tag:

| Tag | Meaning |
|---|---|
| `@stable` | Public and settled. Won't change without a [migration path](compatibility.md#breaking-changes). |
| `@experimental` | Public, but may still change. |
| `@deprecated` | Superseded. Names the replacement. |
| `@internal` | Not published at all. |

New API starts out `@experimental` and will be promoted to `@stable` some releases
later, if we're still happy with it. There's no fixed rule for when — it gets settled in
the feature discussion or in code review.

`@internal` is the only visibility not published on unpoly.com. Internal features get
no page, and mentions of them elsewhere in the docs are silently left unlinked. There's
no expectation that internal API is documented at all — most isn't — but *if* you write
a doc comment for something internal, it must say `@internal`.

**Omitting the tag fails the site build** for any feature whose name looks public
(`up.…`, `up:…`, `up-…`). That's deliberate: an untagged feature would otherwise
default to internal and quietly vanish from the site.

`@deprecated` takes a comment naming the replacement, which doubles as the deprecation
notice on the page:

```js
/*-
Returns a copy of the given object that only contains the given keys.

@function up.util.only
@param {Object} object
@param {Array} ...keys
@deprecated
  Use `up.util.pick()` instead.
*/
```

Because the old name keeps its own doc comment, it keeps its own page — which is why
renaming an API needs no URL redirect. See
[Compatibility](compatibility.md#breaking-changes) for the polyfill that goes with it.

A param inherits its feature's visibility unless it declares its own. Indent the tag
under the param:

```js
@param {boolean|string} [options.focusVisible='auto']
  Whether the focused element should have a [visible focus ring](/learn/focus-visibility).

  @experimental

@param {string} [options.inputDevice]
  The [input device](/api/up.event.inputDevice) used for the current interaction.

  @internal
```

Both directions are useful. `@experimental` on a param of a stable feature marks a
single option as provisional without destabilizing the rest. `@internal` **hides the param entirely** —
from the parameter list *and* from the rendered signature — which is how a public
function keeps an argument that only Unpoly itself passes.


## Writing prose

### Markdown flavor

`unpoly-site` renders doc comments and guide pages with
[commonmarker](https://github.com/gjtorikian/commonmarker): [CommonMark](https://commonmark.org/)
with GitHub's tables, strikethrough and autolinks, plus the extras in this guide. Raw HTML
passes through, and an HTML block ends at the first blank line. Quotes, dashes and `...`
stay as typed, so type `…` or `–` when you want them. A blank line between list items makes
the whole list loose (spaced paragraphs), so leave it out between short items.

### Referring to features

Because Unpoly has many similar-sounding APIs, the documentation uses consistent syntax
to distinguish DOM elements, attributes, classes, JS functions and non-function values:

- E.g. "the element is assigned an `.up-loading` class" (think CSS)
- E.g. "set an `[up-target]` attribute" (think CSS)
- E.g. "this will update the `<main>` element" (deviating from CSS here)
- E.g. "Call the `up.render()` function" (functions are referred to with parentheses)
- E.g. "Configure the `up.form.config.watchInputDelay` property" (no parentheses for
  non-function values)

### Rely on autolinking

Code in backticks becomes a link automatically. The docs are densely cross-referenced,
and hand-linking every mention would be unbearable — so **don't** write
`` [`up.render()`](/api/up.render) ``, just write `` `up.render()` ``.

This resolves:

- `up.render()` — arguments are stripped, so `up.render({ target: '.foo' })` works too
- `up.Layer#accept` — `#` maps to the prototype
- `up.form.config.watchInputDelay` — links to the config page at that property's anchor
- `[up-target]`, `.up-current` — the tag name is inferred, so you needn't write
  `a[up-target]`
- `Element`, `Promise`, `Array`, `FormData` and other built-ins — these link to MDN

Link by hand when you want a different label, or when autolinking can't resolve the
code: anything `@internal`, nested parentheses like `up.render(up.foo())`, snippets
containing ` = `, and code inside headings or fenced blocks. A mention of the page
you're currently on isn't linked either, so you can write `` `up.render()` `` freely in
its own doc comment.

Guide pages are autolinked with a **wikilink**: the page's slug in double brackets,
optionally with an anchor:

```markdown
For error handling, see [[error-responses]].
Expired content is refreshed after rendering. See [[caching#revalidation]].
```

A wikilink is labeled with the target's title (`Caching: Revalidation` for the anchored
form), so the label follows a retitle. It also works for features (`[[up.render#concurrency]]`),
which gives you the anchor that backtick autolinks lack. A slug or anchor that doesn't
resolve fails the site build. Wikilinks are not expanded inside code.

For your own label, write a plain Markdown link with the label woven into the sentence:
`Unpoly can revalidate [expired](/learn/caching#expiration) cache entries.`

A section of a chapter overview closes with a button to the page that tells the whole
story. Write it as a paragraph holding nothing but a wikilink with a `more:` prefix:

```markdown
[[more: following-links]]
```

It renders as a `More: Following links` button, like an `@learn-ref`. Don't write its HTML
by hand. A `[[more: …]]` within a sentence fails the site build.

Give a heading a stable anchor when you intend to link to it, so the URL survives a
rewording. The braces take [Pandoc's heading attributes](https://pandoc.org/MANUAL.html#heading-identifiers)
(`#id`, `.class`, `key=value`, bare `key`), on `#` and underlined headings alike:

```markdown
## Callback arguments {#callbacks}
### Closing when a location is reached {#location-condition data-toc-include}
```

### Line breaks

A single newline inside a paragraph renders as a space, so you can wrap a paragraph in
the source however you like. There is no line-length convention to maintain and no
reason to rewrap a paragraph you edited.

A trailing backslash forces a break where the source has none:

```markdown
Unpoly introduces new HTML attributes that can execute JavaScript code.\
This is a security risk if an attacker can inject HTML.
```

Those backslashes are deliberate. Leave them where they are.

### Admonitions

Blockquotes opening with a bracketed type render as callout boxes:

```markdown
> [tip]
> If you're looking to style the targeted fragment, see `.up-loading`.

> [important]
> This event does **not** signal the end of an animation.
```

Types are `note`, `tip`, `hint`, `info`, `important`, `warning`, `attention` and
`caution`. The quoted title is optional.

### Marking up code blocks

Code blocks support magic comments that highlight and annotate. Write them in the
comment syntax of the block's own language — `//` for JavaScript, `<!-- -->` for HTML,
`#` for Ruby:

| Comment | Effect |
|---|---|
| `// mark-line` | Highlights the whole line |
| `// mark: up-target` | Highlights just that phrase within the line |
| `// result: [1, 2, 3]` | Appends a badge showing what the line evaluates to |
| `// chip: Content goes here` | Appends a small caption badge |
| `// label: Bad example` | Adds a caption above the whole block |

Put the comment at the end of the line it affects. `label:` is the exception — it goes
on its own line at the top of the block.

```html
<div id="score" up-poll> <!-- mark: id="score" -->
  Score: 1400
</div>
```

```js
up.util.wrapList([1, 2, 3]) // result: [1, 2, 3]
```

### Dynamic values

A `[[=token]]` inserts a value that is computed when the site builds:

| Token | Inserts |
|---|---|
| `[[=version]]` | The current Unpoly version, e.g. `3.14.3` |
| `[[=npm_tag]]` | `@next` on a pre-release, nothing on a stable version |
| `[[=size unpoly.min.js]]` | The gzipped size of a file in `dist/`, e.g. `12.9 KB` |
| `[[=base_url]]` | The site's origin, e.g. `https://unpoly.com` (the preview's own origin while previewing) |

Unlike wikilinks, tokens are substituted inside code blocks too, which keeps install
snippets current (`unpoly@[[=version]]/unpoly.min.js`). Escape a literal opener as `\[[=`.

### Writing style

The existing pages are no style canon: keep what works, improve what doesn't. A few
conventions hold everywhere:

- Open with one or two sentences saying what the topic *is*, never "in this guide you will learn".
  That first paragraph doubles as the description on hubs and in search, so it must stand alone.
- Headings name tasks or things ("Declaring dependencies"), not meta ("Overview of X").
- Prefer short declarative sentences. "You" for instructions, "we" in walkthroughs.
- Lead with value: say what the reader gets before explaining mechanics.
- Concrete beats abstract ("your scroll position survives", not "application behavior").
- Don't enumerate features in prose; any pick of three reads as arbitrary. Let code and lists do it.
- Don't join two statements with an em-dash connective. Write two sentences.
- In guides, show code early and often.
- End on the last technical section. No closing summary.
- Before review, run the `humanizer` skill to remove AI writing patterns.
  The skill is vendored unmodified (update with `npx skills update`), so tell it:
  the conventions in this guide override its rules, and the following are house
  style here, not tells — passive voice and software-as-actor prose ("the fragment
  is updated"), adverbs that carry semantics ("automatically", "optionally"),
  definition lists with bold lead terms, admonitions, "See X for details" pointers,
  enumeration ("there are three ways to..."), lead paragraphs saying what a page
  covers, a pedagogical tone in guides, and technical senses of "framework",
  "robust" or "ecosystem". It must never change code, `@directives`, link targets
  or `{#anchor}` suffixes.
- Watch for AI patterns the skill misses: closers that restate their section, staged
  rebuttals of beliefs nobody stated, dramatic sentence fragments, bold on every list
  item, clauses dangling after a dash.


## Reusing text

Unpoly's documentation repeats itself on purpose: the same option is explained in a
reference, in a guide, sometimes on a getting-started page, because a reader needs it in
each place. The directives below keep those copies consistent. **Extract when you notice
a repetition, not on principle.**

### Markdown partials

A partial is a reusable Markdown snippet, declared in its own file under
`src/unpoly/pages/partials/`:

```markdown
> [note]
> Request headers that influenced a response should be listed in a `Vary` response header.

@partial vary-header-note
```

Include it anywhere, at any indentation:

```js
@include vary-header-note
```

### Param partials

A partial can also hold a set of params rather than prose. Those live under
`src/unpoly/pages/params/<feature>/<section>.md`. Pull one in with `@mix`:

```js
@section Loading state
  @mix up-follow/loading-state
```

`@mix` splices in every param the partial defines. Override individual params by
indenting them below it — an override inherits whatever it doesn't restate:

```js
@mix up.render/request
  @param options.url
    Where to send the form data when the form is submitted.

    Defaults to the form's `[action]` attribute.
```

Naming a param the partial doesn't define is an error, so overrides can't silently rot.

Most of this machinery serves `up.render()`, `up.follow()`, `up.submit()`, `[up-follow]`
and `[up-submit]`, the funnel nearly everything else delegates to. So a **new render
option belongs in `pages/params/up.render/<section>.md`**, the canonical copy feeding
around ten pages. Writing it into a doc comment instead would silently desync
`up.follow`, `[up-follow]`, `up.submit` and the rest.

### Inheriting a single param

`@like` copies one param from another feature, for when two features share an option
but not a whole section:

```js
@param {Object} [options.headers]
  @like up.follow
```

By default it looks for a param of the same name. Address a differently-named one with
a slash:

```js
@param [up-params]
  @like [up-submit]/up-params
```

Like `@mix`, it only fills in what you left blank — type, default, optionality,
visibility, prose — so you can inherit the type and still write your own description.
It works on `@return` too.


## Guide pages

A guide page is one article per topic, written from the developer's point of view.
Each is one Markdown file in `src/unpoly/pages/`. The title is a Markdown h1
underline, and the directives go at the bottom:

```markdown
Submitting forms in-place
=========================

You can enhance any form to update the existing page, without making a full page load.

## Forms that update fragments

...

@page submitting-forms
@menu-title Submitting forms
```

`@page` sets the slug and therefore the URL (`/learn/submitting-forms`). The slug is the full
path, and the file must live where the slug says: `@page start/forms` is written in
`pages/start/forms.md`, or the site build fails. `@menu-title` is optional, and gives
the navigation a shorter label than the title.

### Listing the page in `toc.yml`

`src/unpoly/pages/toc.yml` groups pages into topics for the Learn and API sections, in
reading order. **A new page needs its entry in the same commit** — the site refuses to
build when a page is missing from it, listed twice, or when it names a slug that doesn't
exist. The order within a Learn topic drives the previous/next navigation, so where you
insert a page is an editorial decision.

A Learn page that belongs to no chapter goes in the area's `loose:` list. Nothing lists
it (sidebar, `/learn` hub, previous/next); readers reach it only through links.

### Linking the reference to a guide

The `@learn-ref` directive on a feature or module renders a prominent "Learn:" link to a
guide page below the lead paragraphs:

```js
@selector [up-poll]
@learn-ref polling
```

It is repeatable and takes an anchor (`@learn-ref caching#expiration`). The label is the
target's title, or "Title › Heading" for an anchor; indent your own label below to override
it. A slug or anchor that doesn't resolve fails the site build.

Point it at the Learn page that covers the symbol's wider topic, even if that page never
mentions the symbol: `up:request:loaded` belongs to `/network`, `[up-anchored=right]` to
`/overlays`. Link a second page only when the symbol belongs to two topics equally.

When you add a guide page, give the features of its topic a `@learn-ref`, or nothing will
link to it. `rake docs:learn_refs` in `unpoly-site` lists the public selectors and events
that still lack one.

> [!IMPORTANT]
> Renaming a page changes its URL, and unlike a renamed API, we don't keep the old page
> around as deprecated. Add redirects to `src/unpoly-migrate/.htaccess`, which unpoly.com
> includes, for both the full and the short path (unpoly.com only resolves `/foo` while
> that page exists):
>
> ```apache
> RedirectPermanent /learn/old-page-name /learn/new-page-name
> RedirectPermanent /old-page-name /learn/new-page-name
> ```
>
> Also point every redirect that led to the old page at the new one: `rake docs:check_urls`
> in `unpoly-site` fails on a chain of redirects. The `.md` twin needs no redirect.
>
> A renamed or moved section needs no redirect either. Update the links in this repository
> and don't leave an `<a id="…">` shim behind.


### Overview pages

Every topic in the Learn section opens with an overview page. It is not a table of
contents (the sidebar is one). Its jobs, roughly in reading order:

- Open with a standalone paragraph saying what Unpoly offers for this topic.
- Establish the mental model and terms the topic's other pages assume.
- Show a minimal working example of the most common case.
- Map the two to four most common needs (or exciting features), each a situation
  sentence with a taste of code and a `[[more: …]]` to its detail page. The remaining
  pages, and pages in other topics readers will look for here, get a one-line mention
  under a closing "See also" section.
- Name a boundary ("infinite scrolling is not here") only where readers will plausibly
  take a wrong turn.

Stay between 400 and 800 words. Good exemplars are `src/unpoly/pages/loading-state.md`
and `src/unpoly/pages/overlays.md`.

Pages in a tutorial register, like the Getting started chapter, may bold one phrase per
section: always the behavioral outcome ("updates **the `<form>` itself**"), never a feature
name or code.


## Search ranking

The search on unpoly.com ranks documents marked `@signature` above the rest. Mark core
features many apps will use (like `[up-follow]` or `up.render()`), key concepts, and guide
pages for beginner and intermediate users. Edge cases, escape hatches and dry reference
pages stay unmarked. The directive goes on its own line, next to the other directives
(below `@page` on a guide page):

```js
@selector [up-follow]
@stable
@signature
```

When a page ranks wrong, fix it here rather than in the search code. A change shows only
after the index is rebuilt: run `SKIP_CHECK_LINKS=1 bundle exec rake search:index` in
`unpoly-site`.

### Keywords

Our prose uses one term per concept ("overlay"), but readers search with their own words
("modal"). `@keywords` lists such words so the search finds the page anyway:

```markdown
@page closing-overlays
@keywords dialog, modal
```

Keywords are never shown, and count less than a word in the title. Add one only when a
reader would plausibly type it, the page's prose doesn't use it in any form, and the page
isn't already among the top five results. Per page, allow up to two synonyms for the term
the page is about and up to four page-specific words (like "toast" for flashes). Most pages
need none. Never change the prose to use a reader's word instead of our term.


## Markdown for agents

Every documentation page on unpoly.com also exists as Markdown, for coding agents and
LLMs: its URL plus `.md` (`/api/up.render.md`), or the page's own URL requested as
`text/markdown`. `/index.md` (also `/llms.txt`) lists the guide chapters and API modules,
and the `unpoly-docs` agent skill bundles all pages.

You write nothing extra for this: `unpoly-site` converts each rendered page's HTML to
Markdown. Headings keep their ids as `{#id}`.
To see what a change does to the Markdown, open the page's `.md` URL in the preview.
`unpoly-site` pins the output of its test pages in golden files (see its README).

### What a page needs

The converter can't look at pictures, so the build fails unless a page describes its media.
Every image and video is a `<figure>`. Its `alt` (an `aria-label` for a video) names the
kind of medium in a few words. Its `<figcaption>` describes what the reader should learn
from it, without repeating the surrounding text:

```html
<figure>
  <img src="images/render-lifecycle.svg" alt="Flowchart of the render lifecycle" width="900">
  <figcaption>

A render pass moves through these stages:

1. A guard event is emitted, like `up:link:follow`.
2. …

  </figcaption>
</figure>
```

Leave a blank line after `<figcaption>` and before `</figcaption>`, so the caption is
parsed as Markdown. On the site the caption is visually hidden, but screen readers and
search read it.

An embedded diagram (`<div embed="…">`) is an `<svg role="img">` with a `<title>` and a
`<desc>`, and an `id` on the svg or its `<figure>`.

A page's table of contents lists only top-level headings. Add `data-toc-include` to a
lower heading to list it too (see the `{…}` example under
[Rely on autolinking](#rely-on-autolinking)).

## The contributing guides

The guides in `docs/contributing/` are for people and agents working *on* Unpoly, and are
never published. GitHub renders them, so none of the conventions above apply: no
directives, no autolinking, no partials, no custom `{#anchor}`. Link to a section by
GitHub's generated slug (`testing.md#how-specs-are-organized`), and write admonitions as
`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]` or `> [!CAUTION]`.

Long guides carry a generated table of contents between `<!-- toc -->` markers. Run
`bin/update-contributing-tocs` after changing a heading. `bin/self-test` fails on a stale
TOC, a long guide without one, or a link to a heading that no longer exists.

> [!IMPORTANT]
> These guides describe this repository's tooling and layout, so update them in the same
> commit that renames a `bin/` script, moves a directory or adds a spec convention. Also
> check the summary of that guide in [`CONTRIBUTING.md`](../../CONTRIBUTING.md).


## Modules and classes

You'll rarely add one of these, but every file with doc comments depends on one.

A module or class block gives a [main module](code-organization.md#responsibilities) its
own page and title:

```js
/*-
Forms
=====

The `up.form` module helps you work with non-trivial forms.

@learn-ref submitting-forms
@learn-ref validation

@module up.form
*/
```

Two things to know:

- **Every file that documents features must declare its own `@module` (or `@class`)
  first.** Features attach to the most recently parsed interface, so a file without one
  would file its features under whichever module happened to be parsed before it.
  `src/unpoly-migrate/form.js` opens with `@module up.form` for exactly this reason;
  repeated declarations of the same module are merged.
- **There is no `@see` directive.** Point at related features in the prose, e.g.
  "See also `up.network.isBusy()`.", and at guide pages with `@learn-ref`.

`@class` blocks also use `@parent` to nest under a module in the menu, e.g.
`src/unpoly/classes/params.js` declares `@parent up.form`.


## Previewing your changes

Previewing is **optional**. Documentation has no automated tests, and a wrong directive
is a code-review fix rather than a blocker — so don't stall on it. Write the prose, make
your best attempt at the syntax, and flag anything you're unsure of in the pull request.

If you do want to see the output, check out `unpoly-site` next to this repository — it
needs Ruby, and its README has the setup steps.
[`bin/dev`](dev-environment.md#running-the-dev-environment) then boots it alongside the
build watcher and serves it at <http://localhost:4567>.

Edits to existing pages appear on reload. A *new* page — a new API symbol or a new
guide page — only appears after restarting the dev environment.


## Changing the visual presentation on unpoly.com

The sister repository [`unpoly-site`](https://github.com/unpoly/unpoly-site) has
the HTML templates, CSS and JavaScripts for [unpoly.com](https://unpoly.com).
It also contains a parser that reads the API documentation content from the `unpoly/unpoly` sources.

What you need to know to write documentation *content* lives in this guide. How `unpoly-site`
is implemented (its parser, templates and Markdown conversion) is explained in its README,
starting with [What lives where](https://github.com/unpoly/unpoly-site#what-lives-where).
