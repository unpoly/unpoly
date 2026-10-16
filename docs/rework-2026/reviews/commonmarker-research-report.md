# commonmarker migration: phase 1 report (2026-10-16)

> Notes from the research worktrees (since removed). The commit hashes below are from the research
> branches; the merged commits are unpoly 3faf8cdc3..4aa0d8d2c and unpoly-site 5b584eac..526ecfec.

## Setup

- Worktrees on branch `commonmarker-research`:
  - `/home/henning/Projects/cm-research/unpoly` (from `docs-rework` @ 00b9dd0ca)
  - `/home/henning/Projects/cm-research/unpoly-site` (from `docs-rework` @ 15f84e74)
- `vendor/unpoly-local` in the site worktree points to `/home/henning/Projects/cm-research/unpoly`
  (uncommitted change to the tracked symlink).
- The worktree's `dist/` only has 4 tracked files, so the main checkout's built `dist/` was copied
  into the unpoly worktree (ignored files, nothing in the main checkout changed).
- Builds: `SKIP_SEARCH_INDEX=1 SKIP_SKILL=1 bundle exec middleman build` in the site worktree.
  - kramdown baseline: `build-kramdown/` (1m53s, "All links OK", 718 HTML files)
  - commonmarker: `build-commonmarker/` (2m10s incl. link check; build complete, link check failed, see below)
- Local commits only, nothing pushed:
  - unpoly `8b936874b` [docs] Research: drop kramdown-only syntax for commonmarker
  - unpoly-site `fa62b0bf` Research: render Markdown with commonmarker

## Implementation

- `lib/unpoly/site/commonmark.rb` (new): `Commonmark.render(markdown)` returns a Nokogiri fragment.
  - Options: GFM table/strikethrough/autolink; `unsafe: true`; `smart: false`; `hardbreaks: false`;
    `header_ids: nil`. Also had to turn off commonmarker 2.x defaults that kramdown never had:
    `github_pre_lang: false` (else `<pre lang="js">`), `escaped_char_spans: false`, `tagfilter: false`,
    `tasklist: false`, `shortcodes: false` (emoji `:name:`), and `plugins: { syntax_highlighter: nil }`
    (syntect highlighting is on by default).
  - Heading attributes: a preprocessor strips `{#id …}` from ATX and setext heading lines (skipping
    fenced code) and records them by line number. Rendering uses `sourcepos: true`; the postprocess
    matches `h1–h6[data-sourcepos]` by end line, assigns the attributes, and then drops all
    `data-sourcepos`. This tells Markdown headings from raw-HTML headings, which kramdown also never
    gave auto ids. Headings without an id get kramdown-parser-gfm's `generate_gfm_header_id` (ported,
    including the per-document `-1`, `-2` counter).
  - The suffix has to start with `#id`, so literal braces in heading text stay as they are.
    Pandoc also allows `{.class key=val}` without an id. This restriction is up for discussion.
- `markdown_renderer.rb`: `Kramdown::Document` replaced by `Commonmark.render`. `postprocess_html` now
  receives the Nokogiri fragment directly.
- `heading.rb` (`Heading.parse`, which builds the heading index used for anchors) also called kramdown
  and would not understand the Pandoc suffix, so it was switched to `Commonmark.render` too.
- `bundle add commonmarker` → 2.10.0. **Note:** the lockfile's `PLATFORMS` changed from `ruby` to
  `x86_64-linux` (precompiled gem). Deploy/CI hosts may need `bundle lock --add-platform …`. The
  `ruby` platform build of commonmarker needs a Rust toolchain.
- unpoly sources: the 3 `{:data-toc-include="true"}` lines were moved onto their headings as
  `{#… data-toc-include}`, `{:#how-cache-entries-are-matched}` was deleted, and `markdown="1"` was removed
  from all 18 `<figcaption>`s (each is already followed by a blank line).

## Numbers

Normalized with Nokogiri (sorted attributes and classes, collapsed whitespace outside `<pre>`, asset
hashes stripped, comments dropped). Markdown twins were compared line by line.
Scripts: `/home/henning/Projects/cm-research/normalize.rb` and `classify.rb`. Raw grouping output:
`classify-output.txt`. Normalized trees: `norm-k/` and `norm-c/`.

