# URL move runbook

Moves guide pages from `/caching` to `/learn/caching` and API symbols from `/up.render`
to `/api/up.render`. Old root URLs keep working through one general redirect rule
(see "Short paths"). Rehearsed as a dry run on 2026-10-11 and 2026-10-13 (branches
`url-move-dryrun`, pushed) and on 2026-10-18 with the general rule (branches
`url-move-dryrun-2` in both repos, worktrees in `~/Projects/urlmove2/`, not pushed);
nothing from those runs is merged.

The script and the site side live only on unpoly-site's `url-move-dryrun-2` branch, so
changes to them go there; launch day rebases that branch. (`url-move-dryrun` is the
older state with one generated redirect per document.)

## What does what

Two kinds of change, handled differently:

- **The site decides where documents live.** In unpoly-site, `Documentable#guide_path`
  prefixes every path: API symbols get `/api`, pages get the path of the `toc.yml` area
  that lists them (`/learn`, or `/api` for `url-patterns`, `relaxed-json` and the
  generated `/api/formats` index). Everything that links by slug follows by itself:
  `[[wikilinks]]`, `@learn-ref`, `toc.yml`, backtick autolinks, menus, hubs, reading
  nav, search (Pagefind indexes the built paths), Markdown twins, the skill. Templates
  link documents through a new `doc_path('slug')` helper instead of spelling paths.
  This is ordinary site code, in the commits on unpoly-site `url-move-dryrun-2`.
- **The script handles what is written as a URL.** `script/url_move.rb` in unpoly-site
  (`bundle exec rake docs:url_move`) loads the site's model and, in `../unpoly`:
  - rewrites `[label](/path)` and `href="/path"` outside code blocks and code spans,
    and `[[=base_url]]/path`, `https://unpoly.com/path` and `unpoly.com/path` spelled
    out as text (the README's link label) everywhere. In `.js` files it rewrites
    comments, and outside of them only full `https://unpoly.com/...` URLs (the two
    error messages; decision of 2026-10-18, superseding 28X). Only paths of
    documents are touched; `/changes/...`, `/support`, `/images/...`, unknown paths and
    anchor-only links are left alone. Files: `src/**`, `docs/changes/*.md`, `README.md`,
    `CHANGELOG.md`, plus `docs/contributing/*.md`, `dist/README.md`, `dist/CHANGELOG.md`
    and `.github/**/*.yml`, where it also rewrites inside code (they show the syntax).
  - writes no redirect per document: the general rule in the site's `.htaccess`
    covers every old path (see "Short paths"). It removes the `# BEGIN URL MOVE` block
    that earlier dry runs generated, and puts a four-line note at the top of
    `src/unpoly-migrate/.htaccess` that says where the old paths went and that no rule
    may start at a document's slug.
  - retargets every hand-written `RedirectPermanent` (in that file and in the site's
    `source/.htaccess.erb`) to its final page, following chains, so each old URL takes
    one hop.
  - aborts when the site side is missing, when an old path is still served by a page
    at the root, when `/install` or `/skill` would no longer resolve, when a
    hand-written redirect starts at a document's old path (the general rule would
    shadow it), or when a redirect leads nowhere. Running it twice changes nothing.

  The link patterns live in `lib/unpoly/site/legacy_links.rb`, shared with the legacy
  link check below.

`rake docs:check_urls` runs three checks and fails on any:

- **No lost URL** (the server): every address master serves, every document's old
  root path and `/install` and `/skill` still resolve, through a page, the general
  rule, or a hand-written redirect.
- **No redirect chain** (the server): every hand-written redirect leads to a page in
  one hop. It fails on a redirect to another redirect or to a short path the general
  rule redirects (CHAINED), on a target that is no page (DANGLING), and on a redirect
  from a path the general rule takes first (SHADOWED).
