# Migrating the docs site from kramdown to commonmarker

Status: **done 2026-10-16** (decision 12B). unpoly 3faf8cdc3..4aa0d8d2c, unpoly-site 5b584eac..526ecfec.
Research and diff results: [reviews/commonmarker-research-report.md](reviews/commonmarker-research-report.md).

Summary of what was decided and built:

- Headings take Pandoc-style attributes on the heading line: `{#id data-toc-include}`, and also
  without an id (`{data-toc-include}`, the id is then generated). Braces that don't form an attribute
  list stay heading text. Attributes are matched to rendered headings by commonmarker's source positions.
- Headings without `#id` get kramdown's GFM id algorithm (ported), so no existing anchor changed.
- commonmarker runs with `unsafe`, no smart punctuation, no hard breaks, no header ids, no syntax
  highlighting, no shortcodes or tag filter; code blocks keep `<pre><code class="language-…">`.
- Doc source fixes for Markdown that only kramdown rendered as intended (fence indentation,
  unbalanced backticks, header-less tables, `{:width}`); `markdown="1"` removed from figcaptions.
- A `<video>` alone on a line is unwrapped from its paragraph (as kramdown did).
- Accepted differences: loose lists in old release notes (CommonMark has no mixed tight/loose lists),
  `...` in 0.12.0 notes, lone `<img>` lines without `<p>`, `align="right"` in table cells (styled
  already), empty table cells without `&nbsp;`.
- `kramdown-parser-gfm` removed; `kramdown` remains only as a dependency of middleman-core. The
  lockfile lists `ruby` and `x86_64-linux` so CI gets the precompiled gem.

The original plan follows.
Repos: `unpoly-site` (renderer, specs), `unpoly` (doc sources).


## Goal

Render all documentation Markdown (Learn pages in `src/unpoly/pages`, doc comments in
`src/unpoly/**/*.js`) with [commonmarker](https://github.com/gjtorikian/commonmarker)
(Ruby wrapper for the comrak CommonMark/GFM parser) instead of kramdown.

Why:

- CommonMark/GFM is the established flavor. Authors, agents and editors know its rules.
- Markdown inside HTML blocks works without kramdown's `markdown="1"` attribute: a blank line
  after the opening tag is enough (e.g. inside `<figcaption>`).
- Fewer kramdown-only constructs to explain in `docs/contributing/documentation.md`.


## Inventory of kramdown-specific syntax (2026-10-16)

| Construct | Uses | Plan |
|---|---|---|
| `{#id}` after a heading | ~503 | Our own preprocessing (see below) |
| `{:data-toc-include="true"}` on the line below a heading | 3 (subinteractions.md) | Move onto the heading line: `{#id data-toc-include}` |
| `{:width='…'}` after an image | 12 | Gone after the `<figure>` change (images become `<img width>`); verify none remain |
| `{:#how-cache-entries-are-matched}` block IAL (caching.md) | 1 | Delete (anchor shims are no longer kept) |
| `markdown="1"` | introduced by the `<figure>` change | Remove; rely on CommonMark HTML-block rules |
| Trailing `\` line breaks | ~41 | Supported by CommonMark, nothing to do |
| `{::…}` extensions, definition lists, footnotes, abbreviations | 0 | — |

Our own preprocessing already runs before the parser and is parser-independent:
admonitions (`> [tip]`), wikilinks (`[[slug]]`, `[[more: slug]]`), `@include` partials,
`[[=version]]` tokens, mark comments in code blocks.


## Heading attributes (decided: Pandoc syntax)

Headings carry their attributes on the heading line, in [Pandoc's syntax](https://pandoc.org/MANUAL.html#heading-identifiers):

```markdown
### Closing when a location is reached {#location-condition data-toc-include}
```

- `#name` sets the `id`.
- `key=value` or `key="value"` sets an attribute; a bare `key` sets a boolean attribute.
- Only headings get attribute syntax. Other elements use HTML when they need attributes.

Implementation: a preprocessor strips the `{…}` suffix from ATX and setext heading lines and
records the attributes in order; the existing Nokogiri postprocess (`markdown_renderer.rb`)
assigns them to the rendered headings in document order. The TOC (`toc_inserter.rb`) only checks
`heading.key?('data-toc-include')`, so a bare attribute works unchanged. Update the comment at
`toc_inserter.rb:133-134` and the syntax docs in `documentation.md`.


## Renderer settings

- Parse and render with GFM extensions: tables, strikethrough, autolinks, task lists if used.
- `render: { unsafe: true }` so raw HTML (`<figure>`, `<video>`, `<img>`, `<a id>`) passes through.
  The sources are ours.
- No smart punctuation (kramdown runs with straight quotes today).
- Hard breaks off (kramdown `hard_wrap: false`).
- Header ids: don't let commonmarker generate them. Generate ids for headings without `{#…}`
  ourselves with kramdown's algorithm, so auto-generated anchors (e.g.
  `/render-lifecycle#changing-options-before-rendering`) keep their values. Check whether any
  inbound links rely on auto ids; the link check finds them.
- Syntax highlighting and mark comments stay in our postprocess (check what kramdown currently
  emits for fenced code: classes like `language-js`, wrapping `<div>`; match it or adapt the CSS).


## Regression harness

1. Build the site with kramdown: `SKIP_SEARCH_INDEX=1 SKIP_SKILL=1 bundle exec middleman build --no-clean`,
   copy `build/` to a scratch folder. Never touch the server on port 4567.
2. Switch the renderer and build again.
3. For every HTML page and every Markdown twin, normalize (Nokogiri: sort attributes, collapse
   whitespace, drop build timestamps/asset hashes) and diff. Group differences by kind
   (lists, code blocks, HTML blocks, headings, entities, quotes).
4. Fix or justify every group. Expected justified differences: whitespace, attribute order,
   entity encoding.
5. Link check ("All links OK"), `bundle exec rspec spec/lib`, Markdown twin and search specs,
   skill ranking test must pass.


## Steps

1. Branch in `unpoly-site`. Add the `commonmarker` gem (ask before adding the dependency).
2. Implement heading attribute preprocessing + id assignment, with specs.
3. Swap `Kramdown::Document` in `markdown_renderer.rb` for commonmarker with the settings above.
4. In `unpoly`: move the 3 `data-toc-include` lines onto their headings, delete the block IAL,
   remove `markdown="1"` from all `<figcaption>`s, convert any remaining `{:width}`.
5. Run the harness, fix differences.
6. Update `docs/contributing/documentation.md` (heading attributes, HTML blocks, figures).
7. Remove the kramdown gems.


## Risks

- Subtle rendering differences across ~700 pages (nested lists, code blocks in lists, HTML blocks
  without a following blank line). The harness exists for this.
- HTML blocks: CommonMark ends an HTML block at the first blank line. Sources that put a blank line
  inside raw HTML (e.g. inside a `<table>`) would switch back to Markdown there. The diff shows it.
- Auto-generated heading ids that differ between algorithms. Mitigated by keeping kramdown's algorithm.
