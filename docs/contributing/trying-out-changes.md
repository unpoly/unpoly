# Trying out changes

Specs are how a change is proven. But some things you need to *see*: how an overlay looks,
what a form does across three validation roundtrips, how Unpoly behaves during a real
navigation with a real server on the other end. The [spec suite mocks the network
unconditionally](testing.md#the-network-is-always-mocked), so it cannot show you any of that.

For those, the dev environment serves a **scratch server** on
[http://localhost:4001](http://localhost:4001): a handful of real pages, built from the
`dist/` bundle you are currently editing. It is a workbench, not a second test suite —
whatever you learn there belongs in a spec afterwards.

**Everything under `tooling/scratch` is yours to change for the duration of your work.** The
pages, the layout, the stylesheet, the scripts: edit them, break them, delete them. Nothing
else in the repository depends on any of it, and no test reads these pages — they are examples,
not fixtures. Put it back when you are done ([below](#putting-it-back)).


## Starting it

[`bin/dev`](dev-environment.md#running-the-dev-environment) boots it along with the build
watcher and the spec server. Nothing else to run, and no separate checkout — it lives in
this repository under `tooling/scratch`.

`http://localhost:4001` lists every page that exists, and says which files back each one.

**Page requests wait for the build.** If you edit `src/unpoly/link.js` and reload a scratch
page, the request blocks until webpack has finished, so you never look at the previous build
and conclude your change did nothing. If the build is *broken*, the page shows you the
compile errors instead — file, line and all.


## The pages that ship

These exist to be copied and to demonstrate the idioms. They are not load-bearing — edit or
delete any of them while you work.

| URL | What it is for |
|-----|----------------|
| `/navigation-one`, `/navigation-two` | Following links, history, `.up-current` |
| `/overlay-opener` | Opening `/overlay-content` as a modal, drawer or popup |
| `/form` | A form that submits, fails with 422, and validates field by field |

That is the whole set, deliberately. Everything else you need, you write — and throw away.


## Writing a page

Drop a file into `tooling/scratch/pages`. The filename is the URL: `pages/my-thing.ejs`
serves `/my-thing`.

**A page is one directory listing.** `pages/` is flat, so every page reaches the helpers by
the same relative path and you can write one by copying its neighbour.

### `.ejs` — markup

A body fragment, not a whole document. The layout wraps it, loading `unpoly.js`,
`unpoly.css` and the scratch stylesheet:

```html
<h1>My thing</h1>
<a href="/navigation-two" up-follow>Follow me</a>
```

The layout gives you a `<main>` element, which matches `up.fragment.config.mainTargets` — so
an `[up-follow]` link with no `[up-target]` replaces the page content and nothing else.

It is [EJS](https://ejs.co/), and `req` is in scope, which is how a page echoes a request:

```html
<p>You searched for <%= req.query.q %></p>
```

Need your own `<head>`? Write a whole document and it is served untouched — that is how you
test `[up-boot=manual]`, a CSP `<meta>`, or a deliberately broken script order.

### Setup goes in `assets/scripts.js`, not in the page

A `<script>` inside a page **re-runs every time that page's fragment is updated**, because the
script is part of the fragment. Unpoly runs scripts in new fragments by default
(`up.script.config.scriptElementPolicy`), and its own guide warns about this: see
[legacy scripts](/legacy-scripts). What it costs:

- a `customElements.define()` throws on the second render — `Identifier 'X' has already been
  declared`, misleadingly, since the render itself succeeds
- an `up.compiler()` registers *again*, so the same element is compiled twice, then three
  times, with handlers bound as many. That one fails silently and looks exactly like a bug in
  the code you are testing.

So one-time setup — a compiler, a custom element, a singleton, a config change — goes in
`assets/scripts.js`. It is loaded in `<head>` after `unpoly.js` and before Unpoly boots, so
compilers registered there apply to the initial page. Stylesheet equivalent:
`assets/styles.css`. Both are ordinary tracked files that you are free to edit, and both are
already loaded by the layout.

A `<script>` in the page is right only for something that is *meant* to run per fragment.

### `.mjs` — a request handler

When a page needs to read parameters, set a header, return a status code or redirect, add an
`.mjs` beside it. It exports Express handlers, one per method:

```js
import { layout } from '../helpers/layout.mjs'
import { view } from '../helpers/view.mjs'

export const get = (req, res) => res.send(layout(view('my-thing', { req })))

export const post = (req, res) => {
  res.set('X-Up-Accept-Layer', 'null').redirect('/my-thing')
}
```

`view('my-thing', locals)` renders `pages/my-thing.ejs` and `layout()` wraps it. Any page's
name works, so sharing markup between two pages is the same call. **The `.mjs` wins when both
files exist** and renders the view itself, so a static page becomes a dynamic one by dropping
a handler beside it — the markup never moves.

Look at `pages/form.mjs` for the shape worth copying: `blankUser()`, `userFromRequest()` and
`validateUser()` kept apart from the two handlers, so what the page *does* stays legible.

Two helpers, both in `tooling/scratch/helpers`, and neither touches `req` or `res`: they load
files and build strings. Every response decision stays visible in your page.

### Putting it back

Nothing here is gitignored, so `git status` tells you what you touched — which is the point:
leftovers stay visible instead of silently accumulating. When you are done, two steps, because
the obvious one is incomplete:

```
git restore tooling/scratch/          # undo your edits to the files that ship
git status                            # anything you *added* is still here
```

`git restore` only reverts tracked files, so pages you created survive it and keep showing up
at `/`. Remove those yourself, or `git clean -fd tooling/scratch/` — which deletes files, so
look at `git status` first.

Take care not to sweep scratch edits into an unrelated commit: `git add -A` will pick them up.


## Driving it

Use whatever you like — [Puppeteer](https://pptr.dev/) is already a dev dependency of this
repository, [Playwright](https://playwright.dev/) works just as well, and a browser MCP
server pointed at `http://localhost:4001` needs no code at all. There is no project-specific
driving API to learn.

Three things are set up so you can *see* what happened:

**Unpoly's log is on.** `assets/scripts.js` sets `up.log.config.enabled`, so Unpoly
narrates each render, target match, layer change and request to the console — in its own
vocabulary, which beats anything we could invent. Read it with `page.on('console')`, with a
browser tool's console view, or with devtools open.

**The server logs the protocol conversation.** Each request appears in
[`tmp/dev.log`](dev-environment.md#logs) with the view it rendered, the status, and the
`X-Up-*` headers in both directions — which for Unpoly is most of what you want to know:

```
10:11:55.416 scratch | POST /form → form.mjs 422 | in x-up-validate=email x-up-target=fieldset
10:11:55.427 scratch | GET /nope 404
```

Because it is the server talking, this works no matter how you drive the browser:

```
grep -E '^[0-9:.]+ scratch ' tmp/dev.log
```

**`curl` still works.** `curl localhost:4001/form` runs no JavaScript, so it proves nothing
about Unpoly — but it confirms the server is up, the build gate passed, and the page renders.
A good first move when something looks broken.


## When something looks wrong

- **The page is inert, no Unpoly at all.** Look at the response: a broken build renders the
  compile errors, and a missing watcher tells you to run `bin/dev`.
- **`Identifier 'X' has already been declared`, or a compiler that runs more than once per
  element.** A `<script>` inside the replaced fragment re-runs on every update. Move it to
  `assets/scripts.js`.
- **An edited page still behaves like the old one.** Page modules are re-imported on every
  request, so that should not happen — but the *helpers* are cached for the life of the
  process. Restart the environment after changing `tooling/scratch/helpers`.
- **A template error** names its file and line (`pages/form.ejs:12`), in the page and in the
  log.

See [Testing](testing.md) for turning what you found into a spec, and
[Setting up a dev environment](dev-environment.md) for the environment as a whole.
