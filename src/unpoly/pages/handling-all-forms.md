Handling all forms
==================

## Handling all forms

To handle *all* forms on a page without requiring an [`[up-submit]`](/up-submit) attribute:

```js
up.form.config.submitSelectors.push(['form'])
```

There are some exceptions when forms will still submit with a full page load under this setting:

- Forms with an `[up-submit=false]` attribute.
- [Submit buttons](/submitting-forms#submit-buttons) with an `[up-submit=false]` attribute.
- Forms with a cross-origin `[action]` attribute.

You may configure additional exceptions in `up.form.config.noSubmitSelectors`.


@page handling-all-forms
@signature
