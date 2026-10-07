# Markdown representation of Learn and API: research report

Research hand-off, 2026-10-07. I changed nothing in any repo. I ran one `middleman build --no-clean`
(SKIP_CHECK_LINKS/SKIP_SEARCH_INDEX, so `build/pagefind` survived). The :4567 preview kept running throughout.
All prototypes are in the scratchpad (`proto/`, `mmtest/`, `skillproto/`, `bundle-sample/`).

Paths: `site/` = `/home/henning/Projects/unpoly-site`, `unpoly/` = `/home/henning/Projects/unpoly`,
`cards/` = `/home/henning/Projects/makandra-cards`, `M/` = the middleman-core-4.6.1 gem.

---

## 0. Executive summary

- **Recommendation: approach X1, "one converter, Middleman resources".**
  - Register a `.md` proxy resource next to every documentation page. Its template, about 5 lines with a non-Tilt extension (`.txt.erb`), renders the sibling HTML page with `layout: false` and pipes it through a single Nokogiri converter (`Unpoly::Guide::MarkdownExport`).
  - No template logic is written twice. The preview serves `.md` URLs. The converter is the only new knowledge, and it is spec'd against the parser fixtures.
  - The main risk is CSS-class coupling to the templates. A build-time "leftovers" check makes that coupling fail loudly.
  - Optional optimization: approach A (after_build over the built HTML) with the same converter, if the roughly 45 s of extra build time matters.
- **The prototype works on the real site:**
  - All 626 documentation pages convert in **2.6 s** from built HTML, 1.3 MB of Markdown in total (median page 975 B, largest `/up.render` 29 KB).
  - Middleman behaviour around `.md` destinations, MIME type and templates is verified in a scratch app.
- **Access paths:**
  - `.md` suffix: no friction with directory_indexes, verified.
  - MD button: trivial.
  - Accept negotiation: about 6 lines of `.htaccess`. Claude Code and Cursor send `text/markdown`; Codex, Gemini CLI and Copilot do not. So the `.md` URL is the primary path and negotiation is the bonus.
- **Links:**
  - Served `.md`: absolute `https://unpoly.com/<path>.md` (Stripe style). This costs about 8% of bytes.
  - Skill: relative file paths, rewritten at skill-build time.
