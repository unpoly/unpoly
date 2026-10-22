Preventing loss of unsaved changes
==================================

When a user has changed a form but not yet saved it, one click on the wrong link can throw away their work.
A small compiler can ask the user before that happens, both on the page and in overlays.

The compiler on this page is deliberately simple. It covers the most common ways of leaving a form
with minimal code, and is easy to extend. Each section below explains one part of it, names the cases
that part leaves out, and shows how to cover them if your app needs it.

To ask before a single action instead, like deleting a record, see [[confirmation-dialogs]].


The compiler {#compiler}
------------

Give every form that should ask before discarding changes a `[confirm-unsaved]` attribute.
The form must be [submitted through Unpoly](/learn/submitting-forms), e.g. with an `[up-submit]` attribute:

```html
<form method="post" action="/projects/5" up-submit confirm-unsaved> <!-- mark: confirm-unsaved -->
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

The [compiler](#compiler) uses `up.watch()` to run a callback when the user changes a field in the form.
The first change sets the `dirty` flag. The compiler doesn't compare the current values with the original ones, so a user
who types a character and deletes it again is still asked. That keeps the code short, and asking once
too often is cheaper than losing work.

When the form is submitted, it emits `up:form:submit`, and the flag is cleared because the changes are on
their way to the server. [Validating](/learn/validation) a field emits `up:form:validate` instead. Nothing
was saved, and the validation only updates the field's [group](/learn/validation#form-groups), so the form stays dirty.

This leaves some cases out:

- A form that the server renders again starts out clean, since the compiler runs again for the new form.
  This happens after a failed save, or when a validation updates the entire form. A validation updates the entire form
  when a field has no group, so wrap your fields in an `[up-form-group]`, `<fieldset>` or `<label>`.
- Submitting clears the flag even when the changes don't reach the server, e.g. when the connection is lost,
  or when the user cancels an [`[up-confirm]`](/api/up-submit#up-confirm) dialog on the form.

To keep a form dirty when it was rendered from an [error response](/learn/error-responses),
read the compiler's [`meta.ok`](/learn/enhancing-elements#meta) argument:

```js
up.compiler('form[confirm-unsaved]', (form, data, meta) => { // mark: meta
  let dirty = meta.ok === false // mark-line
```


Asking before following a link {#links}
------------------------------

Following a link emits a preventable `up:link:follow` event. The [compiler](#compiler) listens with `up.Layer#on()`,
so it only hears links in the form's own layer.

Links that open a new overlay are skipped, since the form stays where it is, beneath the new overlay.
The selector `[up-layer~=new]` matches every [`[up-layer]`](/learn/targeting-other-layers) value that contains the word
`new`, like `new` or `new modal`. Other values like `swap`, `shatter`, `parent` or `root` still ask,
because these links close the form's overlay or replace its content.

This leaves some cases out:

- A link that only updates another part of the page, like a sidebar, asks even though the form stays.
- A link in an overlay on top of the form doesn't ask, even when it updates the form's layer.
- Rendering from JavaScript with `up.navigate()` or `up.render()` doesn't ask, and neither does a [polling](/learn/polling) fragment that contains the form.
- Submitting another form in the same layer doesn't ask.

To also ask before another form in the same layer is submitted, add this listener to the array the compiler returns.
It skips the form itself:

```js
layer.on('up:form:submit', (event) => {
  if (event.form !== form) confirmLeave(event)
}),
```


Asking before closing an overlay {#overlays}
--------------------------------

When the form is in an overlay, the [compiler](#compiler) asks before the user closes the overlay with its own controls.
Each control dismisses the overlay with a [dismissal value](/learn/closing-overlays#dismissal-values):
`":button"` for the `×` button, `":key"` for the Escape key and `":outside"` for a click on the backdrop.
When the user closes the overlay this way, nothing has happened yet, so preventing the dismissal keeps
everything as it was.

The compiler ignores other dismissal values. When the user follows a link in the overlay that targets a
parent layer, they are asked when the link is followed. When the parent layer is updated, the overlay is
[peeled](/learn/closing-overlays#peeling) with a value of `":peel"`. Listeners cannot prevent a peel,
so the user isn't asked a second time.

This leaves some cases out:

- The Back button doesn't ask. Going back [closes all overlays](/learn/history-in-overlays#restoration) and restores an earlier page.
- An overlay that is closed by the server or by a [close condition](/learn/subinteractions#close-conditions) doesn't ask.
- Your own `[up-dismiss]` buttons don't ask.

To ask before your own cancel buttons close the overlay, give them a dismissal value and add it to the list:

```html
<button up-dismiss="'cancel'">Cancel</button> <!-- mark: 'cancel' -->
```

```js
if ([':button', ':key', ':outside', 'cancel'].includes(event.value)) confirmLeave(event) // mark: 'cancel'
```


Asking before leaving the page {#leaving-the-page}
------------------------------

Reloading the page, closing the browser tab or following a link that Unpoly doesn't handle all leave the page.
For these, the browser emits a `beforeunload` event on the `window`. The [compiler](#compiler) prevents it while
the form is dirty, which makes the browser ask the user whether to leave. Browsers show their own generic text
and ignore any message you provide.

Browsers don't emit `beforeunload` reliably, especially on mobile devices, where a tab can be closed or
discarded in the background without asking. If losing a draft would be costly, also save the form's values
when the page is hidden, e.g. in a `pagehide` or `visibilitychange` listener.


@page unsaved-changes
@menu-title Unsaved changes