- **No legacy link** (our sources, `LegacyLinkCheck`): no link to a document's old
  root path, in any form the script rewrites (`[x](/up.render#options.target)`,
  `href="/caching"`, `https://unpoly.com/caching`, `[[=base_url]]/install`), in
  unpoly's doc comments, guide pages, release notes, READMEs, contributing docs and
  `.github`, nor as a quoted path or unpoly.com URL in the site's `source/`,
  `examples/` and `config.rb`. Only documents' old paths count, derived from the
  model: `/`, `/learn`, `/api`, `/changes/...`, `/support`, `/images/...`,
  `/index.md`, `/llms.txt` and every other non-document path stay allowed. Our own
  links go to `/learn/install` and `/learn/skill` too. The build runs this check
  before HTMLProofer (it stops the build), and a spec
  (`spec/lib/unpoly/site/legacy_links_spec.rb`) runs it on the real sources.
  In `.js` files it reads comments, and full unpoly.com URLs outside of them (see
  "Library strings").

The build also fails when a slug is served under both `/learn` and `/api` (Toc
`validate_short_paths!`): its short path would be ambiguous.

## Short paths

`source/.htaccess.erb` (unpoly-site) redirects a root path to the document of that
name, so `/caching` takes one hop to `/learn/caching` and `/up.render` to
`/api/up.render`. It is also a permanent shortcut for future pages:

```apache
RewriteCond %{DOCUMENT_ROOT}/$1/index.html !-f
RewriteCond %{DOCUMENT_ROOT}/learn/$1/index.html -f
RewriteRule ^(.+?)/?$ https://%{HTTP_HOST}/learn/$1 [R=301,L]
# the same for /api, then both again for Markdown twins: /caching.md to /learn/caching.md
```

- **What "exists" means.** Middleman builds every page as `<path>/index.html`, and its
  twin as `<path>.md`. The rule tests for that `index.html` (`-f`), not the directory
  (`-d`): `build/learn/start/` exists but only holds the chapter's pages, so `-d` would
  send `/start` to `/learn/start`, a 403.
- **Learn wins over API.** The Learn rule comes first. It never has to decide: the
  build fails on a slug under both prefixes (no such clash on 2026-10-18).
- **A page at the root wins** (`/api`, `/changes`, `/api.md`): the first condition.
  No Learn or API page shares a slug with a root page today; the condition keeps a
  future one (say a guide called `support`) from taking `/support` away. The script
  aborts on a document whose old path is a root page.
- **Order against the hand-written redirects.** Apache applies an `.htaccess`'s
  RewriteRules (mod_rewrite, fixup hook FIRST) before its `Redirect*` lines (mod_alias,
  fixup hook MIDDLE), wherever they stand in the file. Verified against Apache 2.4.57:
  a `RedirectPermanent /caching /learn/keeping-elements` placed above everything still
  lost to the general rule. So "renames first" cannot be won by order; it holds
  because no rename may start at a path the rule takes (the script aborts, check_urls
  reports SHADOWED). Unpoly's `.htaccess` is included below the site's own redirects
  (`<%= guide.migrate_redirects %>`), and among mod_alias rules the first match wins,
  as before. A deeper path under a prefix rename (`RedirectPermanent /start ...` and
  `/start/links`) goes to its page through the general rule, which is what we want:
  the old exact rules existed to stop the prefix rule from sending it to
  `/learn/start/overview/links`.
- **Renaming a page from now on** needs two lines, since the short path stops
  resolving with the old page:
  `RedirectPermanent /learn/old /learn/new` and `RedirectPermanent /old /learn/new`
  (the cherry-picked documentation guide says so). check_urls catches a forgotten
  `/old`, since it was a published root path.
- **Placement.** After the `/foo/` to `/foo` rule, the `.well-known` rewrite and the
  Markdown negotiation, before the `.md` fallback (a `.md` URL without a file goes to
  its page) and before `/foo` is mapped to `/foo/index.html`. `spec/features/htaccess_spec.rb`
  pins this order.
