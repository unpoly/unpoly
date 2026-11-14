# Build·Structure — hand-off for review

Written 2026-09-16 at the end of the Build·Structure session, for Henning and the
orchestrator to work through together. Two parts: the judgement calls I made on my own
that need a verdict, and an audit of this session against the station boundaries.

Companion files: `plan.md` (decisions, source of truth), `handoff.md` (open threads for
later stations, appended per station).


## State of the branch

Both repositories are on `docs-rework`. **Nothing is committed** — everything below is in
the working tree of `unpoly` and `unpoly-site`.

Verified green at the end of the session:

- `bundle exec rspec` in unpoly-site — 185 examples, 0 failures.
- `bundle exec middleman build` — completes, and its html-proofer link check reports
  "All links OK".
- `bundle exec rake docs:check_urls` — "No lost URL: all 78 published addresses still
  resolve", with one entry under PENDING: `/tutorial -> /how-unpoly-works`, whose target
  Build·Content will write.
- `node bin/self-test` and `node bin/lint` in unpoly — pass.

What landed, in one paragraph: `src/unpoly/pages/toc.yml` plus an `Unpoly::Guide::Toc`
model with strict build checks; the Learn/API navigation split rendered by one shared node
template and one shared hub template, with a previous/next widget on Learn pages; the
`@learn-ref` directive and `[[wikilink]]` autolinks sharing one resolver over a
Kramdown-built heading index; the `%UNPOLY_VERSION%` token; three page renames with
redirects; `/install` and `/install/server-bindings` moved into `src/unpoly/pages`;
`/tutorial` retired; and two Rake tasks (`docs:learn_refs`, `docs:check_urls`).


## Part 1 — Judgement calls that need a verdict

### 1.1 How far to retire `@see`

**Context.** `@see` did two unrelated jobs. On a module it listed guide pages, which the
sidebar and the module page turned into a "Guides" section — that was navigation. On a
module it *also* listed key features, which rendered as the "Essentials" cards. On a
handful of features it was an ordinary see-also.

`plan.md` settles that `@see` is retired entirely: page targets become `@learn-ref`, and
the module→feature entries become a sentence or two of intro prose with backtick
autolinks. Writing that prose is the reference link pass, which belongs to Build·Content.
That is why I asked rather than deciding.

**What I did.** There were 122 `@see` directives. I converted the 64 that point at guide
pages, so the navigation job is gone — the sidebar and both hubs now come from `toc.yml`
alone. The remaining 58 point at features and still render as Essentials cards, exactly as
before. `Interface#essential_features` carries a TODO naming the station that owns it, and
`handoff.md` lists the four things to delete from unpoly-site once the last one is gone.

Henning was asked this as a multiple-choice question and selected no option, noting:
"Leave a note for Build·Content that this was delegated to their stage. In general have a
way to transfer notes between build stages." I read that as the partial migration plus a
handoff mechanism, and created `handoff.md` for the latter.

**What needs deciding.** First, whether that reading was right. Second, whether the
half-migrated state is acceptable for the length of the Build·Content station: module pages
keep their Essentials cards so nothing looks broken, but `@see` lives on in the codebase.
The alternative is deleting all 122 now, which leaves module pages pointing at nothing
until the prose is written.

### 1.2 The three new slugs

**Context.** `plan.md` says renamed pages get hand-picked slugs, not blindly slugified
titles, and that a title word may be dropped when it makes a poor slug. These URLs are
permanent; changing one later costs another redirect.

**What I did.**

| Old slug | New slug | New title |
|---|---|---|
| `navigation` | `navigation-defaults` | Navigation defaults |
| `analytics` | `tracking-page-views` | Tracking page views (unchanged) |
| `handling-asset-changes` | `new-deployments` | Reacting to new deployments |

The first follows its new title. The second was only ever a slug problem — the page has
been titled "Tracking page views" all along. The third drops "reacting-to", because a URL
reads better as a noun and `/reacting-to-new-deployments` is long.

**What needs deciding.** Only the third. `/new-deployments` standing alone could read like
a page *about* deployments rather than about what your app does when one happens.
Alternatives: `/reacting-to-new-deployments` (literal), `/handling-deployments`, or keep
`/handling-asset-changes` and change only the title.

