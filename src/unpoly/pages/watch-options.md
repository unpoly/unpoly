Watch options
=============



- `[up-watch]`
- `up.watch()`
- `[up-validate]`
- `up.validate()`
- `[up-autosubmit]`
- `up.autosubmit()`

The closest attribute is honored
--------------------------------

Forms can configure [up-watch-...] prefixed defaults for all watchers:

```html
<form up-disable="true" up-watch-disable="false">
  <input up-autosubmit>
</form>
```

Form-wide options can be overridden at the input level:

```html
<form up-disable="true">
  <input up-autosubmit up-watch-disable="false">
</form>
```

You may also set [up-watch-...] attribute on any element containing fields.
The closest attribute around the changed field is honored.

This is particularly useful for a group of radio buttons:

```html
<form up-disable="true">
  <fieldset up-watch-disable="false">
    <input type="radio" name="kind" value="0">
    <input type="radio" name="kind" value="1">
    <input type="radio" name="kind" value="2">
  </fieldset>
</form>
```


Which events to watch
---------------------

- Use `[up-watch-event]` or `{ event }` option.
- Multiple events can be passed space-separated or as an array.
  Common values are [`'input'` or `'change'`](https://javascript.info/events-change-input).
- It's OK to name multiple events that may result in the same change (e.g. `keydown keyup change`). Unpoly guarantees the callback is run only once per unque changed value.
- Can be set on individiual fields, on the `<form>` or on any container of fields. The closest attribute around a changing field will be honored.
- The default event for `[up-watch]` is `input`.
- The default event for `[up-validate]` is `change`.

### Dealing with misbehaving fields

Sometimes fields emit non-standard events.

With `[up-watch-event="change"]` the event may be transformed through `up.form.config.watchChangeEvents`.

```js
up.form.config.watchChangeEvents = ['change', 'myselect:value:chosen']
```

With `[up-watch-event="input"]` the event may be transformed through `up.form.config.watchInputEvents`.


Debouncing callbacks
--------------------

- Use `[up-watch-delay]` or `{ delay }` option.
- When observing the `input` event the default is  `up.form.config.watchInputDelay`, which defaults to `0`.
  For other events there is no default delay.

If the watched field or its container is [aborted](/aborting-requests) or destroyed while waiting for a delay,
the callback is unscheduled.

Regardless of the delay, Unpoly will guarantee that only one async callback is running concurrently.
If the form is changed while an async callback is still processing, Unpoly will wait
until the callback concludes and then run it again with the latest field values.



Disabling fields while processing
---------------------------------

- You can disable form fields during async processing
- Use `[up-watch-disable]` or `{ disable }` option.
- For this to work the callback must return a promise



Showing feedback while processing
---------------------------------

- You can disable form fields during async processing

Changed field gets .up-active.
Targeted fragments get .up-loading.

- Use `[up-watch-feedback]` or `{ feedback }` option.
- For this to work the callback must return a promise



@page watch-options
