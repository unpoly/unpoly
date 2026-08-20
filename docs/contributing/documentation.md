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
  - [Referring to features](#referring-to-features)
  - [Rely on autolinking](#rely-on-autolinking)
  - [Line breaks](#line-breaks)
  - [Admonitions](#admonitions)
  - [Marking up code blocks](#marking-up-code-blocks)
- [Reusing text](#reusing-text)
  - [Markdown partials](#markdown-partials)
  - [Param partials](#param-partials)
  - [Inheriting a single param](#inheriting-a-single-param)
- [Guide pages](#guide-pages)
- [The contributing guides](#the-contributing-guides)
- [Modules and classes](#modules-and-classes)
- [Previewing your changes](#previewing-your-changes)
<!-- /toc -->


## Where documentation lives

Unpoly has two kinds of documentation, and they do different jobs:

| | **API references** | **Guide pages** |
|---|---|---|
| Purpose | Technical reference for one symbol | Holistic article about one topic |
| Written as | A `/*- … */` comment beside the code | A Markdown file in `src/unpoly/pages/*.md` |
| Reader intent | *"What arguments are accepted?"* | *"How do I implement this requirement?"* |
| Example | [`/up.submit`](https://unpoly.com/up.submit) | [`/submitting-forms`](https://unpoly.com/submitting-forms) |

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

The site derives a path by slugifying the declared name:

| Declaration | URL on doc site |
|---|---|
| `@function up.render` | `/up.render` |
| `@function up.Layer#accept` | `/up.Layer.prototype.accept` |
| `@selector [up-submit]` | `/up-submit` |
| `@selector .up-current` | `/up-current` |
| `@event up:form:submit` | `/up:form:submit` |
| `@property up.form.config` | `/up.form.config` |
| `@header X-Up-Target` | `/X-Up-Target` |
| `@page submitting-forms` | `/submitting-forms` |


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
| `@header` | An HTTP header in the [server protocol](https://unpoly.com/up.protocol) | `X-Up-Target` |
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
    The [target selector](/targeting-fragments) to update.

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
concepts before the parameter list, because someone landing on `/up.render` needs to
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
  Whether the focused element should have a [visible focus ring](/focus-visibility).

  @experimental

@param {string} [options.inputDevice]
  The [input device](/up.event.inputDevice) used for the current interaction.

  @internal
```

Both directions are useful. `@experimental` on a param of a stable feature marks a
single option as provisional without destabilizing the rest. `@internal` **hides the param entirely** —
from the parameter list *and* from the rendered signature — which is how a public
function keeps an argument that only Unpoly itself passes.


## Writing prose

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
`` [`up.render()`](/up.render) ``, just write `` `up.render()` ``.

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

Guide pages are linked by path. A link to the *main article* for a topic gets a marker
that styles it as a prominent reference:

```markdown
[Polling](/polling){:.article-ref}
```

Give a heading a stable anchor when you intend to link to it, so the URL survives a
rewording:

```markdown
## Callback arguments
```

### Line breaks

The renderer keeps single newlines as line breaks, so how you wrap a paragraph in the
source is how it reads on the site. There is no line-length convention to maintain and
no reason to rewrap a paragraph you edited.

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


## Reusing text

Unpoly's documentation repeats itself a lot, and that's intentional. The same option is
explained in a technical reference, in a holistic guide, sometimes in a tutorial,
because a reader learning the topic needs it in each place. What's good for the reader
is punishing for us: the same sentence lives in many spots and has to stay consistent.

That's what the directives below are for. **Extract when you notice a repetition, not
on principle** — chasing consistency for its own sake produces more indirection than it
saves.

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

Most of this machinery exists for a handful of features. `up.render()`, `up.follow()`,
`up.submit()`, `[up-follow]` and `[up-submit]` are the funnel that nearly everything
else delegates to, so they pool the options of many features at once. `pages/params/`
has directories for exactly those, plus a few small shared pairs.

One consequence worth knowing: a **new render option belongs in
`pages/params/up.render/<section>.md`**, because that partial is already the canonical
copy feeding around ten pages. Writing it into a doc comment instead would silently
desync `up.follow`, `[up-follow]`, `up.submit` and the rest.

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

Guide pages are the holistic half of the documentation: one article per topic, written
from the developer's point of view, tying many API symbols together into something you
can actually build. These deserve our best writing and our best examples. References
are for looking things up; guides are for learning.

Each page is one Markdown file in `src/unpoly/pages/`. The title is a Markdown h1
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

`@page` sets the slug and therefore the URL (`/submitting-forms`). `@menu-title` is
optional, and gives the navigation a shorter label than the title.

Reference pages point at their main article with an `{:.article-ref}` link, and modules
list their articles with `@see`. Add a new page to its module's `@see` list, or nothing
will link to it.

> [!IMPORTANT]
> Renaming a page changes its URL, and unlike a renamed API, we don't keep the old page
> around as deprecated. Add a redirect to `src/unpoly-migrate/.htaccess`, which
> unpoly.com includes:
>
> ```apache
> RedirectPermanent /old-page-name /new-page-name
> ```


## The contributing guides

Everything above describes the documentation Unpoly *publishes*: doc comments and guide pages
under `src/`, parsed by `unpoly-site` and served from unpoly.com. The guides you are reading now
are a separate set with separate rules. They live in `docs/contributing/`, they are written for
people and agents working *on* Unpoly rather than with it, and they are never published.

They are rendered by **GitHub**, not by our own parser, so none of the conventions above apply:
no `@` directives, no autolinking of `up.*` symbols, no partials, and no custom `{#anchor}` on a
heading — GitHub generates its own slug and prints the braces verbatim. Link to a section with
that generated slug (`testing.md#how-specs-are-organized`), and to code with an ordinary relative
path. Admonitions use GitHub's spelling — `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`,
`> [!WARNING]`, `> [!CAUTION]` — rather than the `> [important]` form used above.

Long guides carry a table of contents below their intro, between `<!-- toc -->` markers. It is
generated: run `bin/update-contributing-tocs` after adding, renaming or reordering a heading.
`bin/self-test` fails if a TOC is stale, if a guide long enough to need one lacks it, or if a
link between these files points at a heading that no longer exists — and names the command.

> [!IMPORTANT]
> These guides describe the tooling and the layout of this repository, so they go stale in a way
> published documentation cannot. Renaming a `bin/` script, moving a directory, changing what a
> command prints or adding a spec convention all mean editing a guide in the same commit. The
> [overview in `CONTRIBUTING.md`](../../CONTRIBUTING.md) summarizes each guide, so a summary may
> need the same edit.


## Modules and classes

You'll rarely add one of these, but every file with doc comments depends on one.

A module or class block gives a [main module](code-organization.md#responsibilities) its
own page and title:

```js
/*-
Forms
=====

The `up.form` module helps you work with non-trivial forms.

@see submitting-forms
@see [up-submit]

@module up.form
*/
```

Two things to know:

- **Every file that documents features must declare its own `@module` (or `@class`)
  first.** Features attach to the most recently parsed interface, so a file without one
  would file its features under whichever module happened to be parsed before it.
  `src/unpoly-migrate/form.js` opens with `@module up.form` for exactly this reason;
  repeated declarations of the same module are merged.
- **`@see` sorts itself by what it points at.** A `@page` target is listed under
  *Guides*, a feature target under *Essential features*. On a feature, `@see` renders a
  plain "See also" list — though a Markdown link in the prose is the more common way to
  do that.

`@class` blocks also use `@parent` to nest under a module in the menu, e.g.
`src/unpoly/classes/params.js` declares `@parent up.form`.


## Previewing your changes

Previewing is **optional**. Documentation has no automated tests, and a wrong directive
is a code-review fix rather than a blocker — so don't stall on it. Write the prose, make
your best attempt at the syntax, and flag anything you're unsure of in the pull request.

If you do want to see the output, check out
[`unpoly-site`](https://github.com/unpoly/unpoly-site) next to this repository.
[`bin/dev`](dev-environment.md#running-the-dev-environment) then boots it alongside the
build watcher and serves it at <http://localhost:4567>. It needs Ruby; see that
repository's README for setup.

Edits to existing pages appear on reload. A *new* page — a new API symbol or a new
guide page — only appears after restarting the dev environment.