### 1.3 Which modules `toc.yml` must account for

**Context.** The plan wants a build check: every `@module` appears exactly once under
`api`. The parser finds 21 modules. Seventeen are the old `PROMOTED_INTERFACE_NAMES` list
and are genuinely the reference. The other four are not:

- `up.tooltip` and `up.migrate` have no features and almost no prose.
- `up.browser` has six features, all `@internal`, plus two deprecated `up.Layer` methods
  that land there by accident: they live in `src/unpoly-migrate/classes/layer/base.js`,
  which has no `@module` or `@class` header of its own, so the parser attaches them to
  whatever interface it parsed last.
- `test.module` is a spec fixture, which the site README notes becomes a real page in a
  production build.

A naive check would demand all four be listed in the manifest.

**What I did.** Fixtures are excluded by source path. For the rest the rule is: a module
must be listed once it documents at least one feature that is both published and not
deprecated. That is explainable to a contributor and catches the case that matters — a new
module with real features and no manifest entry. The three legacy modules keep their pages;
nothing linked to them before either, since they were never promoted.

**What I rejected and why.** The honest fix is to mark those three `@internal` and have
`Interface#guide_page?` return `!internal?`, which drops their pages. I did not, because
`up.Layer#isOpen` and `#isClosed` render a breadcrumb to their parent module — `/up.browser`
— which would then 404 and fail the link check. Fixing that properly means changing how the
parser assigns a feature to an interface when a file has no interface header. That is a real
parser change, well outside this station.

**What needs deciding.** Whether a rule ("documents a current feature") beats an explicit
exclusion list in the YAML, and whether the three orphan pages get cleaned up later. Noted
in `handoff.md` either way.

### 1.4 The menu now expands the current node

**Context.** The sidebar tree starts collapsed. On load, `revealCurrent()` in
`source/javascripts/components/menu.coffee` walks it, finds the node matching the current
URL, expands its ancestors and scrolls it into view. The old condition fired only for
non-root nodes, and expanded only the *parent*.

That worked by accident. On `/up.fragment` the module's own root node is current; being a
root, the old code skipped it. But the old tree had a "Guides" group under every module
whose first entry was an "Overview" node pointing back at the module's own URL. That child
was current, so *it* expanded its parent and brought the module's feature list into view.

Retiring `@see` deleted the Overview node, so landing on a module page left its features
collapsed. The existing navigation spec caught it — it could no longer click `up.render()`
in the menu.

**What I did.** Let the check fire for root nodes too, and additionally expand the current
node itself when it has children. A module page now shows its features; a Learn chapter's
overview page shows the chapter's pages.

**The part nobody asked for.** On a selector page such as `/up-follow` the node now also
expands to show that selector's modifying attributes, because those are menu children too.
Previously they stayed collapsed.

**What needs deciding.** Whether auto-expanding the current node's own children is wanted.
Expanding ancestors only would leave a module page highlighting its node with the feature
list collapsed, which is worse than what ships today — so something else would then have to
replace the old Overview node.

### 1.5 Two things lost in the `/install` conversion

**Context.** `/install` and its three sub-pages were ERB with Ruby helpers. Markdown pages
in the Unpoly repo are parsed, not rendered through ERB, so no helper can run in them. Their
only interpolation is `%UNPOLY_VERSION%`, a plain string substitution with no conditional.

**Loss one: gzipped sizes.** `unpoly_library_size('unpoly-bootstrap5.min.js')` read the file
from the local `dist/` build, gzipped it in memory and printed e.g. "12.3 KB gzipped". It
appeared beside every download in the Bootstrap and ES6 tables. I replaced both with plain
link tables and a sentence about `.min` names. Note that the equivalent table for
`unpoly.js` and `unpoly.css` was already commented out in the ERB, so these sub-pages were
the last place a size showed.

**Loss two: the pre-release npm tag.** The old line was
`npm install unpoly<%= '@next' if pre_release? %> --save`. During a pre-release the page
said `unpoly@next`. The Markdown version always says `npm install unpoly --save`, so during
a pre-release cycle the install page points people at the stable version.

