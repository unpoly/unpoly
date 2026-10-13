# URL move runbook

Moves guide pages from `/caching` to `/learn/caching` and API symbols from `/up.render`
to `/api/up.render`. Old root URLs keep working through redirects. Rehearsed as a dry run
on 2026-10-11 and again on 2026-10-13 in throwaway worktrees (branches `url-move-dryrun`
in both repos, pushed); nothing from those runs is merged.

The script lives only on unpoly-site's `url-move-dryrun` branch (commit "Add the URL
move script"), so changes to it go there; launch day rebases that branch.

## What does what

Two kinds of change, handled differently:

- **The site decides where documents live.** In unpoly-site, `Documentable#guide_path`
  prefixes every path: API symbols get `/api`, pages get the path of the `toc.yml` area
  that lists them (`/learn`, or `/api` for `url-patterns`, `relaxed-json` and the
  generated `/api/formats` index). Everything that links by slug follows by itself:
  `[[wikilinks]]`, `@learn-ref`, `toc.yml`, backtick autolinks, menus, hubs, reading
  nav, search (Pagefind indexes the built paths), Markdown twins, the skill. Templates
  link documents through a new `doc_path('slug')` helper instead of spelling paths.
  This is ordinary site code, in the commits on unpoly-site `url-move-dryrun`.