- **Locations are https://** (`https://%{HTTP_HOST}/...`), like the other rewrite
  redirects. The hand-written `RedirectPermanent` rules still answer `http://` (see
  "Locations are http://" below).

### What production must provide

- `AllowOverride` for the build directory must allow `FileInfo` (RewriteEngine,
  RewriteCond, RewriteRule, Redirect*) plus `Options` for `Options -Indexes` and
  `Indexes`/`DirectorySlash`; `All`, as in the Apache check, covers it. mod_rewrite,
  mod_alias and mod_headers must be loaded. Nothing here is new: the existing rules
  already need all of it.
- `%{DOCUMENT_ROOT}` must be the build directory itself. The file tests build absolute
  paths from it. The existing `/foo/index.html` rules already depend on this, so if
  unpoly.com works today, it holds. It would break if the site were served through an
  `Alias` or a symlinked subdirectory of another DocumentRoot (then
  `%{CONTEXT_DOCUMENT_ROOT}` would be the variable to use, for all rules alike).
  Not verified against the production vhost: worth a look at its DocumentRoot before
  launch.
- `Options -Indexes` stays: it turns `/learn/start` (a directory without a page) into
  a 403 rather than a listing. That is old behavior, not something the rule adds.

## Launch day

Do this after the content is final, as the last change before the deploy. Paths assume
the two repositories are siblings (`unpoly`, `unpoly-site`).

1. Make sure both checkouts are clean and on `docs-rework`, and that `unpoly/dist` is
   built.