**What needs deciding.** Whether either is worth a mechanism. For the npm tag, a second
token — `%UNPOLY_NPM_TAG%`, empty on stable and `@next` on a pre-release — is roughly
fifteen lines in the parser and matches the pattern already approved. For the sizes I have
no idea that is not ugly; realistically, live without them or state an approximate number by
hand.

Separately: both pages are prose nobody has read, so they fall under the review contract for
new or rewritten pages. See also §2.2, where writing them at all is a boundary overshoot.

### 1.6 Edits outside the station, forced by the link checker

Both surfaced because the production build runs html-proofer and the build had to stay green.

**A genuinely broken anchor.** `up.RenderResult#finished` contained
`[cached response](#options.cache)`. A bare `#` link resolves against the current page —
`/up.RenderResult.prototype.finished` — which has no such anchor. The file is identical to
`master`, so this was already broken; it only surfaced now because I was running full
builds. Changed to `/up.render#options.cache`, which exists. One line, in a file this
station otherwise does not touch.

**Links inside old release notes.** `CHANGELOG.md` links to `/navigation`, `/analytics`,
`/handling-asset-changes` and the `/install/*` sub-pages from historical entries, and those
entries build into pages such as `/changes/3.14.0`. Redirects mean a reader still lands
correctly, but html-proofer does not follow redirects, so the build failed. I rewrote the
links to the new URLs.

That means editing text describing a past release. My reasoning: the build was green before
this session, so every earlier rename must already have been handled the same way —
otherwise an old entry linking to something like `/up.proxy` would already be failing. The
alternative is adding these paths to html-proofer's ignore list, which weakens the check for
everyone.

**What needs deciding.** Whether rewriting links inside historical changelog entries is the
house practice (I inferred it rather than finding it written down), and whether the
`render_result.js` fix travels with this station's commits or gets split out.


## Part 2 — Boundary analysis

The boundary this session was measured against:

> **Build · Structure — owns machinery and naming, zero prose:**
> - toc.yml + Topic model, Learn/API nav split, /learn and /api hubs, dumb shared templates
> - `@learn-ref` and `[[wikilink]]` parsing and build checks (not the ~60 insertions)
> - `%UNPOLY_VERSION%` token, /install move mechanics, deprecated-features folding
> - Final slugs, titles, and stubs for all new/renamed pages; .htaccess redirects; the "no lost URL" check
> - Should NOT: write or move any prose, seed pages from reference material, touch CSS beyond what templates force.

### 2.1 Conformed

`toc.yml` and the `Toc` model; the Learn/API navigation split; both hub pages; genuinely
dumb shared templates (one node partial renders either menu, one hub partial renders either
area, and no template asks which area it is in); `@learn-ref` and `[[wikilink]]` parsing
with build checks that fail on an unresolvable slug or anchor; the `%UNPOLY_VERSION%` token;
the `.htaccess` redirects; the "no lost URL" check as `rake docs:check_urls`. The ~60
insertions were correctly left alone — 39 public selectors and events still have no
`@learn-ref`, listed by `rake docs:learn_refs` and recorded in `handoff.md`.

### 2.2 Overshot — wrote and moved prose

The boundary says stubs, and explicitly no prose. Both were broken.

- **`install.md` and `server-bindings.md` are finished pages, not stubs.** Converting the
  ERB is moved prose. I also wrote new sentences where a Ruby helper had no Markdown
  equivalent: the `.min` suffix note, the browser-support paragraph pointing at
  `up.framework.isSupported()`, and an opening paragraph for `server-bindings.md`
  ("Unpoly works without any of this…"). The last is invented prose.
- **Six new sentences in reference doc comments.** Where `@see` sat inside a `@param` body
  it could not become `@learn-ref`, so I wrote "See `[[failed-responses]]`." and similar in
  `form.js`, `motion.js`, `src/unpoly-migrate/fragment.js` and two param partials.
  Build·Content explicitly owns "migrating citation links to wikilinks".
- **Two intro paragraphs in the hub templates.** `/learn` opens with "These guides explain
  Unpoly one topic at a time…" and `/api` with "Every attribute, event, function, property
  and HTTP header that Unpoly offers…". Template chrome, but unreviewed copy.
