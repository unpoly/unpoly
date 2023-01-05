By default `[up-validate]` reacts to the `change` event that is emitted
when the user is done editing and focuses the next field.

We can validate while the user is typing by setting an `[up-watch-event="input"]` attribute:

```html
<input name="email" up-validate up-watch-event="input" up-watch-delay="100" up-keep>
```

Note that we set some additional [watch options](/watch-options) to improve the experience:

- The [`[up-watch-delay]`](/watch-options#debouncing-callbacks)
  attribute to delay validation until the user has stopped typing for 100 milliseconds.
- The `[up-keep]` attribute to preserve additional user input while the validation request is in flight.

If you're using this pattern a lot, you may want to configure a [macro](/up.macro) for it.

@partial validating-while-typing