2. Bring the site side over. The dry-run branch was rebased onto the renamed
   `Unpoly::Site` code (977b8949); rebase it again onto the current `docs-rework` and
   resolve conflicts (in the dry run they were all spec paths next to renamed
   constants):

   ```sh
   cd unpoly-site
   git checkout -b url-move url-move-dryrun-2
   git rebase docs-rework
   ```

   The branch holds nine commits (`git log docs-rework..url-move-dryrun-2`): the model
   change, the script, the landing page and example links, two spec commits, the
   script's 2026-10-13 changes (permanent short URLs, comments only in `.js`), the
   general rule with the clash and legacy link checks, a spec commit, and
   `rake docs:check_redirects`. The script commit also contains the dry run's rewrite
   of `source/.htaccess.erb`'s redirect targets. If that conflicts, take the
   `docs-rework` side for the targets: the script rewrites them again in step 3. Spec
   and golden-file conflicts: take `docs-rework`, then fix the specs in step 5.

   After the rebase, `bundle exec rake docs:check_urls` lists every link to an old
   path in the site's templates (LEGACY LINKS, under `source/`). Link them with
   `doc_path('slug')` (plain JS files can't, so spell the new path there). The
   unpoly side is still unconverted at this point, so ignore its entries until step 3.

3. In unpoly, start a fresh branch from `docs-rework` (the dry run's script commit is
   not reused; it is regenerated from the final content). Then, in unpoly-site, run the
   script and read its summary:

   ```sh
   bundle exec rake docs:url_move            # DRY_RUN=1 first if you like, VERBOSE=1 lists every link
   bundle exec rake docs:url_move            # second run must say "0 in total" and "Files changed: 0"
   ```

   Check the summary's `href="/path"` list: each should be a real link, not an
   example (on 2026-10-18 it was empty: the chapter overviews use `[[more: ...]]` now).

4. In unpoly, cherry-pick the manual edits to the contributor docs (they explain the
   prefixes, and fix the table of URLs the script cannot reach):

   ```sh
   cd ../unpoly
   git cherry-pick <"[docs] Describe the /learn and /api URL prefixes in the documentation guide">
   ```

   Re-read it if `docs/contributing/documentation.md` changed since 2026-10-11. On
   2026-10-18 it applied cleanly, but needed two follow-ups (also on unpoly's
   `url-move-dryrun-2`, cherry-pick them too): its rename advice still named the
   generated `RedirectMatch` rule ("[docs] Explain that a renamed page also redirects
   its short path"), and its new code span `[label](/learn/caching#expiration)` broke
   `bin/self-test`'s contributor-link test ("[tooling] Don't resolve links into
   unpoly.com as contributor docs").

5. In unpoly-site, update the specs' expectations for new pages: run the suite (step 6)
   and change any literal `/slug` a new spec added to `/learn/slug` or `/api/slug`.
   Regenerate golden files with
   `UPDATE_GOLDEN=1 bundle exec rspec spec/features/markdown_twins_spec.rb` and read the
   diff: only URLs should change.

6. Checks (all in unpoly-site):

   ```sh
   bundle exec rake docs:check_urls     # "No lost URL", "No redirect chain", "No legacy link"
   bundle exec rspec
   bundle exec middleman build          # must print "No legacy link" and end with "All links OK."
   ```

   Then check the redirects against real Apache (see "Apache check" below): a few old
   symbols (`/up.render`, `/up-follow`, `/up:link:follow`, `/up.$compiler`), old
   guides (`/caching`, `/caching/`, `/start/overview`, `/start/links`), twins
   (`/up.render.md`), the permanent short URLs (`/install`, `/skill`), old aliases
   (`/tutorial`, `/cache`, `/install/rails`, `/layer-terminology`, `/failed-responses`),
   pages that stay (`/changes`, `/support`, `/learn`, `/api`, `/`) and an unknown path
   (404). Each old URL must answer 301 with the final page as Location, and that page
   200. Better, run the scripted pass over every old path and every redirect source.

7. Commit in both repos (`[docs] Link documents under /learn and /api` in unpoly),
   then deploy unpoly first (its `.htaccess` is included by the site's build) and the
   site right after, as usual. Order matters less than before: unpoly's `.htaccess`
   no longer holds the move's redirects, only retargeted renames.

8. After launch, `UrlCheck#old_page_paths` must learn that master serves pages under
   `/learn` and `/api`: it reads `@page` slugs from master and prefixes them with `/`
   only. Until then it checks the pre-move root paths, which stay right as long as the
   general rule exists.

### Apache check

The build's `.htaccess` can be tested with any Apache 2.4. In the dry run we used an
image that was already on the machine:

```sh
docker run --rm -d --name urlmove-apache -p 8089:8089 \
  -v $PWD/build:/srv/build:ro -v <dir with site.conf>:/etc/apache2/sites-enabled:ro \
  --entrypoint sh <apache image> -c 'a2enmod rewrite headers alias >/dev/null; echo > /etc/apache2/ports.conf; apache2ctl -D FOREGROUND'
curl -sI http://localhost:8089/up.render    # 301, Location: .../api/up.render
bundle exec rake docs:check_redirects BASE_URL=http://localhost:8089   # in unpoly-site
docker stop urlmove-apache
```

`rake docs:check_redirects` (`script/check_redirects.rb`) takes the server's base URL
and derives everything it expects from the site's model, so it needs the Unpoly
checkout the build used, nothing else. It checks every old document path as `/foo`,
`/foo/` and `/foo.md` (301 with an https Location of the final page, which answers
200), every hand-written redirect source (301 to its target, which answers 200),
`/install` and `/skill`, the root pages (`/`, `/learn`, `/api`, `/changes`, `/support`,
`/index.md`, `/llms.txt`, ...) for 200 and a random unknown path for 404. It follows a
Location by its path on the base URL, since Apache names the host it saw. Exits 1
and lists each problem. Takes 5 seconds for about 2,100 requests.

The site's CI runs this as the "Redirects" job (`.github/workflows/test.yml`): it builds
unpoly's `dist/` and the site (`bundle exec middleman build`, which also runs the link
check and the legacy link check), serves `build/` with the official `httpd:2.4` image
through `script/serve_build_with_apache start 8089` (it switches on mod_rewrite and sets
`AllowOverride All`), and runs `bundle exec rake docs:check_redirects
BASE_URL=http://localhost:8089`. The same two commands work locally.

with a `site.conf` that says `Listen 8089` and serves `/srv/build` in a
`<VirtualHost *:8089>` with `DocumentRoot /srv/build` and `AllowOverride All`. The
2026-10-18 run used `kenchan0130/simplesamlphp:latest` (Apache 2.4.57, Debian), which
has `a2enmod`. The rewrite rules answer `https://localhost:8089/...`, so follow a
redirect by its path, not its Location.

## Permanent short URLs

`/install` and `/skill` are printed on slides and in talks. They move to
`/learn/install` and `/learn/skill` like every other page, and the general rule keeps
the short URLs working. That rule is **permanent: never remove it**, and its comment
says so. Should either page be renamed, the rename's second line
(`RedirectPermanent /install /learn/new`) keeps the short URL: the script and
`rake docs:check_urls` fail when `/install` or `/skill` would not resolve. Browsers keep
the fragment across a redirect, so `/install#npm` lands on `/learn/install#npm`.
Our own links don't use the short URLs: the legacy link check wants `/learn/install`.
(Decision 27X, 2026-10-13.)

## Dry-run numbers (2026-10-11)

- 627 documents moved (83 to `/learn`, 544 to `/api`), 627 generated redirects.
- 3,277 links rewritten: 3,216 Markdown links, 45 `href`s (all "Read more" buttons),
  14 `https://unpoly.com/...` URLs, 2 `[[=base_url]]/...`.
- 154 hand-written redirects retargeted (11 in the site's `.htaccess.erb`, 143 in
  unpoly's), none left unresolved, no chain.
- `rake docs:check_urls`: 78 published addresses and 627 old document paths resolve,
  785 redirects take one hop.
- Real Apache 2.4 against the build: all 782 internal redirect sources answer 301 with a
  Location that answers 200.
- Replayed: after unpoly's `docs-rework` moved on, the dry run was redone by resetting
  the branch, running the script and cherry-picking the two manual commits. Both
  cherry-picks applied cleanly; the second script run changed nothing.
- Rerun 2026-10-13 with decisions 27X, 28X and 29A: 628 documents (84 to `/learn`,
  544 to `/api`), 3,295 links rewritten (the two error-message strings no longer, the
  README label now), 140 hand-written redirects retargeted, none shadowed, 177 files
  changed; the second run changed nothing. `rake docs:check_urls`: 78 published
  addresses and 628 old paths resolve, 786 redirects take one hop.

## Dry-run numbers (2026-10-18, general rule)

Branches `url-move-dryrun-2` in both repos, worktrees `~/Projects/urlmove2/unpoly` and
`~/Projects/urlmove2/unpoly-site` (the site finds unpoly through its tracked symlink
`vendor/unpoly-local -> ../../unpoly`, so the two worktrees sit side by side). The site
branch is `docs-rework` plus the six `url-move-dryrun` commits, cherry-picked: spec
files and golden files conflicted (taken from `docs-rework`, then fixed by running the
suite), `read-more.sass` was deleted on `docs-rework`, and the landing page's new
"Learn more" link took `doc_path`.

- 631 documents (88 to `/learn`, 543 to `/api`), all redirected by the general rule;
  no redirect generated.
- 3,318 links rewritten: 3,304 Markdown links, 11 `https://unpoly.com/...`, 2
  `[[=base_url]]/...`, 1 `unpoly.com/...` as text; no `href`. 144 hand-written
  redirects retargeted, 179 files changed in unpoly. The second run: 0 links, 0
  redirects, 0 files.
- `rake docs:check_urls`: 78 published addresses and 631 old document paths resolve,
  162 hand-written redirects lead to a page in one hop, no legacy link.
- Build: "No legacy link", 717 files link-checked, "All links OK."
- Specs: 106 of 647 failed at first, all path literals in specs that conflicted or
  were added since the first dry run; fixed with a script that maps literal old paths
  through the model, plus five by hand (`/formats` index, build file paths, a WebMCP
  error message). Then 650 examples, 0 failures (with the new legacy link and
  `.htaccess` specs).
- Real Apache 2.4.57 (`rake docs:check_redirects` and a one-off script agree): every old document path as `/foo`, `/foo/` and `/foo.md` (1,893
  requests) answers 301 with an https Location of its final page, which answers 200;
  all 162 hand-written redirect sources answer 301 to a 200 in one hop; 77 of the 78
  published addresses answer 200 or redirect to a 200 (`/examples` is a 403: it is a
  template, not a page, here and on master). `/nope-xyz` is a 404; `/learn`, `/api`,
  `/changes`, `/support`, `/` answer 200.
- Planted mistakes, each caught and then removed: a link
  `[up.render()](/up.render#options.target)` and `https://unpoly.com/caching` in a
  guide and `hyperlink 'Learn more', '/subinteractions'` in the landing page
  (check_urls, spec, build); `RedirectPermanent /caching ...` (SHADOWED, and the script
  aborts); a redirect to `/caching` and one to `/cache` (CHAINED), one to `/learn/nope`
  (DANGLING); a page slug under both prefixes, simulated by stubbing a guide's slug to
  `up.render` (Toc fails).

## Done (2026-10-18)

The move was made on the `docs-rework` branches of both repositories (not pushed at the
time of writing). The site side was cherry-picked from `url-move-dryrun-2` without
conflicts, plus a `doc_path` for the landing page's new closing section; in unpoly the
script ran fresh on the current content.

- 631 documents (88 to `/learn`, 543 to `/api`). 3,319 links rewritten (3,305 Markdown
  links, 11 `https://unpoly.com/...` including the two error messages, 2
  `[[=base_url]]`, 1 as text), 144 hand-written redirects retargeted, 181 files
  changed. The second run changed nothing.
- `rake docs:check_urls`: 78 published addresses and 631 old document paths resolve,
  162 hand-written redirects take one hop, no legacy link. Build: "No legacy link",
  717 files link-checked, "All links OK." `bin/self-test` and `bin/lint` pass.
- `rake docs:check_redirects` against Apache 2.4.57: 1,893 old-path variants, 2
  short URLs and 162 redirect sources in one hop to a 200, 10 root pages 200, an
  unknown path 404.

Left to do: deploy unpoly and the site right after each other (step 7), then step 8.

## Rollback

- Before deploy: drop the branches. Nothing else has changed.
- After deploy: redeploy the previous build of both repos. The old site serves root
  paths again; the new `/learn/...` and `/api/...` URLs then 404, which only matters for
  links made in the meantime. For a softer rollback, keep the new build and add
  reverse redirects instead of reverting.
- Never roll back only one repo: unpoly's `.htaccess` retargets its renames to
  `/learn/...` and `/api/...`, which only the new site build serves.

## Surprises from the dry run

- **Redirect order matters.** `RedirectPermanent` matches by path prefix, so the
  existing `RedirectPermanent /start /start/overview` would also catch `/start/links`
  and send it to `/start/overview/links`. The general rule runs before every
  `RedirectPermanent`, so `/start/links` goes to its page (see "Short paths").
- **Three-segment paths** (`/learn/start/overview`) needed nothing special: the rule
  captures `start/overview` whole.
- **`$` in paths.** `/up.$compiler` goes to `/api/up.$compiler` unescaped: a captured
  `$1` is not read again. (The generated rules of the earlier dry runs had to escape it.)
- **Shadowed redirects.** `/up-href`, `/up.observe` and `/up.layer.context` were both a
  documented (deprecated) symbol and the source of a hand-written redirect. The
  document won, so the hand-written rules never fired. They are deleted on
  `docs-rework` (decision 29A, dafc7b416). The script now aborts on such a rule, and
  check_urls reports it as SHADOWED.
- **Trailing slash on a rename** (`/install/npm/`, `/a-up-dash/`): mod_alias appends
  what follows the prefix, so it answers `/learn/install#npm/` or `/api/up-dash/`, and
  the latter takes a second hop. Old behavior of every `RedirectPermanent`, not
  touched here; nobody links that way.
- **The site had hardcoded paths** the model did not reach: the landing page's "Get
  started" and "Learn more" links and its event diagram (`href="/<%= event %>"`), the
  search dialog's skill link, `/install#npm` and `/up.on` in `changes/upgrading`, the
  `root_index` (`/index.md`, `/llms.txt`) examples, the ai-tools corner's `/skill`, the
  transition example's Markdown, the WebMCP skill tip in `webmcp.js` (a full
  `https://unpoly.com/skill.md`), and the header's `up-alias` patterns
  (`/up.* /up:* /up-*`), now simply `/learn/*` and `/api/*`. The first build after the
  model change found the rest as 25 broken links.
- **Skill file names** were derived from the path; they now drop the `/learn`, `/api`
  and `/changes` prefix, so the skill's files keep their names.
- **Link labels that spell a URL.** The script rewrites `unpoly.com/path` written as
  text, which only the README's `[unpoly.com/skill](...)` label does (now
  `unpoly.com/learn/skill`). The documentation guide's table labels are fixed by hand
  in the cherry-picked commit.
- **Old release notes** (`CHANGELOG_0.x`, `1.x`, `2.x`) get their links rewritten where
  the target still exists (decision 30A). Links to symbols that no longer exist
  (`/up.modal`, `/up.proxy`, ...) are left alone and listed as "Root paths left alone";
  those notes are not link-checked.
- **Library strings.** Two error messages in `src/unpoly/classes/change/` mention
  the error responses guide. Decision 28X kept their old URL, since the release might
  go out before the site moves. Superseded on 2026-10-18: unpoly and the site deploy
  minutes apart, so the messages say `https://unpoly.com/learn/error-responses`. The
  script rewrites full unpoly.com URLs in `.js` code (not other paths: `'/users'` in
  code is an app's URL), and the legacy link check covers them too.
- **Markdown twins of old paths** (`/up.render.md`) now take one hop to
  `/api/up.render.md`. A twin of a renamed page (`/failed-responses.md`) still takes
  two (`.md` fallback, then the rename). No `.md` URL was ever public before this
  release.
- **Locations are http://** for the hand-written `RedirectPermanent` rules: mod_alias
  builds its Location from what Apache sees behind the TLS proxy, so it says
  `http://unpoly.com/...`. Decided 2026-10-18: leave them, HSTS upgrades them in
  browsers (see the plan's ops note). The one-line nginx `proxy_redirect` fix would
  clean it up if ever wanted. The general rule names https itself, so the 631 old
  document paths are not affected. `spec/features/htaccess_spec.rb` demands https only
  of RewriteRules.
- **Specs.** About 400 path literals in the site's specs, the parser fixture
  `spec/fixtures/parser/markdown.md` and the golden Markdown files needed new paths. A
  relative-link spec (`../up.render` from a page) needed a real change, since pages now
  sit one level deeper.

## Kept at the root

Not documents, so they stay where they are: `/` (landing), `/learn` and `/api` (hubs),
`/learn/menu` and `/api/menu`, `/changes` and `/changes/*` (including
`/changes/upgrading`), `/support`, `/imprint`, `/privacy`, `/version_choice`,
`/menu/narrow`, `/index.md`, `/llms.txt`, `/skills/...`, `/agent-skills/...`,
`/.well-known/agent-skills/...`, `/claude-plugins/...`, `/pagefind/...`, `/images/...`,
`/examples/...`, `robots.txt`, and the assets. The `/install` page is a Learn page and
moves to `/learn/install`; `/skill` moves to `/learn/skill`. Both keep permanent
redirects (see "Permanent short URLs").

The site has no sitemap and no canonical URLs, so there was nothing to adjust there.
