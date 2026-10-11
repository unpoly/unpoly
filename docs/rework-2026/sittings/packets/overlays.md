# Sitting packet: Overlays chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: C4-C8 (triage "Henning's answers"). Deferred duplication items carried here:
B10 (/overlays), B11 and B12 (/opening-overlays), C13 (/customizing-overlays, other side on /animation).

| Page | Pointers |
|------|----------|
| overlays | 2 |
| opening-overlays | 2 |
| closing-overlays | 2 |
| subinteractions | 2 |
| customizing-overlays | 1 |
| layer-option | 0 |
| context | 0 |
| history-in-overlays | 0 |


## Overlays (`/overlays`, 149 lines)

Chapter overview: opening an overlay, layer isolation, modes, closing with a result, subinteractions, appearance.

**Changed since writing**
- 87aa4d99c (C4): "Closing with a result" now shows the family of ways to close (dismiss controls,
  `[up-accept]`, close conditions, JS and server). The close-condition example moved to the Subinteractions teaser.

### 1. Per-mode config lines repeat /customizing-overlays (B10)

> You can change the default mode in `up.layer.config.mode`.
> Defaults for each mode are configured in `up.layer.config`,
> like `up.layer.config.drawer` for drawers or `up.layer.config.overlay` for all overlays.

(overlays.md:72-74)

> Defaults for all overlays live in `up.layer.config.overlay`. Each mode has its own
> defaults in `up.layer.config.modal`, `up.layer.config.drawer`, `up.layer.config.popup` and `up.layer.config.cover`.

(customizing-overlays.md:16-17)

Same fact, nearly the same words, on two pages. /customizing-overlays#modes owns per-mode config. (Pattern 5)

- **A.** Keep only the `up.layer.config.mode` line on the overview.
- **B.** Drop all three lines (opening-overlays.md:60 also has the `config.mode` line).

**Lean: A (strong).** Draft for overlays.md:72-74:

```md
You can change the default mode in `up.layer.config.mode`.
```

### 2. Subinteractions teaser is a literal copy of the detail page's example

> ```html
> <select name="company">...</select>
>
> <a href="/companies/new"
>   up-layer="new"
>   up-accept-location="/companies/$id"
>   up-on-accepted="up.validate('select', { params: { company: value.id } })">
>   New company
> </a>
> ```

(overlays.md:106-115, identical to subinteractions.md:138-147 "Adding options to an existing select")