- **Landing page:** exclude it. Generate an index (`/llms.txt`, the same text as SKILL.md's top-level index) from the Toc model instead. No one-off copy is duplicated.
- **Skill:** the cards Bundle's `search.py` adapts with about 30 changed lines, and its 23 tests still pass.
  - It needs an **identifier-aware tokenizer and a `name` boost**. The stock script misses exact API names.
  - Two filesystem hazards must be designed in:
    - **case-insensitive collisions**: `up.layer`/`up.Layer`, `up.request`/`up.Request`, `up.preview`/`up.Preview`
    - **`:` in 35 event filenames**, which is illegal on Windows. `$` in `up.$compiler` is hostile to the shell.

---

## 1. How pages render today (evidence)

### 1.1 Page inventory (from the guide model, `scratchpad/count.rb`)
- 113 interface pages with `guide_page?`: 86 `@page`, 18 modules, 9 classes. 4 of them are parser fixtures.
- 539 feature pages, 23 of them fixtures.
- Toc: Learn has 13 topics and 82 pages. API has 18 topics, 2 API pages and 1 generated topic index (`/formats`).
- Proxy registration is in `site/config.rb`:
  - interfaces: 119-124 → `/api/interface_template.html`
  - features: 126-131 → `/api/feature_template.html`
  - topic indexes: 134-139 → `/api/topic_index_template.html`
- Hubs: `site/source/learn/index.html.erb` and `site/source/api/index.html.erb` both render `site/source/_area_hub.html.erb` (1-37) from `guide.toc`.
- **"Is documentation" predicate already exists:**
  - `search_documentable` (`site/config.rb:302-304`) excludes fixtures and non-documentation pages.
  - The layout emits `data-pagefind-body` only for those pages (`site/source/layouts/guide.erb:83`, via `search_body_attrs` at `config.rb:306-313`).
  - In the built HTML this marker selects exactly the 626 doc pages and skips the 36 non-doc and fixture pages. The hubs `/learn`, `/api` and `/formats` carry no marker (verified), so they need explicit inclusion.

### 1.2 The transform pipeline: every step the `.md` output must contain in resolved form

| # | Transform | Where | Resolved in rendered HTML? |
|---|---|---|---|
| 1 | `@include` partial expansion (with indent) | `site/lib/unpoly/guide/parser.rb:728-740` | yes |
| 2 | CoffeeScript `\#\#` headline unescape | `parser.rb:742-748` | yes |
| 3 | Dynamic tokens `[[=version]]`, `[[=npm_tag]]`, `[[=size FILE]]` | `dynamic_tokens.rb:51-65`, called at `parser.rb:671` | yes |
| 4 | Directives → structured model (`@param`/`@section`/`@mix`/`@like` mimic/`@return`/`@see`/`@learn-ref`/`@signature`/`@title`/`@menu-title`/visibility/`@params-note`) | `parser.rb:302-390, 392-640, 666-726` | yes, laid out by the templates |
| 5 | Wikilinks `[[slug#anchor]]` → Markdown link with derived label | `wikilink.rb:131-140`, `markdown_renderer.rb:80-85` | yes |
| 6 | Kramdown GFM, smart quotes | `markdown_renderer.rb:43-56` | yes |
| 7 | `strip_links` (summaries in previews and hubs) | `markdown_renderer.rb:90-94` | yes |
| 8 | Autolink code spans to API pages (`code_to_location`) | `markdown_renderer.rb:237-253` | yes |
| 9 | `img` picture classes, video-player wrapper | `markdown_renderer.rb:104-121` | yes (presentational, converter ignores) |
| 10 | `images/…` → `/images/api/…` | `markdown_renderer.rb:74-76, 123-127` | yes |
| 11 | Heading normalisation (min h2, max h4) | `markdown_renderer.rb:149-151, 204-216` | yes |
| 12 | Admonitions `> [tip]` → `blockquote.admonition` | `markdown_renderer.rb:163-167, 285-314` | yes |
| 13 | Embeds `<div embed="…">` → site partial (today only `fragment-updates-diagram`) | `embeds.rb:33-47`, `config.rb:282` | yes (SVG with `<title>`/`<desc>`) |
| 14 | Learn-refs inserted in the intro slot | `intro_inserter.rb:10-23`, `config.rb:283, 287-292` | yes |
| 15 | Auto TOC (in-text copy plus rail copy) | `config.rb:212-218`, `toc_inserter.rb` | yes (converter drops it) |
| 16 | Param types linked and split into spans | `config.rb:490-513` | yes (spans have no separator; CSS draws it) |
| 17 | `breakable_signature` (`<wbr>`, glue spans) | `config.rb:444-452` | yes (text extraction is clean) |
| 18 | **Code magic comments** `mark:` (308 uses), `mark-line` (61), `result:` (100), `chip:` (29), `label:` (9) | **client side**: `site/source/javascripts/components/syntax_highlighting.js:43-80` | **no**: the comments are still in the HTML, so the converter must handle them |

Source-syntax facts that make "serve the raw sources" unworkable (this confirms the maintainer's view):
- Admonitions are written `> [tip]`, `> [note]`, `> [important]` (lowercase, no `!`; 74 of 99 uses). They are not GFM alerts.
- Wikilinks, dynamic tokens, `@include`, all directives, `<div embed>`, and magic comments are also not GFM.

### 1.3 Template logic volume (what approach B2 would have to move)
- `feature_template.html.erb` is 210 lines with about 60 lines of decisions:
  - params heading and anchor (8-22)
  - visibility notice and migrate note (40-58)
  - titled param sections (75-77)
  - param experimental, optional and required flags (126, 133-135)
  - param references (155-158)
  - response (179-205)
- `interface_template.html.erb` is 87 lines: essentials and all features (35-74), the children index only on a chapter overview (81-85), reading nav (87).
- Partials: `_area_hub` (37 lines), `topic_index_template` (20), `_see_also` (10), `_learn_refs` (6), `_children_index` (18), `_reading_nav` (30), `_feature_preview` (16).

---

## 2. Middleman specifics (verified)

| Question | Answer | Evidence |
|---|---|---|
| Does directory_indexes touch `.md` files? | **No.** It only rewrites `.htm .html .php .xhtml`. `proxy '/foo.md'` builds to `build/foo.md` next to `build/foo/index.html`. | `M/extensions/directory_indexes.rb:14-20`; scratch app `mmtest/`: built `build/foo.md` and `build/foo/index.html` |
| Can a template be `x.md.erb`? | **No.** `.md` is a Tilt (Kramdown) extension. Middleman strips it (`step_through_extensions`) and would render ERB, then Kramdown→HTML. Proxying to `api/tpl.md` fails with "proxies to unknown file … `api/tpl_kramdown`". **Use a non-Tilt extension such as `markdown.txt.erb`.** | `M/util/files.rb:58-72`, `M/template_renderer.rb:174-191`; reproduced in `mmtest/` |
| Layout on `.md` resources? | None by default: only extensions in `extensions_with_layout` get one. | `M/sitemap/resource.rb:150-151`; `mmtest/build/foo.md` has no layout |
| Content type in `middleman server`? | Rack doesn't know `.md` (it returned `application/octet-stream`). Adding `mime_type :md, 'text/markdown; charset=utf-8'` to config.rb makes the preview send `Content-Type: text/markdown; charset=utf-8`. A per-proxy `content_type:` option also works. | `M/config_context.rb:57-60`, `M/sitemap/resource.rb:196-198`, `M/rack.rb:109`; curl against the scratch server |
| Can a `.md` resource render its HTML sibling? | **Yes.** `sitemap.find_resource_by_destination_path('up.render/index.html').render(layout: false)` returns the template output without `guide.erb` (101 KB versus 108 KB with layout). Locals (`feature_id`) come along. | `M/sitemap/resource.rb:142-155`; `scratchpad/boot.rb`, `proto/run.rb` |
| What can after_build access? | **Everything.** It runs in-process, `instance_exec`'d on the ConfigContext with the builder as its argument. `app`, `app.sitemap`, `config` and the helpers (`app.generic_template_context`) are all reachable. The maintainer's worry about a separate process does not apply. Precedent: Pagefind already post-processes the build in after_build (`config.rb:52-57`, `lib/unpoly/guide/pagefind.rb:5`). | `M/config_context.rb:8-22`, `M/callback_manager.rb:53-61`, `M/builder.rb:83`, `M/application.rb:57, 247` |
| Build parallelism | The builder renders resources in parallel processes (`Parallel.map`), sorted only by asset type. Nothing can rely on an `.html` render being cached for its `.md` twin. | `M/builder.rb:25, 120, 137-138` |
| Cost of re-rendering for B1 | Rendering all 652 doc proxies with `layout: false` plus conversion: **46.6 s serial**. The current full build is **39.6 s wall** (parallel). Conversion alone over built HTML: **2.6 s**. | `proto/timing.rb`, `/usr/bin/time` on the build |

---

## 3. Approaches compared

The criteria are (1) how effective the `.md` is for agents and (2) the burden of maintaining two representations.

| | A: after_build HTML→MD | B1: `.md` resources render HTML sibling → convert | B2: separate `.md` templates plus shared helpers | **X1: B1 + converter as lib (recommended)** | X2: B1 in dev, A in build | X3: raw sources |
|---|---|---|---|---|---|---|
| Agent effectiveness | Same converter output | Same | Potentially best: hand-tuned per page type | Same as A | Same | Poor: wikilinks, `[[=…]]`, `@include`, `> [tip]` and magic comments all unresolved |
| Second representation to maintain | Converter only (~250 lines) | Converter plus a 5-line template plus a proxy loop | **Every template twice**: feature, interface, hub, topic index, five partials (~400 lines), **plus** an MD-to-MD reimplementation of transforms 5, 8, 10-14 (est. 150-250 lines). New HTML features must be mirrored by hand. | Converter plus 5-line template plus proxy loop | Converter plus two 10-line glue points | none |
| Preview in `middleman server` | no | **yes** | yes | **yes** | yes | n/a |
| Build time | +~3 s | +~45 s serial (less in parallel) | +~10 s | +~45 s | +~3 s | 0 |
| Failure mode | A class rename breaks output silently | same | Drift between twins | same as A, plus a build-time leftover check | same | n/a |
| Asset-hashed image URLs | hashed (built) | unhashed | unhashed | unhashed | dev unhashed, build hashed | n/a |

**B2's real cost is hidden.** The maintainer's example (the `params_section_title` block) is the easy part. It moves into the model as `Feature#params_heading` and `#params_anchor`, about 15 lines. Two things make B2 expensive:
- The prose itself goes through HTML-only transforms: autolinking code in the Nokogiri DOM (`markdown_renderer.rb:237-253`), admonition regexes over rendered HTML (`:285-314`), heading normalisation in the DOM (`:204-216`), embeds spliced into HTML (`embeds.rb:40-47`) and learn-ref insertion via Nokogiri (`intro_inserter.rb:10-23`).
- An MD output would need a fence-aware MD-to-MD twin of each. The only existing one, `autolink_code_in_markdown` (`config.rb:222-234`), is naive: it does not skip fences or headings.

So B2 doubles the pipeline, not just the templates.

**Why X1 over A.** The two are tied on output and A is 40 s cheaper. X1 wins on preview: the maintainer's workflow is the preview server, and `.md` pages show up there like any page, so the button works in the preview too. The converter lives in `lib/unpoly/guide/` with unit specs, like Pagefind. If build time hurts, X2 adds an after_build fast path behind the same converter. That is about 10 lines and changes nothing in the output except hashed image URLs.

**X1 risks and mitigations**
1. **Coupling to CSS classes.** The converter knows about `feature--param*`, `types--type`, `documentable-preview*`, `essential-feature*`, `topic-preview*`, `learn-refs`, `children-index`, `minitoc--items`, `admonition*`, `notification` and `figure.diagram`. Across all 626 pages, 131 distinct `element.class` pairs appear inside the content region (`proto/all.rb` output).
   - Mitigation: a build check that fails when converted Markdown contains raw HTML outside code, or an un-whitelisted class inside the content region.
   - Mitigation: a spec over the parser fixtures (`spec/fixtures/parser`, rendered as `test.*` pages) that pins the Markdown.
   - I hit this risk myself: my first draft dropped `.minitoc` and lost the `## Parameters` heading, which lives inside it (`feature_template.html.erb:80-83`).
2. **Chrome agents want is pagefind-ignored.** Learn-refs, the children index and the breadcrumb are all `data-pagefind-ignore`, so `data-pagefind-ignore` cannot be the drop rule. The converter needs a small explicit drop list plus a keep list. Alternatively, templates gain a `data-md` hint, but that touches templates.
3. **Embeds.** The diagram's SVG `<text>` leaked as gibberish in the prototype. The converter must render `figure.diagram` as "Diagram: `<title>`. `<desc>`" from the SVG's `<title>`/`<desc>` (`_fragment_updates_diagram.html.erb:65-74`). Each future embed needs a text alternative, so the rule should be: every embed partial carries `<title>`/`<desc>` or `aria-label`.

### Prototype converter decisions (in `proto/html_to_md.rb`, ~230 lines)
- Front matter: `title`, `url` (canonical HTML), `kind`, `area`, `description`. The skill adds `name` and `names`.
- A subtitle line is drawn from the H1 (`_JavaScript function in [up.fragment](…)_`), replacing the breadcrumb and subtitle.
- Params become `#### \`[options.target]\`` followed by `_optional · type: \`string\` | \`Element\`_`. Agents can grep the name, and the search can weight it.
- Admonitions → GFM alerts `> [!TIP]`. The visibility notice → blockquote.
- Learn-refs → a "Learn more:" list. Children index → "## In this chapter". Previews and essentials → `- [\`sig\`](url) (kind[, visibility]): summary`.
- Dropped: edit link, both TOCs, minitoc items, reading nav, icons.
- Code: `mark:` and `mark-line` comments are stripped. `result:`, `chip:` and `label:` stay, because they carry meaning. A nicer `label:` handling would be a caption line above the fence.

---

## 4. Target artifact (prototype output, real data)

### 4.1 `/start/links.md` (complete)
```markdown
---
title: "Link to fragments"
url: "https://unpoly.com/start/links"
kind: "Page"
area: "Learn"
description: "Your first move with Unpoly is a link that updates a fragment, instead of loading a full new page."
---

# Link to fragments

Your first move with Unpoly is a link that updates a fragment, instead of loading a full new page.

## Following a link

Take any link in your app and add an [`[up-follow]`](https://unpoly.com/up-follow.md) attribute:

​```html
<a href="/preferences" up-follow>Preferences</a>
​```

Click it. Unpoly fetches `/preferences` in the background, and your server responds with a full HTML page, the same way it would for a regular page load. Unpoly extracts the response's [main element](https://unpoly.com/main.md) and swaps it into the current page. The URL and history are updated, and the Back button keeps working.

Your backend saw a normal request and rendered a normal page. Nothing on the server needs to change.

## Targeting a fragment

To update a smaller fragment, name it with an `[up-target]` attribute:

​```html
<nav>
  <a href="/pages/a" up-target="article">A</a>
  <a href="/pages/b" up-target="article">B</a>
</nav>

<article>
  Page A
</article>
​```

Clicking _B_ fetches `/pages/b` and replaces only the `<article>` element with its counterpart from the response. Everything around it keeps its state.

An `[up-target]` attribute implies [`[up-follow]`](https://unpoly.com/up-follow.md), so you don't need to set both.

[Read more: Links](https://unpoly.com/links.md)
```
(The source's `<!-- mark: up-follow -->` and `<!-- mark: up-target="article" -->` are gone, as intended. The fences are shown with zero-width spaces only so this report renders.)

### 4.2 `/up.render.md` (excerpt; full file `proto/out/up.render.md`, 723 lines, 30 KB ≈ 7.5k tokens, against 108 KB of HTML)
```markdown
---
title: "up.render([target], [options])"
url: "https://unpoly.com/up.render"
kind: "JavaScript function"
area: "API reference"
description: "Replaces elements on the current page with matching elements from a server response or HTML string."
---

# up.render([target], [options])

_JavaScript function in [up.fragment](https://unpoly.com/up.fragment.md)_

Replaces elements on the current page with matching elements from a server response or HTML string.

## Choosing which fragment to update
…
## Passing the new fragment

| Effect | HTML attribute | JavaScript option |
| --- | --- | --- |
| Fetch a URL and update targeted fragments | `[href]` or `[action]` | `{ url }` |
…
## Parameters

### Targeting

#### `[target]`

_optional · type: `string` | `Element` | `jQuery` | `Array<string>`_

The [target selector](https://unpoly.com/targeting-fragments.md) to update.

Instead of passing the target as the first argument, you may also pass it as a `{ target }` option. See [`{ target }`](#options.target) for details.

#### `[options.target]`
…
## Return value

Type: `up.RenderJob`

A promise that fulfills with an [`up.RenderResult`](https://unpoly.com/up.RenderResult.md) once the page has been updated.
…
```
Other samples are in `proto/out/`: `up-follow.md`, `up.link.md` (module, with the Essentials and All features lists), `up.RenderResult.md` (class), `learn.md`/`api.md` (hubs), `links.md` (chapter overview), `up.layer.open.md`. All 626 pages are in `proto/all/`.

Size reality check: Claude Code's WebFetch truncates around 100 KB and has a small model summarise non-allowlisted domains (third-party analysis, see §5.3). The largest page is 29 KB, so no page needs splitting.

---

## 5. Access paths

### 5.1 `.md` suffix versus pretty indexes
- There is no conflict. `/up.render` is served from `up.render/index.html` by the existing rewrite (`site/source/.htaccess.erb:6-10`). `/up.render.md` is a real file, so Apache serves it directly.
- Nested pages work too: `/start/links.md` lands at `build/start/links.md`.
- Root: `/index.md` would be the landing page, which is excluded (§7). Point agents at `/llms.txt` instead.
- Redirected old slugs (`RedirectPermanent /up.proxy /up.network`, from `unpoly/src/unpoly-migrate/.htaccess`, spliced in at `.htaccess.erb:33`) match whole path segments only, so `/up.proxy.md` would 404.
  - Optional fix: one generic `RedirectMatch`, or emitting `.md` twins of each redirect from `guide.migrate_redirects` (`site/lib/unpoly/guide/repository.rb:338-341`).
  - Negotiated requests are unaffected: the old URL redirects, then the new one negotiates.
- `AddType "text/markdown; charset=utf-8" .md` is needed. Today Apache serves an unknown `.md` with no proper type (`/CHANGELOG.md` currently 404s, so there is no existing behaviour to keep).
- Colons in `/up:link:follow.md` are fine for Apache and for the preview (`site/lib/ext/rack/support_colons_in_path`).

### 5.2 "MD" button
- Add a sibling helper next to `edit_button` (`config.rb:515-522`), called beside it in `feature_template.html.erb:27` and `interface_template.html.erb:10`.
- It can derive the URL from `documentable.guide_path + '.md'`, so no new state is needed.
- Also add `<link rel="alternate" type="text/markdown" href="…md">` to `layouts/_head.html.erb` (currently 6 lines), keyed off `@search_documentable`, which the templates already set (`feature_template.html.erb:6`, `interface_template.html.erb:7`). Templates render before the layout, so it is set in time.
- Precedents for both: Cloudflare, Vercel, Mintlify; also `cards/app/helpers/application_helper.rb:110`.
- The hubs have no edit button. Give them the alternate link only, or the button too (a cosmetic decision).

### 5.3 Accept negotiation
**Who asks (verified by the web-research subagent on 2026-10-07):**

| Agent | Accept | Gets MD via negotiation? |
|---|---|---|
| Claude Code WebFetch (v2.1.289, checked live against httpbin) | `text/markdown, text/html, */*` | yes |
| Cursor | `text/markdown,text/html;q=0.9,…` | yes |
| OpenCode | `text/markdown;q=1.0, …` | yes |
| Codex, Copilot | `text/html,application/xhtml+xml,…` | no |
| Gemini CLI, Windsurf | `*/*` | no |

Sources: Checkly survey (Feb 2026), the Cloudflare "Markdown for Agents" docs, roots.io.

So the `.md` URLs and `.md`-suffixed links matter more than negotiation does.

**Draft `.htaccess` (untested: no Apache is available locally, and pulling an httpd image would mean installing software).** It goes after the trailing-slash redirect and before the `index.html` rewrite in `.htaccess.erb`:
```apache
AddType "text/markdown; charset=utf-8" .md

# Agents that prefer Markdown get the page's .md twin at the page's own URL.
# Only an explicit text/markdown negotiates; */* (browsers, curl, Codex, Gemini) keeps HTML.
RewriteCond %{HTTP:Accept} text/markdown [NC]
RewriteCond %{DOCUMENT_ROOT}/$1.md -f
RewriteRule ^(.+)$ /$1.md [L]

# The site root has no Markdown twin; send agents to the index instead (optional).
RewriteCond %{HTTP:Accept} text/markdown [NC]
RewriteRule ^$ /llms.txt [L,T=text/markdown]

# Both representations of a page vary on Accept (merge keeps Accept-Encoding).
Header merge Vary Accept "expr=%{CONTENT_TYPE} =~ m#^text/(html|markdown)#"

# Markdown twins should not compete with the HTML pages in search engines.
<FilesMatch "\.md$">
  Header set X-Robots-Tag "noindex"
</FilesMatch>
```
Notes:
- There is no loop. After the internal rewrite, `/up.render.md` fails both `-f $1.md` and the `index.html` condition.
- `Header … expr=` needs Apache ≥ 2.4.10.
- `text/markdown;q=0` would match wrongly. That is negligible.
- **Do not use MultiViews.** Apache breaks ties for `*/*` by smallest size, which would hand the smaller `.md` to browsers.
- **Caching:** unpoly.com answers `server: nginx` with an Apache-style ETag and Apache's default 404 page (`curl -I`). That points to nginx proxying Apache.
  - `cache-control: max-age=0, private` (set at `.htaccess.erb:35`) keeps shared caches out today.
  - If the nginx layer ever caches, or a CDN is added, `Vary: Accept` must be honoured. The Ghost incident (Aug 2026) is what happens when it isn't: Cloudflare served cached Markdown to browsers.
  - **Ask ops** whether nginx caches.

**Test matrix for staging** (curl):
- `/up.render` with no Accept, with `Accept: */*`, with the browser Accept, and with Claude's Accept
- `/up.render.md`
- `/start/links` with Claude's Accept
- `/` with Claude's Accept
- `/up.proxy` with Claude's Accept, which should give 301 then MD

Check `Content-Type`, `Vary` and the status on each.

**Incidental findings on the live site (not in scope, worth fixing):**
- `curl -I https://unpoly.com/up.render/` returns `301 location: http://unpoly.com/up.render`. The redirect downgrades to http because Apache behind nginx doesn't know about TLS (`.htaccess.erb:6-7`).
- **Every "Edit page" link is broken.** `guide.git_revision` (`site/lib/unpoly/guide/repository.rb:189`) lacks `.strip`, so URLs read `…/blob/e15660b8…%0A/src/…` (seen in `build/start/links/index.html`).

---

## 6. Link rewriting

| Context | Recommendation | Why |
|---|---|---|
| Served `.md` | **Absolute `.md` URLs**: `https://unpoly.com/up.render.md#options.target` | WebFetch hands content to a summarising model; the caller never resolves a base URL. `.md` links keep Codex, Gemini and Copilot (no Accept negotiation) in Markdown. Stripe does exactly this. Cards uses absolute canonical URLs in its served `.md` (`cards/app/helpers/markdown_response_helper.rb:5-17`). Cost: 5,739 links × 19 B = 109 KB of 1.36 MB (8%); `/up.render` +2.9 KB. |
| Relative (`../up.render.md`) on the web | Rejected | Only works when the agent resolves against the right base, and `..` resolution is error-prone for models. It also breaks once the skill uses a different folder layout. |
| Root-relative (`/up.render.md`) | Acceptable fallback if bytes matter | Mintlify and GitHub do this, but it breaks when a tool drops the origin. |
| In-page anchors (`#options.abort`) | Keep | They point at `#### \`[options.abort]\``, and the string is greppable in the same file. |
| Skill files | **Relative file paths**, rewritten by the skill exporter (`../up.fragment/up.render.md`) | Must work offline. Cards does the same (`cards/app/models/bundle/link_rewriter.rb`). Links to pages outside the skill (changes, support) stay absolute https. |
| Images | Absolute `https://unpoly.com/images/…` | An agent can't see them anyway. Alt text carries the meaning. |

The prototype converter has a pluggable `href` strategy (`:absolute_md`, `:root_md`, `:resolver`), so this stays a configuration choice.

---

## 7. Landing and one-off pages

- **Exclude the landing page** (`site/source/index.html.erb`, 251 lines of one-off bands). It renders no documentable, so it has no `data-pagefind-body`, and the converter's inclusion rule skips it by construction.
- **Replace it for agents with a generated index** built only from the Toc model and existing page summaries. It has no new copy:
  - H1 "Unpoly", then a one-paragraph lead taken from `start/overview`'s `summary_markdown`
  - "## Learn": chapters with their pages (= what `_area_hub` iterates, `_area_hub.html.erb:7-34`)
  - "## API": modules with their summaries
  - The same generator feeds `/llms.txt` (llmstxt.org format: H1, blockquote, H2 file lists) and SKILL.md's top-level index.
- The hubs `/learn` and `/api` *are* useful and cheap: they convert as-is (`proto/out/learn.md`, `api.md`).
  - The API hub's group rows ("HTML 8 / Events 4") carry no links. In Markdown they would be better as nothing, or as links to the module page. This is a converter rule, not a template change.
- Out of scope: `/changes` (and release notes, per the brief), `/support`, imprint/privacy, `version_choice`, examples, parser fixtures (`test.*`, excluded via `fixture?`, `config.rb:302-304`).

---

## 8. Skill architecture sketch (stretch goal)

### 8.1 What the cards Bundle gives us (from the subagent's study of `cards/`)
- Layout (`cards/app/models/bundle/generator.rb`, 322 lines): `<name>/SKILL.md`, `scripts/search.py` (copied verbatim), `references/index.md`, `references/<deck>/index.md`, `references/<deck>/<id>-<slug>.md`.
- `cards/lib/bundle/search.py` (337 lines):
  - stdlib only, Python 3.8+
  - BM25F-lite with field weights title 3, tags 2, description 2, keywords 1.5, body 1
  - prefix matching ×0.6
  - boosts for repeats, deprecated and recency
  - XML-ish `<result score path><title><summary>` output
  - skips `index.md`
- `cards/lib/bundle/test_search.py`: 180 lines, 23 unittest tests, run in CI under `python:3.8-slim` (`cards/.gitlab-ci.yml:210-225`). **The tests pass** (`Ran 23 tests … OK`, also re-run on my adapted copy).
- The SKILL.md template (`generator.rb:267-319`) has good, transferable prose:
  - "search with many variations in one call", OR semantics, `--limit`
  - a grep fallback
  - orientation via the index files

### 8.2 Adaptation findings (prototype in `skillproto/`, run on the 626 converted pages)
- **The stock script misses exact API names.** It tokenizes `up.render` into `up` and `render`, and `up` has near-zero IDF.
  - `up.render` → top 5 were RenderJob, fragment.config, RenderResult, navigate, render-lifecycle. The `up.render` page itself was not among them.
  - `up-target` → `up-hungry` first.
- **The adaptation is about 30 lines** (`skillproto/scripts/search_unpoly.py`, diff against the original):
  1. Additionally index compound identifiers as single tokens (`[a-z0-9$]+(?:[.:-][a-z0-9$]+)+`).
  2. Add a `names` field (weight 4) from front matter: the feature name plus its param names.
  3. A plain word must not prefix-match compound tokens. Without this, `up` prefix-matched every identifier and scores exploded to ~170.
  4. Apply a ×4 boost when a query identifier equals the page's `name`.
- After adaptation: `up:link:follow`, `up.layer.open` and `up-follow` each rank their own page first. `up-target up-follow targeting` → up-follow, then targeting-fragments. Natural-language queries keep ranking as before (validate → up-validate; overlay close → closing-overlays).
  - My throwaway front matter had sloppy `name` values on guide pages. That is why `up.render` still lost to render-lifecycle; a model-generated `name` fixes it.
- Replace the cards boosts (repeats, recency) with: deprecated ×0.6 (keep it, from `visibility`), and possibly a mild kind boost.
- Fix the subagent's noted quirk: result `path` is relative to `references/`. Make it skill-root-relative.
- About 14 of the 23 tests are generic and carry over unchanged. The repeats, recency and keyword tests get replaced by identifier, name-boost and prefix-isolation tests.

### 8.3 Filesystem hazards (must be designed in)
- **Case-insensitive collisions** on macOS and Windows: `up.layer` (module) vs `up.Layer` (class), `up.request` vs `up.Request`, `up.preview` vs `up.Preview` (`ls build | tr A-Z a-z | uniq -d`).
  - A flat folder loses one file of each pair silently on install. So does a git checkout of unpoly-skills on a Mac.
  - Fix: give classes their own folder (`api/up.layer/classes/up.Layer.md`), or add a suffix.
- **`:` in 35 event pages** (`up:link:follow`) is illegal in Windows filenames. **`$`** (`up.$compiler`, `up.$macro`, `up.$on`) gets expanded by shells when an agent runs `cat …/up.$compiler.md`.
  - Fix: one sanitizer, `[:$]` → `_`. Verified to introduce no new collisions.
  - The front matter `name` keeps the real identifier, and search indexes the `name`.

### 8.4 Proposed layout of `unpoly/unpoly-skills`
```
skills/unpoly/                      # what `npx skills add` installs (generated files COMMITTED: the CLI clones the repo)
  SKILL.md                          # ~150 lines: what's inside, how to walk, top-level index, search usage, grep fallback
  scripts/search.py                 # adapted from cards
  references/
    learn/index.md                  # = /learn hub: chapters → pages (one level)
    learn/<chapter-slug>/<page>.md
    api/index.md                    # = /api hub: modules with summaries
    api/<module>/index.md           # = module page: Essentials + All features
    api/<module>/<feature>.md       # sanitized names; classes in api/<module>/classes/
    api/formats/…                   # page groups such as Formats
build/                              # exporter + manifest consumer (Python), the SKILL.md template
tests/test_search.py                # adapted cards tests (+ a fixture corpus)
.github/workflows/                  # python -m unittest; rebuild on Unpoly release
```
- **Staged indexes reuse the site's own Markdown pages.** SKILL.md links `references/learn/index.md` and `references/api/index.md` (the converted hubs). The module pages are already third-level indexes, so no index is written by hand.
- Search skips `index.md` (the cards convention). Module pages would then be skipped too, which is wrong. Either name them `README.md`, or skip only the two hub files.
- **Build boundary (recommendation):**
  - The site build emits the `.md` twins plus a manifest `build/agents.json`. Per page it lists: URL, md path, title, `name`, `names`, kind, area, module or chapter, description, visibility.
  - The unpoly-skills exporter (Python) reads the manifest, copies files into the layout above, rewrites the absolute `https://unpoly.com/X.md` links to relative paths (a regex over a format we control), and writes SKILL.md from its template plus the generated top-level index.
  - The skill repo then needs no Ruby, and the site stays the single renderer. The same manifest generates `/llms.txt`.
- Front matter per reference file: `title`, `name`, `names: [..]` (flow array; the cards parser handles flat keys and flow arrays only), `kind`, `module`, `description`, `url`, `deprecated: true` when it applies. Keep it flat.
- Version: unpoly.com documents the current major, so the skill does too. Put `unpoly_version` in SKILL.md metadata and in the root index.

### 8.5 Name suggestions
`name` must be `[a-z0-9-]`, match the directory, and avoid "claude"/"anthropic" (agentskills.io spec; Anthropic best practices).
1. **`unpoly`**: the most natural trigger, the "use when working with Unpoly" description does the routing, and it is shortest to type (`/unpoly`). Recommended.
2. **`unpoly-docs`**: says what it is (reference, not a workflow), and leaves `unpoly` free for a later workflow skill.
3. **`unpoly-howto`**: the maintainer's working name. It suggests recipes rather than a full API reference.

---

## 9. Distribution channels (follow-up question)

Web research by a subagent, as of 2026-10-07. [V] means checked against docs, source code or a live endpoint. [I] means inference.

**Is `npx skills add` enough for most users?** It is a good primary channel, but it has three gaps:
1. **Updates are manual only.** Users must run `npx skills update`; the lockfile records the source and ref. [V]
2. **Claude Code and Codex users expect a plugin install.** Expo's README says it outright: plugins for Claude Code and Codex, the skills CLI for everything else. [V]
3. **Skills often go untriggered.** In Vercel's eval (Jan 2026), the skill was never invoked in 56% of cases. Pass rates: baseline 53%, skill 53%, skill plus explicit instruction 79%, AGENTS.md docs index 100%. [V] Every channel therefore needs a one-line AGENTS.md/CLAUDE.md snippet in our docs, e.g. "for anything `up-*`/`up.*`, consult the unpoly skill". [I]

**Facts per channel**
- **`npx skills` (vercel-labs/skills v1.7.1)**
  - Supports about 80 agents: Claude Code, Codex, Cursor, Copilot, Gemini CLI, OpenCode and more. [V]
  - Installs into the project by default and symlinks per agent; `-g` installs globally. [V] With a project install, all ~650 files get committed into the user's app repo. [I]
  - Refs can be pinned (`#v2`), and `update` respects the pin. [V]
  - Git sources have no file cap. Archive and well-known sources are capped at 1000 files. [V]
  - Telemetry feeds the skills.sh leaderboard. The `skills` package had 24.7M npm downloads per month. [V]
  - The CLI also reads `.claude-plugin/marketplace.json` repos and npm deps (`experimental_sync`). [V]
- **Claude Code plugin from our own marketplace**
  - Needs only `.claude-plugin/marketplace.json` with `{"name":"unpoly","plugins":[{"name":"unpoly","source":"./"}]}`, sharing the same `skills/` folder. Supabase, Cloudflare, Better Auth and TanStack do exactly this. [V]
  - Install: `/plugin install unpoly --marketplace unpoly/unpoly-skills` (one step since v2.1.275). [V]
  - Auto-update is **off by default for third-party marketplaces**. Omit `version` so users track commits. [V]
  - Codex and Copilot CLI also read `.claude-plugin/marketplace.json` as legacy-compatible. [V]
  - The skill is invoked as `/unpoly:unpoly`. [V]
- **`claude-plugins-official`** has the best discovery and auto-update, but needs an Anthropic partner contact. The community marketplace and the claude.ai directory take submissions, with per-version review. [V]
- **npm package (copy `skills/unpoly` into the tarball)**
  - Version-matched automatically. This is what Next.js (bundled docs plus a managed AGENTS.md block) and TanStack Intent do. [V]
  - Unpoly reach: 15.7k npm downloads per month, against 4.86M jsDelivr hits per month and 409k total `unpoly-rails` gem downloads. [V] Most Unpoly users load it via CDN or gem, so npm reaches a minority. [I]
- **Laravel Boost**: third-party composer packages can ship `resources/boost/skills/<name>/SKILL.md`. [V] Unpoly has no Packagist package, so this is a later and optional channel. [I]
- **Well-known `/.well-known/agent-skills/index.json` on unpoly.com**
  - Draft RFC (Cloudflare-led); live on Cloudflare, Stripe and the Claude Code docs. [V]
  - The only confirmed consumer is `npx skills add https://unpoly.com`, and archives are capped at 1000 files. [V]
  - Cheap to emit from our build, but low reach today. [I]
- **Agent Plugins 1.0** (root `plugin.json`): supported by Codex, Cursor, Copilot, Kiro and VS Code, but not Claude. **Gemini extensions** need their own `gemini-extension.json`. Both are small JSON files pointing at the same `skills/`. [V]
- **Precedents**
  - Expo, Svelte and Stripe ship several channels (plugins plus skills.sh plus llms.txt).
  - Prisma and Remotion ship skills.sh only.
  - **htmx, Hotwire/Turbo and Rails ship no official skill and no llms.txt.** Unpoly would be first in its niche. [V]

| Channel | Convenience (discover / install / update) | Our burden | Reach |
|---|---|---|---|
| `npx skills` | leaderboard / 1 cmd (Node) / manual | none beyond the repo | ~80 agents |
| Claude marketplace (own) | after `marketplace add` / 1 cmd / manual unless the user enables auto-update | 1 JSON file | Claude Code (+ Codex, Copilot via legacy read) |
| Official Claude marketplace | best / 1 cmd / auto | partner contact | Claude Code, claude.ai |
| npm tarball | invisible / `npm i` / automatic, version-matched | release step, +650 files | npm users (a minority) |
| Well-known on unpoly.com | low / 1 cmd / digest | index + tarball per deploy | skills CLI only |
| Agent Plugins / Gemini manifests | per client | 1 JSON each | Codex, Cursor, Copilot, VS Code / Gemini |
| AGENTS.md snippet in our docs | — | docs text | every agent; fixes triggering |

**Version matching.** The cheapest option is git refs: `main` holds v3, and branches `v2`/`v1` exist only if wanted. All git-based channels honour refs. [I] SKILL.md should also tell the agent to check the installed version (package.json, Gemfile.lock, `up.version`) and warn on a mismatch. Do not install several majors under the same name. [I]

**Recommendation**
- **v1:** a single repo, `unpoly/unpoly-skills`, containing:
  - `skills/unpoly/` (committed, generated)
  - `.claude-plugin/marketplace.json` (source `./`)
  - the README documenting both `npx skills add unpoly/unpoly-skills` and the Claude plugin install
  - an AGENTS.md snippet on unpoly.com
  
  The marginal cost over skills-only is one JSON file.
- **Later, on demand:**
  - a root Agent Plugins `plugin.json` (Cursor/Codex/Copilot; keep it consistent with `.claude-plugin`)
  - a submission to the community Claude marketplace
  - a well-known index on unpoly.com, emitted by the site build
  - npm tarball inclusion, only if npm adoption justifies it
  - a Boost composer package, only if Laravel demand shows up
- **The one shared build output:** a self-contained `skills/unpoly/` folder (SKILL.md, `references/`, `scripts/search.py`) with no build-time dependencies and fewer than 1000 files (today about 650 plus indexes). Every channel then becomes a manifest pointing at it, or a copy or tarball of it. Keep `version` out of plugin.json; skills-lock and plugin updates track commits.

---

## 10. Open decisions for the maintainer

1. **Generation approach.** X1 (Middleman `.md` resources plus one converter; preview yes; build +~45 s), or A/X2 (after_build; +3 s; X2 keeps the preview)? Recommendation: X1, with X2's fast path only if build time hurts.
2. **Converter knowledge.** Keep it keyed on existing CSS classes plus a build-time leftover check, or add explicit `data-md="drop|keep"` hints to templates?
3. **Link style in served `.md`.** Absolute `https://unpoly.com/…md` (recommended; +8% bytes), root-relative, or HTML URLs relying on negotiation?
4. **Param rendering format.** `#### \`[options.target]\`` plus an italic meta line (prototype), or a definition-list or table style?
5. **Magic comments.** Strip `mark:`/`mark-line`, keep `result:`/`chip:`, and turn `label:` into a caption line above the fence? (Prototype: strips `mark`, keeps the rest verbatim.)
6. **Negotiation scope.** Doc pages only, or also `/` → `/llms.txt`? Also send `X-Robots-Tag: noindex` for `.md`?
7. **Ops question.** Does the nginx in front of Apache cache? If yes, negotiation needs `Vary`-aware caching, or should be dropped in favour of `.md`-only URLs (the Ghost lesson).
8. **Redirects.** Add `.md` twins of the migrate redirects (repository.rb:338-341), or accept 404 for old slugs plus `.md`?
9. **Agent index.** Generate `/llms.txt` from the Toc model (and reuse it in SKILL.md)? Is the lead paragraph taken from `start/overview`'s summary acceptable copy?
10. **MD button placement and label**: left of Edit, an "MD" icon. Also on the hubs, which have no Edit button?
11. **Skill layout.** URL-mirroring flat folder (simplest; collisions must still be handled) versus the `learn/<chapter>/` and `api/<module>/` tree (recommended)? Where do classes go to avoid case collisions?
12. **Filename sanitizing** for `:` and `$` (`_` recommended).
13. **Skill build boundary.** Manifest JSON from the site build plus a Python exporter in unpoly-skills (recommended), or a Ruby rake task in unpoly-site?
14. **Skill name**: `unpoly` / `unpoly-docs` / `unpoly-howto`.
15. **Distribution for v1**: `npx skills` + own Claude marketplace manifest in the same repo (recommended), or skills-only? Version handling via git branches?
16. **Incidental fixes:** the Edit-page link newline (`repository.rb:189`) and the http downgrade on the trailing-slash redirect. In this station or separately?