| | identical | differing |
|---|---|---|
| HTML pages | 835 | 27 |
| Markdown twins | 829 | 11 |

Outside the changelogs, only 9 HTML pages differ: caching, customizing-overlays,
reactive-server-forms, skill, subinteractions, test.markdown, up-back, up-validate, up.watch, and
watch-options. No Learn page or API page has list, heading-id or HTML-block regressions. **No
auto-generated heading id changed.**

## Difference groups (ranked by hunk count)

(The script misfiled a few hunks. The counts below are corrected by hand.)

### 1. Lists: loose vs. tight (about 60 hunks, 12 changelog pages only): trivial to moderate
In kramdown, only items followed by a blank line get a `<p>`. In CommonMark, one blank line between
items makes the whole list loose, so every item gets a `<p>`. All cases are in old changelog
release notes (`docs/changes/CHANGELOG_*.md`, CHANGELOG.md).
- changes/0.12.0: `<li>❌ Remove <code>up.slot</code>…` → `<li><p>❌ Remove …</p>`
- changes/3.1.1, 3.5.0: `<li>Using the deprecated <a>up.$compiler()</a> now logs…` → `<li><p>…`
Fix: accept it (a visual difference in `li` spacing only), or tighten the source lists. The CSS
may already handle `li > p`.

### 2. Typography: `...` no longer becomes `…` (14 hunks, 2 pages + twins): trivial
kramdown's typographic symbols were on, separately from `smart_quotes`. Only `...` occurs in the
diff. No `--`/`---`/`<<` conversions were found.
- up-back: `This link …` → `This link ...`; `… will be transformed to:` → `... will be transformed to:`
- changes/0.12.0: `Instead of the old …` → `Instead of the old ...`
Fix: type `…` in the source (4 spots), or accept.

### 3. Leftover `{:width='…'}` image IAL (3 images, changes/3.5.0 and 3.12.0 + twins): trivial
The plan expected none to remain, but the CHANGELOG still has 3. They now render literally after the
`<img>`, and the image loses its width.
- changes/3.5.0: `<img … src="/images/api/flashes.png" width="480">` → `<img …>{:width='480'}`
Fix: convert them to `<img width>` in CHANGELOG.md.

### 4. Tables (3 kinds, 4 pages): trivial
- **Headerless table** (changes/0.60.0, "New DOM helpers" in `docs/changes/CHANGELOG_0.x.md:163`):
  kramdown accepts a table without a header row. GFM does not, so it renders as a paragraph of `| … |`.
  Fix: add a header row in the source.
- **Alignment** (customizing-overlays): `<th style="text-align: right">` → `<th align="right">`.
  The rendering is equivalent. Restore `style` in the postprocess if the CSS cares.
- **Empty cells** (reactive-server-forms, watch-options + twins): kramdown filled empty cells with
  `&nbsp;`; commonmarker leaves them empty. Harmless.

### 5. Misindented code fences (2 pages + twins: up-validate, up.watch): trivial
In `src/unpoly/form.js` (around lines 829 and 1973), the opening fence is indented 2 spaces more
than the code. CommonMark strips the fence's indentation from each content line, so the first
indentation level is lost (`  <fieldset>` → `<fieldset>`). kramdown ignored the fence indentation.
These are source typos. Fix the fence indentation.

### 6. Unbalanced backticks (3 pages): trivial
These are source typos that kramdown happened to tolerate:
- changes/1.0.0: ``[`up.util.escapeHTML()`]`` followed by a stray `` ` ``. kramdown linked it;
  commonmarker renders the literal `` `up.util.escapeHTML()`` ``.