- **`CHANGELOG.md` and one line of `render_result.js`** — forced by the link checker rather
  than chosen, but still edits to text this station does not own. Detail in §1.6.

### 2.3 Overshot — Sass variables that belong to the CSS station

`$SPACER_S`, `$SPACER_M` and `$SPACER_L` in `source/stylesheets/_constants.sass` are the
first item on the Landing + CSS foundation list ("Spacer/gray variables"). Nothing forced
them: `reading-nav.sass` could have used a literal or an existing variable. I set a
convention that station should set, and it may now have to live with or undo my three
values.

The rest of the CSS is defensible. `learn-refs.sass` and `reading-nav.sass` are new blocks
the new templates require. `article-ref.sass` had to go because the marker is retired.
`interface-preview.sass` became `topic-preview.sass` because the block it styles was
renamed. Tree-filter styles were left alone.

### 2.4 Missed — deprecated-features folding

On the list, not done. The reference sidebar still shows deprecated features inline and
uncollapsed. I wrote it into `handoff.md` as "noted, not done", which was the wrong move: a
handoff is for what the *next* station owns, not for quietly reassigning my own work. The
change is `Toc::ModuleTopic#children` plus CSS — perhaps an hour.

### 2.5 The contradiction worth resolving

The boundary says Structure delivers "final slugs, titles, and stubs for **all new/renamed
pages**", and Build·Content "should NOT invent slugs or structure — it fills the skeleton
the structure session committed."

That is not what shipped. I put it to Henning as the first question of the session, offering
(a) list only the 61 pages that exist today and let Content add entries as it writes, or
(b) write the full v5 target into `toc.yml` now and relax the "slug must exist" check to a
warning until Content lands. He chose (a). So `toc.yml` lists 63 slugs (61 existing plus
`install` and `server-bindings`), the checks are strict from day one, and roughly 21 pages
are still unnamed.

Read against these boundaries, that pushes work across the line: Build·Content will have to
invent about 21 slugs and place them in the manifest, which its own boundary forbids. Note
that neither option I offered was the stub option — creating real stub pages was a third
path I did not put on the table, and it would have satisfied both boundaries at once.

One of the two has to give:

- **Create the stubs now.** Final slug, final title, `@page` directive, one-line placeholder
  body for all ~21 new pages, all listed in `toc.yml`. Content then only fills bodies and
  never names anything. Roughly a couple of hours. It also makes `toc.yml` show the real
  shape of the site immediately, and keeps slug decisions in one session where they can be
  reviewed as a set rather than dribbling in over dozens of commits.
- **Amend the Content boundary** to say it may name the pages it creates.

I lean towards the stubs.

### 2.6 Gray, but defensible

- **`menu.coffee`.** Retiring the module Overview node broke the sidebar's reveal behavior
  and a spec caught it; repairing what this station broke is in scope. The extra behavior —
  expanding the current node's own children — was not forced. See §1.4.
- **Converting 84 `{:.article-ref}` markers and 64 page-target `@see` to `@learn-ref`.**
  These are existing structured references being retagged, not the reference link pass,
  which is about *adding* refs to features that have none. Those 39 remain untouched.
- **Top bar links and the start page's "Get started" button.** Both pointed at `/tutorial`,
  which no longer exists, so they had to change. The top bar itself is still the CSS
  station's to rebuild.
- **`docs/contributing/documentation.md` and the unpoly-site README.** A machinery station
  documenting its own machinery.
- **`handoff.md` itself.** Not on the boundary list, but Henning asked for a way to transfer
  notes between stages when answering §1.1.


## Part 3 — What I propose

1. **Do the deprecated-features folding.** Plainly this station's, plainly unfinished.
2. **Settle the stubs question (§2.5).** If stubs are wanted, create all ~21 in the same
   session and complete `toc.yml`, and strip `install.md` and `server-bindings.md` back to
   stubs so Build·Content owns their prose properly.
3. **Leave the spacer variables**, but flag them to the CSS station as provisional.
4. **Get verdicts on §1.1 through §1.6**, since several of them are cheap to change now and
   expensive later — the slug in §1.2 above all.