- **The script handles what is written as a URL.** `script/url_move.rb` in unpoly-site
  (`bundle exec rake docs:url_move`) loads the site's model and, in `../unpoly`:
  - rewrites `[label](/path)` and `href="/path"` outside code blocks and code spans,
    and `[[=base_url]]/path`, `https://unpoly.com/path` and `unpoly.com/path` spelled
    out as text (the README's link label) everywhere. In `.js` files it rewrites only
    comments: URLs in strings (two error messages) ship with the release before the
    site moves, and the old URL redirects anyway. Only paths of
    documents are touched; `/changes/...`, `/support`, `/images/...`, unknown paths and
    anchor-only links are left alone. Files: `src/**`, `docs/changes/*.md`, `README.md`,
    `CHANGELOG.md`, plus `docs/contributing/*.md`, `dist/README.md`, `dist/CHANGELOG.md`
    and `.github/**/*.yml`, where it also rewrites inside code (they show the syntax).
  - writes one exact redirect per old document path at the top of
    `src/unpoly-migrate/.htaccess`, between `# BEGIN URL MOVE` and `# END URL MOVE`:
    `RedirectMatch 301 ^/up\.render/?$ /api/up.render`. Every document that moves gets
    one, and `rake docs:check_urls` fails if one is missing.
  - lists the rules for `/install` and `/skill` first in that block, under a comment
    that marks them as permanent (see "Permanent short URLs"), and aborts if either
    would go missing.
  - retargets every hand-written `RedirectPermanent` (in that file and in the site's
    `source/.htaccess.erb`) to its final page, following chains, so each old URL takes
    one hop.
  - aborts when the site side is missing, when an old path is still served by the site,
    or when a redirect leads nowhere. Running it twice changes nothing.

`rake docs:check_urls` now also fails when a document's old root path has no redirect,
and when a redirect points to another redirect.

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
   git checkout -b url-move url-move-dryrun
   git rebase docs-rework
   ```

   The branch holds six commits (`git log docs-rework..url-move-dryrun`): the model
   change, the script, the landing page and example links, two spec commits, and the
   script's 2026-10-13 changes (permanent short URLs, comments only in `.js`). The
   script commit also contains the dry run's rewrite of `source/.htaccess.erb`. If that
   conflicts, take the `docs-rework` side: the script rewrites it again in step 3.

   After the rebase, grep the site for paths added since the dry run, which the model can't
   reach: `grep -rnE "(href=|hyperlink|link_to).*['\"]/[a-z]" source examples` and look
   for documents, and `grep -rn "unpoly.com/" source` for full URLs. Link them with
   `doc_path('slug')` (plain JS files can't, so spell the new path there).

3. In unpoly, start a fresh branch from `docs-rework` (the dry run's script commit is
   not reused; it is regenerated from the final content). Then, in unpoly-site, run the
   script and read its summary:

   ```sh
   bundle exec rake docs:url_move            # DRY_RUN=1 first if you like, VERBOSE=1 lists every link
   bundle exec rake docs:url_move            # second run must say "0 in total" and "Files changed: 0"
   ```

   Check the summary's `href="/path"` list: each should be a real link (in the dry
   run, all 45 were the "Read more" buttons of chapter overviews), not an example.

4. In unpoly, cherry-pick the manual edits to the contributor docs (they explain the
   prefixes, and fix the table of URLs the script cannot reach):

   ```sh
   cd ../unpoly
   git cherry-pick <"[docs] Describe the /learn and /api URL prefixes in the documentation guide">
   ```

   Re-read it if `docs/contributing/documentation.md` changed since 2026-10-11.

5. In unpoly-site, update the specs' expectations for new pages: run the suite (step 6)
   and change any literal `/slug` a new spec added to `/learn/slug` or `/api/slug`.
   Regenerate golden files with
   `UPDATE_GOLDEN=1 bundle exec rspec spec/features/markdown_twins_spec.rb` and read the
   diff: only URLs should change.

6. Checks (all in unpoly-site):

   ```sh
   bundle exec rake docs:check_urls     # "No lost URL" and "No redirect chain"
   bundle exec rspec
   bundle exec middleman build          # must end with "All links OK."
   ```

   Then spot-check redirects against real Apache (see "Apache check" below): a few old
   symbols (`/up.render`, `/up-follow`, `/up:link:follow`, `/up.$compiler`), old
   guides (`/caching`, `/start/overview`, `/start/links`), the permanent short URLs
   (`/install`, `/skill`), old aliases (`/tutorial`,
   `/cache`, `/install/rails`, `/layer-terminology`), and pages that stay
   (`/changes`, `/support`, `/learn`, `/api`). Each old URL must answer 301 with the
   final page as Location, and that page 200.

7. Commit in both repos (`[docs] Link documents under /learn and /api, redirect their
   old paths` in unpoly), then deploy unpoly first (its `.htaccess` is included by the
   site's build) and the site right after, as usual.

### Apache check

The build's `.htaccess` can be tested with any Apache 2.4. In the dry run we used an
image that was already on the machine:

```sh
docker run --rm -d --name urlmove-apache -p 8089:8089 \
  -v $PWD/build:/srv/build:ro -v <dir with site.conf>:/etc/apache2/sites-enabled:ro \
  --entrypoint sh <apache image> -c 'a2enmod rewrite headers alias >/dev/null; echo > /etc/apache2/ports.conf; apache2ctl -D FOREGROUND'
curl -sI http://localhost:8089/up.render    # 301, Location: .../api/up.render
docker stop urlmove-apache
```

with a `site.conf` that says `Listen 8089` and serves `/srv/build` in a
`<VirtualHost *:8089>` with `AllowOverride All`.

## Permanent short URLs

`/install` and `/skill` are printed on slides and in talks. They move to
`/learn/install` and `/learn/skill` like every other page, and their redirects are
**permanent: never remove them**, even if the other old paths are retired one day.
Browsers keep the fragment across a redirect, so `/install#npm` lands on
`/learn/install#npm`. (Decision 27X, 2026-10-13.)

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

## Rollback

- Before deploy: drop the branches. Nothing else has changed.
- After deploy: redeploy the previous build of both repos. The old site serves root
  paths again; the new `/learn/...` and `/api/...` URLs then 404, which only matters for
  links made in the meantime. For a softer rollback, keep the new build and add
  reverse redirects instead of reverting.
- Never roll back only one repo: the generated redirects live in unpoly's `.htaccess`,
  the pages that receive them in the site build.

## Surprises from the dry run

- **Redirect order matters.** `RedirectPermanent` matches by path prefix, so the
  existing `RedirectPermanent /start /start/overview` would also catch `/start/links`
  and send it to `/start/overview/links`. The generated rules are exact matches
  (`RedirectMatch ... ^/path/?$`) and sit above the hand-written ones, so they win.
  Don't turn them into `RedirectPermanent`.
- **Three-segment paths** (`/learn/start/overview`) needed nothing special: slugs with a
  slash already worked, and the old `/start/overview` gets its own exact rule.
- **`$` in paths.** `up.$compiler` and `up.$macro` are escaped in the rule's pattern and
  target (`\$`), since Apache reads `$1` in a target as a backreference.
- **Shadowed redirects.** `/up-href`, `/up.observe` and `/up.layer.context` were both a
  documented (deprecated) symbol and the source of a hand-written redirect. The
  document won, so the hand-written rules never fired. They are deleted on
  `docs-rework` (decision 29A, dafc7b416), so the script's "Hand-written redirects
  from a path that is also a document" list is empty now. If it lists something
  again, delete that rule too.
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
  `https://unpoly.com/failed-responses`. The release goes out before the site moves,
  so a rewritten URL would 404 in between. The script leaves strings in `.js` files
  alone and rewrites only comments (decision 28X); the old URL redirects after the
  deploy.
- **Markdown twins of old paths** (`/up.render.md`) take two hops (`.md` rule, then the
  page's redirect). No `.md` URL was ever public before this release, so nothing old
  is affected.
- **Locations are http://.** Like the existing `RedirectPermanent` rules, the
  generated rules build their Location from what Apache sees behind the TLS proxy, so
  it says `http://unpoly.com/api/...`. HSTS upgrades it in browsers (see the plan's
  ops note); the one-line nginx `proxy_redirect` fix would clean it up for all rules.
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