- changes/0.6.5: ``(as happens with `.click()``)`` → literal backticks.
Fix: correct the sources.

### 7. Fenced code inside a list item (changes/3.0.0): an improvement
kramdown rendered a ```` ```js ```` block inside a list item as one paragraph of run-on text.
commonmarker renders a proper `<pre><code class="language-js">`. Nothing to fix.

### 8. Raw HTML on its own line (2 pages): trivial / judgement call
- changes/3.11.0: a lone `<img …>` line was wrapped in `<p>` by kramdown. CommonMark makes it an
  HTML block without `<p>`. Harmless.
- changes/3.10.0: a `<video …></video>` line stays inline in CommonMark (`<p><video></p>`). The
  video-player postprocess then wraps it in a `<div>` inside the `<p>`, which leaves an empty `<p></p>`
  before the player. Fix: put such videos in a `<figure>`, or unwrap a `<p>` that only contains a video
  in the postprocess.

### 9. Intended changes (3 pages)
- subinteractions: `data-toc-include="true"` → `data-toc-include=""`. The TOC output is identical.
- caching: `<p id="how-cache-entries-are-matched">` is gone (the block IAL was deleted as planned).
- test.markdown: the site's own fixture `spec/fixtures/parser/markdown.md` still has
  `<figcaption markdown="1">`, and the attribute now passes through. Update the fixture.

### 10. Emphasis inside a word (skill page): trivial
`[[[=base_url]]/up.render**.md**](…)`: per the CommonMark flanking rules, `**` after `render` and
before `.` does not open emphasis, so the `**` stays literal. Fix: rewrite the source (e.g. `<strong>`).

## Link check (commonmarker build)

1 broken link, and it is caused by the planned change, not by the renderer:
- `changes/3.8.0` links to `/caching#how-cache-entries-are-matched`, the anchor of the deleted block IAL.
  Point that link to `/optimizing-responses#cache-matching`, or keep an anchor.

No auto-id anchors broke.

## Specs

`bundle exec rspec spec/lib`: 294 examples, 1 failure. The failure is
`markdown_renderer_spec.rb:161`, which tests `figcaption markdown="1"` and is expected to fail;
the spec needs rewriting. The skill and search specs were not run (out of scope for phase 1).

## Blockers

None. Every group can be fixed with small source edits or one small postprocess tweak. The
risks the plan named (nested lists, HTML blocks with blank lines, auto ids) did not show up outside
the old changelogs. The open items are the Gemfile.lock platform change, which needs a decision for
deploy/CI, and whether the heading-suffix syntax should also accept attributes without an `#id`.

---

# Phase 2 (2026-10-16)

## Commits (local only, on `commonmarker-research`)

unpoly-site:
- `fa62b0bf` Research: render Markdown with commonmarker (phase 1)
- `04860b66` Research: accept heading attributes without an id, spec heading attributes and figcaptions
- `242b6bdf` Research: remove kramdown-parser-gfm, lock the ruby platform alongside x86_64-linux
- `a288119d` Research: don't leave a paragraph around a video on a line of its own

unpoly:
- `8b936874b` [docs] Research: drop kramdown-only syntax for commonmarker (phase 1)
- `0863f1615` [docs] Fix Markdown that only kramdown rendered as intended
- `0b9c4cff2` [docs] Document the commonmarker Markdown flavor and Pandoc heading attributes
- `db15bda9e` [docs] Give the up.Params table in the 0.60.0 release notes a header row

## What changed
- Heading attributes: `{data-toc-include}` with no `#id` is accepted, and the id is then generated.
  The braces must hug the tokens (`#id`, `.class`, `key`, `key=value`, `key="value"`). `{ target }`
  and `{foo: 1}` stay text. Specs for both forms, setext headings, fenced code, raw-HTML headings and
  duplicate auto ids are in `markdown_renderer_spec.rb` and `heading_spec.rb`.
- A `<video>` alone in a paragraph is unwrapped in the postprocess. This matches kramdown and
  avoids the empty `<p>`.
- Source fixes: three fence openers in `form.js`, two unbalanced backticks (CHANGELOG 0.x/1.x),
  two header-less tables in CHANGELOG_0.x (both got a `Function | Description` header), three
  `{:width}` images converted to `<img width>`, `<strong>` in the skill.md link label, `…` typed in
  `up-back` (history.js), and the 3.8.0 link now goes to `/optimizing-responses#cache-matching`.
- documentation.md: a new "Markdown flavor" section (commonmarker/CommonMark+GFM and its gotchas),
  heading attributes in Pandoc syntax, figures without `markdown="1"`, and the TOC example. **Also
  corrected "Line breaks":** it claimed single newlines render as line breaks. Neither kramdown (with
  `hard_wrap: false`) nor commonmarker does that; a newline renders as a space.
- `kramdown-parser-gfm` was removed from the Gemfile. `kramdown` stays in the lockfile as a
  transitive dependency of `middleman-core`, but nothing of ours requires it.

## Remaining differences (all accepted)
840/862 HTML pages and 832/840 twins are identical. The rest:
1. **Loose lists in old release notes** (12 changelog pages). Every affected list mixes items
   that have several blocks (paragraphs, code) with one-line items. kramdown wrapped only the
   multi-block items in `<p>`. CommonMark makes the whole list loose, and it has no way to express
   mixed lists, so no source edit can reproduce the old HTML. The effect is a bit more space between
   items in historical release notes. No current guide or API page is affected.
2. **`...` vs `…` in changes/0.12.0** (historical). The current docs page (up-back) was fixed in the source.
3. **Lone `<img>` lines are no longer wrapped in `<p>`** (changes 3.5.0, 3.11.0, 3.12.0). This looks
   the same: `.picture` is `display: block` with a `$space-4` margin, which collapses with the
   `p` margin (`$space-3`) anyway.
4. **Table alignment** (customizing-overlays): `align="right"` instead of `style="text-align: right"`.
   This looks the same: prose.sass already has `td, th { &[align=right] { text-align: right } }`, and
   it beats `th { text-align: left }`. The sources only use right alignment.
5. **Empty table cells** (reactive-server-forms, watch-options + twins): kramdown wrote `&nbsp;`,
   now they are empty. Same height, because the rows have text.
6. **Intended:** table header rows (0.60.0 + twin), corrected backtick output (0.6.5, 1.0.0 +
   twins), the 3.8.0 link, `data-toc-include=""` (TOC unchanged), the caching anchor removal, and a
   code block in a list item that commonmarker renders properly (3.0.0 + twin; kramdown rendered it
   as run-on text).

## Specs and checks
- Link check: **All links OK** (718 files).
- Full `bundle exec rspec` (feature specs included; Capybara serves the app in-process on a random
  port): **634 examples, 4 failures**. All 4 are in `spec/build` (3× `search_ranking_spec.rb`,
  1× `skill_search_spec.rb`, query "preserve element across updates"). **They fail the same way on
  the kramdown baseline** (docs-rework @ 15f84e74 + unpoly 00b9dd0ca, full build with index and
  skill), so they come before this migration and are unrelated to it. `rake skill:test` shows the
  same single failure.
- The Markdown twins, figures, embeds, TOC, changes and search feature specs pass.

## CI
- `.github/workflows/test.yml` runs on `ubuntu-22.04` (x86_64, glibc 2.35), Ruby from
  `.ruby-version` (3.4.4) via `ruby/setup-ruby` with `bundler-cache: true`.
- The lockfile now lists `PLATFORMS ruby` and `x86_64-linux`. Bundler on x86_64 Linux installs the
  precompiled `commonmarker-2.10.0-x86_64-linux` (checked locally: the loaded platform is
  `x86_64-linux`). The `ruby` variant (with `rb_sys`) is only used on platforms that aren't
  listed. **Not verified on GitHub itself**, since pushing wasn't allowed.
- Developers on macOS/ARM: on an unfrozen `bundle install`, Bundler adds their platform and picks
  the native gem. If the lockfile is frozen there, they'd compile with Rust. Consider adding
  `arm64-darwin` and `aarch64-linux` (devcontainer on Apple Silicon) with `bundle lock --add-platform`.
- **Important:** CI checks out `unpoly/unpoly` at its default branch, not a matching branch. The
  site's specs and build therefore see the unpoly sources of `master`.

## What a merge needs
1. Both research branches belong together. The site renderer needs the unpoly source changes:
   without them, `{:data-toc-include="true"}` lines and `markdown="1"` render literally, and the
   3.8.0 link breaks. The unpoly changes, in turn, render wrongly with kramdown (Pandoc suffixes
   with attributes, and figcaptions without `markdown="1"` would no longer be parsed as Markdown).
2. Order: merge the unpoly branch into docs-rework and the site branch into the site's docs-rework
   at the same time, and release them together. Since site CI checks out unpoly's default branch,
   site CI will only reflect this once the unpoly change has reached that branch. Before that, CI
   would test the new renderer against old sources.
3. Before merging: drop the "Research:" prefixes and reword the site commits, and make sure the
   `vendor/unpoly-local` symlink change (uncommitted, worktree-only) is not committed.
4. Also update the plan doc (`docs/rework-2026/commonmarker-migration-plan.md`) and the open-items
   entry once accepted.
