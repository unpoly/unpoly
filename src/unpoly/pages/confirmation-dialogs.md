Confirmation dialogs
====================

Before a link or form does something that is hard to undo, like deleting a record, Unpoly can ask the user to confirm.
When the user cancels, nothing is rendered and the page stays as it was.


Confirming a link {#links}
-----------------

To ask before a link is followed, set an [`[up-confirm]`](/api/up-follow#up-confirm) attribute with the question:

```html
<a href="/projects/5" up-method="delete" up-follow up-confirm="Really delete this project?">Delete project</a> <!-- mark: up-confirm="Really delete this project?" -->
```

When the user clicks the link, Unpoly shows the question in the browser's
[native confirmation dialog](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm).
Only when the user confirms does Unpoly send the request and update the page.

The native dialog blocks the page until the user answers. Its look and button labels are up to the browser.
To show your own dialog instead, see [styled confirmation dialogs](#styled).


Confirming a form submission {#forms}
----------------------------

On a form that is [submitted through Unpoly](/learn/submitting-forms), set `[up-confirm]` on the `<form>` element:

```html
<form method="post" action="/projects/5/archive" up-submit up-confirm="Archive this project?"> <!-- mark: up-confirm="Archive this project?" -->
  ...
</form>
```

To ask only for one action, set the attribute on a submit button instead.
The user is only asked when they submit the form with that button:

```html
<form method="post" action="/proposal" up-submit>
  <button type="submit" name="decision" value="accept">Accept</button>
  <button type="submit" name="decision" value="reject" up-confirm="Really reject?">Reject</button> <!-- mark: up-confirm="Really reject?" -->
</form>
```

[Validating](/learn/validation) a field with `[up-validate]` never asks.


Confirming from JavaScript {#script}
--------------------------

Functions that render, like `up.render()`, `up.follow()`, `up.submit()` or `up.navigate()`, accept a `{ confirm }` option:

```js
up.navigate({ url: '/projects/5', method: 'delete', confirm: 'Really delete this project?' }) // mark: confirm: 'Really delete this project?'
```

When the user cancels, the returned promise rejects with an `up.Aborted` error.


Confirming before closing an overlay {#overlays}
------------------------------------

An `[up-dismiss]` or `[up-accept]` button can ask before it [closes its overlay](/learn/closing-overlays):

```html
<button up-dismiss up-confirm="Discard your changes?">Cancel</button> <!-- mark: up-confirm="Discard your changes?" -->
```

From JavaScript, pass a `{ confirm }` option to `up.layer.dismiss()` or `up.layer.accept()`.
When the user cancels, the overlay stays open and the function throws an `up.Aborted` error.

To ask when the user closes the overlay with the `Escape` key, a click on the backdrop or the `×` button,
see [keeping an overlay open](/learn/closing-overlays#keeping-open).
To ask only when a form has unsaved changes, see [[unsaved-changes]].


Rails helpers and `[data-confirm]` {#data-confirm}
---------------------------------

Unpoly also accepts the question in a `[data-confirm]` attribute, which Rails helpers like `link_to` and `button_to` render:

```html
<a href="/projects/5" data-method="delete" data-confirm="Really delete this project?" up-follow>Delete project</a> <!-- mark: data-confirm="Really delete this project?" -->
```

On links and forms that Unpoly handles, `[data-confirm]` works like `[up-confirm]`.
When your app also loads Rails UJS, Unpoly takes over the attribute so the user isn't asked twice.


Styled confirmation dialogs {#styled}
---------------------------

The browser's dialog cannot be styled. To ask in an [overlay](/learn/overlays) instead, give your links
a `[custom-confirm]` attribute:

```html
<a href="/projects/5" up-method="delete" up-follow custom-confirm="Really delete this project?">Delete project</a> <!-- mark: custom-confirm="Really delete this project?" -->
```

The attribute is not part of Unpoly. It is a hook for this listener:

```js
up.on('up:link:follow', '[custom-confirm]', (event, link) => {
  const message = link.getAttribute('custom-confirm')
  const content = `
    <p>${up.util.escapeHTML(message)}</p>
    <button up-accept>OK</button>
    <button up-dismiss>Cancel</button>
  `
  event.preventDefault()                    // don't follow the link yet
  up.layer.ask({ content }).then(
    () => up.render(event.renderOptions),   // on accept: follow the link with the same options
    () => {}                                // on dismiss: do nothing
  )
})
```

Before Unpoly follows a link, it emits `up:link:follow`. The listener prevents the event, so the link is not
followed. Instead it opens an overlay with `up.layer.ask()`, which returns a promise for the user's answer.
The overlay's buttons [accept or dismiss it](/learn/closing-overlays). When the user accepts, the listener
renders with the link's original options from `event.renderOptions`.

The message is passed through `up.util.escapeHTML()`, so a message with characters like `<` cannot inject HTML.
To keep the dialog's HTML out of your JavaScript, you can also pass a [template](/learn/templates) selector as `{ content }`.

The recipe uses its own attribute instead of `[up-confirm]`. With `[up-confirm]`, `event.renderOptions` would contain
a `{ confirm }` option, and the browser's dialog would appear after your own.

For forms, listen to `up:form:submit` instead. Its `event.renderOptions` holds the form's options, and
`up.render(event.renderOptions)` submits the form.

The browser's dialog blocks the page until the user answers. A styled dialog doesn't, so the page can
change while it is open, e.g. when a [polling](/learn/polling) response arrives. The link is then followed
on the changed page. If the link itself was replaced in the meantime, nothing is rendered and `up.render()`
rejects with an `up.CannotMatch` error.


@page confirmation-dialogs
