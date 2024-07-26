Watch options
=============

When watching a form for changes, you can configure how to observe events
and process callbacks.

The options shown below apply to all features that watch form fields:

| HTML              | JavaScript        | Purpose                              |
|-------------------|-------------------|--------------------------------------|
| `[up-watch]`      | `up.watch()`      | Run a callback after change          |
| `[up-validate]`   | `up.validate()`   | Render a new form state after change |
| `[up-autosubmit]` | `up.autosubmit()` | Submit a form after change           |



Which events to watch
---------------------

Most features watch the `input` event by default. Only [validation](/up-validate) watches the `change` event by default.

You may control which events are observed by setting an `[up-watch-event]` attribute or passing
an `{ event }` option:

```html
<form action="/search">
  <input name="query" up-autosubmit up-watch-event="change">
</form>
```

Multiple events can be passed as a space-separated string or as an array.
It's OK to name multiple events that may result in the same field (e.g. `keydown keyup change`).
Unpoly guarantees the callback is run only once per unique changed value.

### Normalizing non-standard events

Sometimes fields emit non-standard events instead of `change` and `input`.
You may configure Unpoly to normalize field events so they become
observable as `change` or `input`.

For example, if a custom select component emits a `myselect:chosen` event on selection:

```js
up.form.config.watchChangeEvents = ['change', 'myselect:chosen']
```

A watcher with `[up-watch-event="change"]` will now also react to a `myselect:chosen` event.

In the same fashion you may configure an event in `up.form.config.watchInputEvents`
to make it observable with `[up-watch-event="input"]`.

Instead of configuring an array of event types, you may also set a function that accepts
a form field and returns an array of event types to watch for that field.

For example,
on Desktop browsers date pickers inconveniently emit a `change` event when any date *component*
changes, causing multiple events as the user picks a date, month and year. In this case
we can configure the watched event to `blur` like this:

```js
up.form.config.watchChangeEvents = function(field) { 
  if (field.matches('input[type=date]') && isDesktop()) {
    return ['blur']
  } else {
    return ['change']
  }
}
```


Debouncing callbacks
--------------------

When observing the `input` event, you may want until to wait until the user has stopped
typing before running a callback. You can do so by setting an `[up-watch-delay]` attribute
or passing `{ delay }` option:

```html
<form action="/search">
  <!-- Wait until the user has stopped typing for 100 milliseconds -->
  <input name="query" up-autosubmit up-watch-delay="100"> <!-- mark-phrase "up-watch-delay" -->
</form>
```


For watchers of `input` the default delay is `up.form.config.watchInputDelay` (which defaults to `0`).
For watchers of other events there is no default delay.

If the field's form is [aborted](/aborting-requests) or destroyed while waiting for a delay,
the callback is unscheduled.

> [INFO]
> Regardless of the delay, Unpoly will guarantee that only one async callback is running concurrently.
> If the form is changed while an async callback is still processing,
> Unpoly will wait until the callback concludes and then re-run it with the latest field values.



Disabling fields while working
------------------------------

To prevent user input while processing changes, you may [disable form fields](/disabling-forms)
while an async callback is running. For this set an `[up-watch-disable]` attribute or
pass an `{ disable: true }` option.

When you also pass a custom callback function it must return a promise that settles once the work concludes:

```js
up.watch('input.query', { disable: true },  function(value, name, options) {
  let url = '/search?query=' + escapeURIFragment(value)
  return up.render('.results', { url, ...options }) // mark-phrase "return"
})
```

When you don't write the callback manually (`up.autosubmit()`, `up.validate()`) you don't need to
worry about returning a promise.

By default, setting `[up-watch-disable]` will cause all fields in a form to be disabled while processing.
To [only disable some form controls](/disabling-forms#disabling-some-controls-only),
set the value of `[up-watch-disable]` to any selector that matches fields or buttons.

> [TIP]
> To disable fields while *submitting* (instead of while watching), use [`[up-disable]`](/disabling-forms) instead.


Showing feedback while working
------------------------------

To signal to users that you're processing changes, you can show [navigation feedback](/up.feedback)
while an async callback is running. For this set an `[up-watch-feedback]` attribute or
pass an `{ feedback: true }` option.

When you also pass a custom callback function it must return a promise that settles once the work concludes:

```js
up.watch('input.query', { disable: true },  function(value, name, options) {
  let url = '/search?query=' + escapeURIFragment(value)
  return up.render('.results', { url, ...options }) // mark-phrase "return"
})
```

When you don't write the callback manually (`up.autosubmit()`, `up.validate()`) you don't need to
worry about returning a promise.

> [TIP]
To show navigation feedback while *submitting* (instead of while watching), use [`[up-feedback]`](/up-follow#up-feedback) instead.


Setting options for multiple fields
----------------------------------

Instead of setting `[up-watch-...]` attributes on individual fields, you may also set them on any element containing fields.
The [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) attribute around a changed field is honored.

By setting attributes on the `<form>` you can configure defaults for *all* watchers:

```html
<form action="/search" up-watch-disable>
  <input name="query" up-autosubmit>
</form>
```

Form-wide options can be overridden at the input level:

```html
<form action="/search" up-watch-disable>
  <input name="department" up-autosubmit>                     <!-- disables -->
  <input name="query" up-autosubmit up-watch-disable="false"> <!-- does NOT disable -->
</form>
```

You may also set options on any element containing fields.
This is particularly useful for watching a group of radio buttons:

```html
<form action="/search">
  <fieldset up-autosubmit up-watch-disable>
    <input type="radio" name="format" value="html"> HTML format
    <input type="radio" name="format" value="pdf"> PDF format
    <input type="radio" name="format" value="txt"> Text format
  </fieldset>
</form>
```


@page watch-options
