# Rendering core deep-dive

> **Work in progress.** This guide orients you in the rendering core; it does not cover
> every branch. When it runs out, read the classes it points at — they are commented.

Almost every Unpoly feature ends up calling `up.render()`. Following a link, submitting a
form, polling, preloading, opening an overlay: all of it funnels through here. That makes
this the subsystem where a small change has the widest blast radius.


## Why it is intricate

A render pass has to survive a lot of uncertainty:

- The target may match **several elements**, in **several layers**, or none.
- The response may not contain the target we asked for, so we fall back.
- `[up-hungry]` elements join a pass they were never targeted by — possibly on another layer.
- One response may update a fragment, open a layer *and* close another.
- A cached response can render immediately and then **render a second time** after revalidation.
- The user keeps interacting while a request is in flight, so passes abort each other.
- The network fails, or answers with an error status that we must render into a *different* target.

Most of the complexity is not the DOM swap. It is deciding *what* to swap before and after
the response arrives.


## The path through the code

`up.render()` returns an [`up.RenderJob`](../../src/unpoly/classes/render_job.js) — the
promise-like object callers await. It resolves with an `up.RenderResult` describing what
was actually updated, and exposes a second promise, `.finished`, that waits for animations
and revalidation to settle too.

The job picks one *change* from where the content comes from
(`up.RenderJob#_getChange()`):

| option | change class |
|---|---|
| `{ url }` | `up.Change.FromURL` — makes the request, then hands the response on |
| `{ response }` | `up.Change.FromResponse` |
| local content (`{ fragment }`, `{ content }`, `{ document }`) | `up.Change.FromContent` |

The classes live in [`src/unpoly/classes/change/`](../../src/unpoly/classes/change/) and all
extend `up.Change`, whose contract is a single `execute()`.


## Plans, and why a pass can change its mind

`up.Change.FromContent` does the negotiating. It expands the options into a list of
**plans** — one per layer per target — first for `{ target }`, then for `{ fallback }`:

```
{ target: '.content', fallback: 'main', layer: 'current' }
  → plan 1: update '.content' in the current layer
  → plan 2: update 'main' in the current layer
```

It then tries each plan in turn. A plan that cannot find its element throws
`up.CannotMatch`, which is the signal to try the next one; any other error aborts the pass.
When a fallback wins, Unpoly logs it — that log line is usually the fastest way to
understand a surprising update:

```
[up.render()] Could not match primary target ".content". Updating a fallback target "main".
```

Each plan is itself a change: `up.Change.UpdateLayer`, `OpenLayer`, or `CloseLayer`.


## Steps, and matching twice

`up.Change.UpdateLayer` parses its target into **steps** — one per element to replace,
carrying the old element, the new element and a placement (`swap`, `content`, `before`, …).
Because a comma-separated target updates several fragments as one atomic pass, steps are
the unit that later code works with, not selectors.

Matching happens **twice**, and this is the distinction worth internalising:

- **Preflight**, before there is a response: which old elements exist? This decides what to
  request, which requests to abort, and whether the plan is viable at all.
- **Postflight**, against the response document: which new elements did the server actually
  send? Steps whose new element is missing are dropped or fail here.

`up.Change.UpdateSteps` then performs the swaps. `up.Change.Addition` is the base class for
everything that inserts content, and carries the concerns that outlive the swap: honouring
a server's request to accept or dismiss a layer, and stamping each new fragment with the
`[up-source]`, `[up-time]` and `[up-etag]` attributes that later reloads and revalidation
depend on.


## Working here

- **Read the log.** `up.log.enable()` in the console, or `--verbose` in the terminal
  runner, exposes the plan and fallback decisions described above.
- **Specs are split by option.** `up.render()`'s specs span more than a dozen files —
  `fragment_render_url_spec.js`, `fragment_render_history_spec.js`, and so on. Use
  `bin/find-spec "up.render()"` to list them, and see
  [Testing](testing.md#finding-the-spec-for-a-feature).
- **Expect to touch two layers of abstraction.** A bug in "what gets updated" usually lives
  in `FromContent` (plans) or `UpdateLayer` (steps); a bug in "how it gets updated" lives in
  `UpdateSteps` or `Addition`.
