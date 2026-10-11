# Sitting packet: watch-options (last page of the Forms chapter)

Prepared 2026-10-11. Pattern numbers refer to writer-brief.md, "Maintainer patterns".


## Watch options (`/watch-options`, 208 lines)

The shared `[up-watch-...]` options (events, delay, disabling, loading state) for `[up-watch]`,
`[up-validate]`, `[up-autosubmit]` and `[up-switch]`.

**Changed since writing**
- 5b701689a (A9): new paragraph after the table. Event and delay options apply to all four features,
  loading-state options only to `[up-validate]` and `[up-autosubmit]`, and `[up-watch]` callbacks must forward their options.
- 5b701689a (Q2, docs half): the "only once per unique changed value" promise is narrowed to
  `up.watch()`, `[up-autosubmit]` and `[up-switch]`. New sentence that `[up-validate]` validates on every watched event.
- dfa0712e0 (Q1, code): validations now set feedback classes by default. So "Showing loading state while working"
  (watch-options.md:159-161) is true again without a change.


### 1. "It's OK to name multiple events" now contradicts the next sentence

> It's OK to name multiple events that may result from the same change (e.g. `keydown keyup change`).
> For `up.watch()`, `[up-autosubmit]` and `[up-switch]`, Unpoly guarantees the callback is run only once per unique changed value.
> `[up-validate]` validates on every watched event, so watching `input` also validates once more on `change`.

(watch-options.md:45-47)

The Q2 fix narrowed the guarantee, but the "It's OK" sentence before it still reads as general advice.
For `[up-validate]` it is not OK: `keydown keyup change` sends a validation for each event
(form_validator.js:24-31 has no value comparison). The reason ("only once per value") should sit with the advice. (Pattern 2)

- **A.** Merge the advice into the narrowed guarantee.
- **B.** Leave as is.

**Lean: A (medium).** Draft for watch-options.md:44-47:

```md
Multiple events can be passed as a space- or comma-separated string, or as an array.
For `up.watch()`, `[up-autosubmit]` and `[up-switch]` it's OK to name multiple events that may result
from the same change (e.g. `keydown keyup change`), since Unpoly runs the callback only once per unique changed value.
`[up-validate]` validates on every watched event, so watching `input` also validates once more on `change`.
```


### 2. "Setting options for multiple fields" says the same sentence twice, and misses what the last example shows

> Instead of setting `[up-watch-...]` attributes on individual fields, you may also set them on any element containing fields.

(watch-options.md:167)

> You may also set options on any element containing fields.
> This is particularly useful for [watching a group of radio buttons](/up-watch#watching-radio-buttons):
>
> ```html
> <fieldset up-autosubmit up-watch-disable>
> ```

(watch-options.md:188-193)

The second sentence repeats the first literally (Pattern 5). The example also does something new
that the text doesn't say: the *feature attribute itself* (`up-autosubmit`) sits on the container, not
only the options. That is the point of the radio-button case.

- **A.** Re-angle the second paragraph to the feature attribute on a container.
- **B.** Delete the repeated sentence only.

**Lean: A (medium).** Draft for watch-options.md:188-189:

```md
The feature attribute itself can sit on a container, too. Unpoly then watches all fields inside it.
This is how you [watch a group of radio buttons](/up-watch#watching-radio-buttons):
```

(Verified: `[up-autosubmit]` on a container watches all its fields, form.js:2358-2365 "Auto-submitting radio buttons".)
