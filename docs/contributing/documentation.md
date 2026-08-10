# Documentation

## Referring to features

Because Unpoly has many similar-sounding APIs, the documentation uses consistent syntax to distinguish DOM elements, attributes, classes, JS functions and non-function values:

- E.g. "the element is assigned an `.up-loading` class" (think CSS)
- E.g. "set an `[up-target]` attribute" (think CSS)
- E.g. "this will update the `<main>` element" (deviating from CSS here)
- E.g. "Call the `up.render()` function" (functions are referred to with parentheses)
- E.g. "Configure the `up.form.config.watchInputDelay` property" (no parentheses for non-function values)

## More sections (must be split)

> **TODO:** This guide is still an outline. The notes below are the intended scope,
> not finished prose.

- Large API surface, good docs are paramount
- Documentation is parsed and served by sibling project (../unpoly-site)
  - This is a Middleman site (static site generator, Ruby based)
    - This also parses our JSDoc extension
    - Ensure unpoly-site has a good README (install Ruby, bundle install) and link to that
  - If exists, dev environment will boot it and serve on http://localhost:4567
  - Changes in underlying code, will be picked up after reload
  - Restart dev env if you add new pages rather than updating existing ones (new API, new doc pages)
- Most API references is defined over the code that defines it
  - All APIs get a top-level doc site path with their slug-ified name, e.g.
    - `@function up.render` => `/up.render`
    - `@selector .up-current` => `/up-current`
  - Explain doc comment delimiters: /*- ... */
  - These are technical references, not a tutorial. See guide pages for that.
  - Explain JSDoc superset
    - We extended JSDoc to also document headers, selectors, events
    - Features with many params can be grouped into sections, only relevant for documentation display
    - Types losely inspired by TypeScript, but no formal syntax
    - Example with options
  - If a function/listener/etc. defines multiple API symbols in one go, the main API is documented ABOVE the code and all the side effect APIs are documented BELOW the code
    - Example: A function up.fn() emits two events up:foo, and up:bar, then the code order is
      1. docs for up.fn()
      2. impl for up.fn()
      3. docs for up:foo
      4. docs for up:bar
- Magic comments in code blocks (syntax_highlighting.js)
  - Use comment syntax of respective language
  - Highlight line (`// mark-line`)
  - Highlight phrase in line (`// mark: up-target`)
  - Block Caption (`// label: Bad example`)
  - Chip (`// chip: Content goes here`)
  - Return (`// result: [1, 2, 3]`)
- Explain `src/unpoly/pages/` ("guide pages")
  - Overarching holistic guides, each covering one topic, tying all the API parts together, driven by developer view
  - These should have the best docs and examples
  - Selectors, functions, etc. should be technical references where devs can look up 
    - These usually link to a "main article" (== holistic page): `[Opening overlays](/opening-overlays){:.article-ref}`
  - Each page gets a top-level path in the doc site, e.g. `@page opening-overlays` => `/opening-overlays`
- Keeping docs DRY
  - This is a challenge. We naturally have a lot of repeating information. Repetition is a feature for the reader, but keeping all that information consistently maintained is brutal.
- Explain pages/params
- Explain pages/partials
  - Small re-usable Markdown snippets
  - e.g. the guide pages and technical references share paragraphs or tables
  - Can be included with @include
- Explain @mix, 
- Visibilities
  - Only experimental, deprecated, stable are shown
  - Params can have their own visibilities
