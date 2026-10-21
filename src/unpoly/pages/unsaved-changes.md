Preventing loss of unsaved changes
==================================

When a user has changed a form but not yet saved it, one click on the wrong link can throw away their work.
A small compiler can ask the user before that happens, both on the page and in overlays.

The pattern on this page is deliberately simple. It covers the common ways of leaving a form,
and lists the cases it misses under [known gaps](#known-gaps).


The compiler {#compiler}
------------

Give every form that should ask before discarding changes a `[confirm-unsaved]` attribute:

```html
<form method="post" action="/projects/5" confirm-unsaved> <!-- mark: confirm-unsaved -->
  <input type="text" name="name">
  <button type="submit">Save</button>
</form>
```

The attribute is not part of Unpoly. It is a hook for this [compiler](/learn/enhancing-elements):

```js
up.compiler('form[confirm-unsaved]', (form) => {
  let dirty = false
  let layer = up.layer.get(form)

  function confirmLeave(event) {
    if (dirty && !confirm('Discard unsaved changes?')) event.preventDefault()
  }

  return [
    // Any change makes the form dirty, saving it makes it clean.
    up.watch(form, () => dirty = true),
    up.on(form, 'up:form:submit', () => dirty = false),

    // Links in the form's layer, except links that open an overlay on top.
    layer.on('up:link:follow', 'a:not([up-layer~=new])', confirmLeave),

    // The overlay's own close controls: X button, Escape, backdrop.
    layer.on('up:layer:dismiss', (event) => {
      if ([':button', ':key', ':outside'].includes(event.value)) confirmLeave(event)
    }),

    // Reloading the page or closing the tab.
    up.on(window, 'beforeunload', (event) => { if (dirty) event.preventDefault() }),
  ]
})
```

Each function that registers a listener returns a function that removes it again.
The compiler returns them all, so Unpoly [cleans up](/learn/enhancing-elements#destructor) when the form is removed.


Tracking changes {#tracking}
----------------

`up.watch()` runs its callback when the user changes a field in the form. The first change sets
the `dirty` flag. The compiler doesn't compare the current values with the original ones, so a user
who types a character and deletes it again is still asked. That keeps the code short, and asking once
too often is cheaper than losing work.

When the form is submitted, it emits `up:form:submit`, and the flag is cleared because the changes are on
their way to the server. [Validating](/learn/validation) a field emits `up:form:validate` instead. Nothing
was saved, so the form stays dirty.


Asking before following a link {#links}
------------------------------

Following a link emits a preventable `up:link:follow` event. The compiler listens with `up.Layer#on()`,
so it only hears links in the form's own layer. A link in an overlay on top of the form doesn't ask.

Links that open a new overlay are skipped, since the form stays where it is, beneath the new overlay.
The selector `[up-layer~=new]` matches every [`[up-layer]`](/learn/targeting-other-layers) value that contains the word
`new`, like `new` or `new modal`. Other values like `swap`, `shatter`, `parent` or `root` still ask,
because these links close the form's overlay or replace its content.


Asking before closing an overlay {#overlays}
--------------------------------

When the form is in an overlay, the user can close the overlay with its own controls.
Each control dismisses the overlay with a [dismissal value](/learn/closing-overlays#dismissal-values):
`":button"` for the `×` button, `":key"` for the Escape key and `":outside"` for a click on the backdrop.
When the user closes the overlay this way, nothing has happened yet, so preventing the dismissal keeps
everything as it was.

The compiler ignores other dismissal values. When the user follows a link in the overlay that targets a
parent layer, they are asked when the link is followed. Once the server responds, the overlay is
[peeled](/learn/closing-overlays#peeling) with a value of `":peel"`. A listener cannot prevent this, since the
server has already processed the request. A successful save that updates a parent layer works the same way,
but its submission has already cleared the flag.


Asking before leaving the page {#leaving-the-page}
------------------------------

Reloading the page, closing the browser tab or following a link that Unpoly doesn't handle all leave the page.
For these, the browser emits a `beforeunload` event on the `window`. Preventing it makes the browser ask the user
whether to leave. Browsers show their own generic text and ignore any message you provide.


Known gaps {#known-gaps}
----------

The compiler only sees links, the overlay's own close controls and the browser leaving the page.
It does not handle these cases:

- Links that only update another part of the page, like a sidebar, ask even though the form stays.
- Submitting another form in the same layer doesn't ask. See [Extending the pattern](#extending).
- Rendering from JavaScript with `up.navigate()` or `up.render()` doesn't ask, and neither does a [polling](/learn/polling) fragment that contains the form.
- Your own `[up-dismiss]` buttons don't ask, unless you give them a value. See [Extending the pattern](#extending).
- The Back button doesn't ask. Going back [closes all overlays](/learn/history-in-overlays#restoration) and restores an earlier page.
- An overlay that is closed by the server or by a [close condition](/learn/subinteractions#close-conditions) doesn't ask.
- A link in an overlay on top of the form that updates the form's layer doesn't ask.
- A form that the server renders again, e.g. after a failed save, starts out clean. See [Extending the pattern](#extending).


Extending the pattern {#extending}
---------------------

Each of these additions changes a line or two in the compiler above.

To keep a form dirty after a failed save, accept the compiler's third argument and read its
[`meta.ok`](/learn/enhancing-elements#meta) property. It is `false` when the form was rendered from an
[error response](/learn/error-responses):

```js
up.compiler('form[confirm-unsaved]', (form, data, meta) => { // mark: meta
  let dirty = meta.ok === false // mark-line
```

To ask before your own cancel buttons close the overlay, give them a dismissal value and add it to the list:

```html
<button up-dismiss="'cancel'">Cancel</button> <!-- mark: 'cancel' -->
```

```js
if ([':button', ':key', ':outside', 'cancel'].includes(event.value)) confirmLeave(event) // mark: 'cancel'
```

To ask before another form in the same layer is submitted, listen to `up:form:submit` on the layer and skip the form itself:

```js
layer.on('up:form:submit', (event) => {
  if (event.form !== form) confirmLeave(event)
}),
```


@page unsaved-changes
@menu-title Unsaved changes