Literal copy (Pattern 5). But the overview got this example yesterday on purpose (C4: "Subinteractions
owns the close-condition example"), and it is the chapter's best showcase. The detail page adds the
`up.validate()` explanation, so a reader learns something on both visits.

- **A.** Leave both. A teaser showing the flagship example is fine.
- **B.** Overview keeps it; subinteractions.md drops its copy and says "As shown in the [overview](/overlays#subinteractions), …" before explaining `up.validate()`.

**Lean: A (medium).** No change.


## Opening overlays (`/opening-overlays`, 208 lines)

All ways to open an overlay: link, form, local content, JavaScript, server; plus modes and replacing overlays.

**Changed since writing**
- 80a66154a (C5): #link re-angled to the mechanics (`X-Up-Mode` header). The overview keeps the progressive-enhancement paragraphs.
- 37c4ab32d (A32, A33): two sentences at the end of #link. An error response renders in the link's own layer
  (use `[up-fail-layer=new]`), and a second overlay link clicked while the first loads opens only the second.

### 1. The modes table is included twice in the chapter (B12)

> These modes are available:
>
> @include overlay-modes-table

(opening-overlays.md:56-58)

> The root layer's mode is always `root`. For overlays, these modes are available:
>
> @include overlay-modes-table

(overlays.md:61-63)

The same table on two pages. The overview owns it, and #modes already links there in its first
sentence ("To use a different [mode](/overlays#layer-modes)"). (Pattern 5)

- **A.** Drop the table and its lead-in line here.
- **B.** Keep both.

**Lean: A (strong).** Draft: delete opening-overlays.md:56-59. The section then reads:

```md
As a shorthand, you can append the mode to the `[up-layer=new]` attribute:

(example)

You can change the default mode in `up.layer.config.mode`.
```

### 2. "Close conditions" re-teaches /closing-overlays (B11)

> When opening an overlay, you can define a *condition* for when the overlay's task is done.
> When the condition occurs, the overlay closes automatically and a callback runs:
>
> (example with `up-accept-location="/users/$id"` and `up-on-accepted="up.reload('.user-list')"`)
>
> When the overlay reaches a URL like `/users/123`, it closes and the list behind it is reloaded.

(opening-overlays.md:180-192)

> When opening an overlay, you can define a *condition* for when the overlay's task is done.
> When the condition occurs, the overlay closes automatically and your callback runs.

(closing-overlays.md:141-142; the same reload example is subinteractions.md:50-61)

The opening sentence is a literal copy, and the example is the third copy of the reload-on-accept
pattern. Closing is /closing-overlays' job; this page only needs to say you set it when opening. (Pattern 1, 5)
No inbound links to `/opening-overlays#close-conditions` (grepped src/ and ../unpoly-site).

- **A.** Shrink to a pointer, keep the heading and anchor.
- **B.** Delete the section.

**Lean: A (strong).** Draft for opening-overlays.md:177-194:

```md
Close conditions {#close-conditions}
----------------

When opening an overlay, you can also define when its task is done, like when it reaches a URL.
The overlay then closes automatically. See [close conditions](/closing-overlays#close-conditions).
```


## Closing overlays (`/closing-overlays`, 518 lines)

Accepting vs. dismissing, result values, close conditions, closing from buttons, links, forms, JS and server, peeling, discarded responses, dismiss controls.

**Changed since writing**
- C6-C8 applied (d0b689e77, c367e9882, 11688811a): "keep an overlay open" paragraph with your
  form check + `confirm()` example; discarded responses point to the subinteractions example; "Close animation" keeps only the per-close override.
- 66716cbd6 + dfad2c0fd (new code): `[up-on-dismiss]` / `{ onDismiss }` pointer (lines 74-75). Peeling is now
  preventable: `event.value` is `":peel"` (lines 77-78), and `[up-peel="force"]` closes anyway (lines 410-411).
- 09db32d44 (A34, A35): location-condition value now includes `location`, and a validation error keeps
  the overlay open. A close also closes child overlays, aborts requests and returns focus.

### 1. `[up-on-dismiss]` vs. `[up-on-dismissed]` is never explained, and `[up-on-accept]` is missing

> To keep only one particular overlay open, pass an [`{ onDismiss }`](/up.layer.open#options.onDismiss) callback
> or set an [`[up-on-dismiss]`](/up-layer-new#up-on-dismiss) attribute on the opening link instead.

(closing-overlays.md:74-75)

The section above it teaches `[up-on-dismissed]`. A reader now sees two attributes one letter apart and
can't tell which is which. The page never says that `[up-on-dismiss]` runs *before* the close and
`[up-on-dismissed]` after (layer.js:615-646, :1085-1135). `{ onAccept }` / `[up-on-accept]`, which you asked to
document, appear nowhere in the guides (only in the reference). (Pattern 2)

- **A.** Say the difference in one sentence and name the accept pair.
- **B.** Leave it to the reference.

**Lean: A (strong).** Draft for closing-overlays.md:74-75:

```md
To keep only one particular overlay open, set an [`[up-on-dismiss]`](/up-layer-new#up-on-dismiss) attribute
on the opening link, or pass an [`{ onDismiss }`](/up.layer.open#options.onDismiss) callback, and call
`event.preventDefault()` in it. Unlike `[up-on-dismissed]`, it runs *before* the overlay closes.
For acceptance, use [`[up-on-accept]`](/up-layer-new#up-on-accept) or [`{ onAccept }`](/up.layer.open#options.onAccept).
```

### 2. Nothing says the Back button closes overlays even when a listener prevents it

> To keep an overlay open, for example when it has unsaved changes, prevent its
> [`up:layer:dismiss`](/up:layer:dismiss) event. This also blocks the Escape key, backdrop clicks
> and the close button:

(closing-overlays.md:61-63)

The expert's next question: "and the Back button?" Back closes all overlays by force: history.js:469
(`peel: 'force'`, comment "Since the browser has already changed the URL, listeners cannot prevent this").
The reference says so (layer.js:621-623, "no effect when … closed by force, e.g. when the user navigates back"),
the guide doesn't. The owner of Back behavior is history-in-overlays#restoration. (Pattern 2)

- **A.** One sentence after the onDismiss paragraph (after line 75), linking to the owner.
- **B.** Leave it to the reference.

**Lean: A (medium).** Draft, new paragraph after closing-overlays.md:75:

```md
No listener can keep an overlay open when the user presses the Back button, since
[going back](/history-in-overlays#restoration) closes all overlays.
```


## Subinteractions (`/subinteractions`, 218 lines)

The task pattern: open a screen in an overlay, wait for acceptance, continue with the result value.

**Changed since writing**
- 09db32d44 (A34): the location row of the result-value table now shows `{ id: 123, location: '/companies/123' }`.

### 1. Missed fix-round sentence: what if the company form has errors? (A34 leftover)

> When the user submits the company form and the server redirects to the new company's URL
> (like `/companies/123`), the overlay is accepted automatically. The callback then reloads
> the list behind the overlay.

(subinteractions.md:63-65)

A34 asked for "one sentence after 'accepted automatically'" here as well. Only the closing-overlays
half and the table row were applied (09db32d44). The reader's first question is what happens on a
validation error. The owner already says it (closing-overlays.md:170-172). (Pattern 2)

- **A.** Add the sentence with a link to the owner.
- **B.** Leave it to closing-overlays.

**Lean: A (strong).** Draft, append to subinteractions.md:65:

```md
When the company form has validation errors, it re-renders within the overlay, which stays open
until the company is created. See [closing when a location is reached](/closing-overlays#location-condition).
```

### 2. "Working with result values" copies the two snippets of closing-overlays#acceptance-values

> In an `[up-on-accepted]` attribute, the value is available as `value`:
> (link example with `up-on-accepted="console.log('Company ID is', value.id)"`)
>
> An `{ onAccepted }` callback receives it as `event.value`:
> (`up.layer.open({ …, onAccepted: (event) => console.log('Company ID is', event.value.id) })`)

(subinteractions.md:85-104)

> An `{ onAccepted }` callback receives the value as `event.value`:
> (`up.layer.open({ url: '/select-user', onAccepted: (event) => console.log('Got user', event.value) })`)
>
> In an `[up-on-accepted]` attribute, the value is available as `value`:
> (link example with `up-on-accepted="console.log('Got user', value)"`)

(closing-overlays.md:94-111)

Same two snippets, same sentences, different URLs. The table above them on subinteractions
("where the value comes from") is a real re-angle; the snippets are not. Closing-overlays owns the
result-value API, and the three examples below on this page already use `value`. (Pattern 5)

- **A.** Keep the table, replace the two snippets with one sentence.
- **B.** Keep the snippets here, cut them from closing-overlays.
- **C.** Leave both.

**Lean: A (medium).** Draft for subinteractions.md:85-104:

```md
An `[up-on-accepted]` attribute receives the value as `value`, an `{ onAccepted }` callback
as `event.value`. See [acceptance values](/closing-overlays#acceptance-values).
```


## Customizing overlays (`/customizing-overlays`, 240 lines)

Size, classes, popup and drawer position, open and close animations, CSS structure, adding elements.

**Changed since writing**
- Nothing on 2026-10-10/11. (7eafff276 on 2026-10-09 dropped the modes table.)

### 1. /animation copies the overlay animation example (C13, deferred duplication)

> To use different [animations](/animation) for one overlay, set `[up-animation]` and `[up-close-animation]`
> attributes on the link that opens it:
>
> `<a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-bottom">`

(customizing-overlays.md:137-144)

> When opening an overlay, `[up-animation]` sets the opening animation and `[up-close-animation]` the closing animation:
>
> `<a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-top">Details</a>`
>
> Each overlay mode also has its own default animations. To configure them, see [[customizing-overlays#animation]].

(animation.md:100-106)

Near-literal copy (only the close direction differs). This page owns overlay animations. /animation's
angle is "which kind of effect plays when" (transition for swaps, animation for single elements). (Pattern 5)

- **A.** On /animation, keep the sentence (it answers "which attribute for overlays?"), drop the code block.
- **B.** Drop the example here and point to /animation.
- **C.** Leave both.

**Lean: A (medium).** Draft for animation.md:100-106:

```md
When opening an overlay, `[up-animation]` sets the opening animation and `[up-close-animation]`
the closing animation. Each overlay mode has its own defaults. See [[customizing-overlays#animation]].
```


## Targeting other layers (`/layer-option`, 189 lines)

Addressing another layer with `[up-layer]` / `{ layer }`: names, defaults, multiple layers, index, objects, lookups, current vs. front, fail layer.

**Changed since writing**
- 37c4ab32d (B13): dropped the redundant `up-submit` from the form example.
- 120a6e909: page added to the search's signature tier.

No pointers. (Checked: `[up-layer]` implies follow/submit, link.js:25, form.js:158; events from a
background layer set `up.layer.current`, event.js:266-270; layer names match the table.)


## Layer context (`/context`, 151 lines)

Per-layer key/value state, set by the opener, readable and changeable from JS and the server.

**Changed since writing**
- 37c4ab32d (B4): Rails notes after both backend examples ("Other backends can read the `X-Up-Context`
  request header the same way", "Without `unpoly-rails`, set the `X-Up-Context` response header yourself").

No pointers. (Checked: `[up-context]` on a non-overlay link merges into the current layer's context,
update_layer.js:26, :128; server keys are merged with `Object.assign`, so `null` sets the key to `null`.)


## History in overlays (`/history-in-overlays`, 149 lines)

When an overlay's URL shows in the address bar, how to change that, and what Back does with overlays open.

**Changed since writing**
- 37c4ab32d (A36): an overlay opened by a `POST` response has invisible history while it is open, unless the server redirects.

No pointers. (Checked: invisible history is inherited and cannot be overridden, open_layer.js:216.
The Back-button / prevented-dismiss question is raised on closing-overlays, pointer 2, which links here.)
