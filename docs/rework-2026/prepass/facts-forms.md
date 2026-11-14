# Facts pass: Forms

Facts only: claims and code examples checked against `src/unpoly/**` and the specs.
Line numbers refer to the state of `docs-rework` at the time of the pass.
Things already decided in `docs/rework-2026/sittings/forms.md` are not re-raised; the factual
claims those notes plan to add are checked at the end.

Classes: **A** = doc clearly wrong (correction given). **Q** = docs and code disagree, either could be intended.

Four throwaway specs were run with `bin/test` to settle what reading left open (appended to
`form_validate_fn_spec.js` temporarily, then removed). Their results are quoted as "Temp spec".


## /forms

1. **A.** forms.md:27

   > The rest of the page keeps its state: scroll positions, focus and other forms all survive.

   The example submits without `[up-target]`, so it updates the main element and navigates. Navigation
   moves focus to the new main element (`autoFocus: [..., 'main-if-main', ...]`, fragment.js:279) and
   scrolls to the top of the layer (`autoScroll: ['hash', 'layer-if-main']`, fragment.js:280). Focus and
   the main viewport's scroll position do not survive, and the old page's own "Submitting is navigation"
   section (forms.md:50-52) says so. The sitting removes that section, which leaves this sentence uncontradicted.
   Correction:

   > Elements outside the updated fragment keep their state, like unsaved input in other forms.


## /submitting-forms

1. **A.** submitting-forms.md:66-67

   > your server should re-render the form with error messages and respond with
   > a non-200 status code.

   Failure means any status outside 2xx except 304: `fail(response) { return (response.status < 200 || response.status > 299) && response.status !== 304 }`
   (network.js:141). A 201 or 204 is a success. Correction: "respond with an error status code" or
   "a status code outside the 2xx range". The same error appears on /validation (below). The sitting
   shrinks this section but keeps the 422 rule, so the wording matters for the merged text.


## /validation

1. **A.** validation.md:72

   > For Unpoly to detect the failed submission, the backend must respond with a non-200 HTTP status code.

   Same as /submitting-forms 1 (network.js:141). Correction: "…must respond with an HTTP status code outside the 2xx range."


## /reactive-server-forms

No findings. The current race-condition list (reactive-server-forms.md:139-146) matches the code,
including the abort qualifier (see "Planned sitting additions").


## /switching-form-state

No findings.


## /disabling-forms

No findings. Checked: controls are re-enabled before the response renders (previews revert synchronously
when the request ends, request.js:765-767). Params are built before disabling (form_submit_fn_spec.js:139).
Focus falls back to the group or form (form.js:224-226, specs form_submit_fn_spec.js:535, :548). Focus,
selection and scroll are restored unless the user focused elsewhere (status.js:254-261, specs :562, :605).


## /handling-all-forms

No findings in the current text.


## /custom-form-fields

1. **A.** custom-form-fields.md:9-13 (pattern table)

   > | [A form-associated custom element](#form-associated) | Yes | With a `value` getter |
   > | [A configured custom element](#configured) | Yes | With a `value` getter |

   The column groups four features, but only two of them read `value`. Watching and switching compare
   values read through `field.value` (field_watcher.js:171, switcher.js:98). Validation does not. It
   validates on every watched event without reading a value (form_validator.js:26-30), and its request
   carries the browser's form data (params.js:532), so a form-associated element validates correctly
   without a getter. Disabling uses only `disabled` (form.js:73-81). The prose at :113-114 ("submitted
   correctly but never watched") is accurate. Only the table overstates. Correction for both rows:
   "Validated and disabled: yes. Watched and switched: with a `value` getter", or split the column.

2. **Q.** custom-form-fields.md:135-138

   > Unpoly only looks at a field's own disabled state. A field inside a `<fieldset disabled>` is
   > omitted from a submission, because the browser omits it, but it is still reported to
   > [watchers](/up.watch) and to [`[up-switch]`](/switching-form-state).

   The note sits in #contract, which "applies to every kind of custom field". For a *configured*
   (non-form-associated) element the browser omits nothing, because it does not know the element.
   Unpoly adds the element itself through `addField()`, which checks only the element's own disabled
   state (params.js:541-543, :594; form.js:59-64). Temp spec: a configured `<test-form-field>` inside
   `<fieldset disabled>` **is submitted** (`{ email: 'foo@example.com' }`), while a native input next to it is omitted.
   - World 1 (docs right, code bug): a field inside a disabled fieldset is never submitted. `Params.fromForm()`
     should skip configured fields that match `:disabled` or sit inside a `fieldset:disabled`.
   - World 2 (code right, docs incomplete): ignoring ancestors is deliberate (form.js:59 "which we deliberately
     don't track"). The note should limit the omission to native and form-associated fields, and say that
     a configured element inside a disabled fieldset is still submitted.
   - Lean: World 1. A disabled fieldset excluding everything inside it is what authors expect.


## /watch-options

1. **Q.** watch-options.md:154-156

   > While a validation or autosubmit request is loading, [feedback classes](/feedback-classes)
   > like `.up-active` and `.up-loading` are set by default.

   Confirms the pre-pass finding, but it goes further than the pre-pass said: by default a validation
   sets **no** feedback classes at all. `_mergeRenderOptions()` sets
   `options.feedback = u.some(dirtyRenderOptionsList, 'feedback')` (form_validator.js:284), and
   `statusOptions()` parses `[up-watch-feedback]` without a default (status.js:429). Without the
   attribute that is an explicit `false`, which overrides the render default `feedback: true`
   (fragment.js:255). With `[up-watch-feedback]`, `.up-active` goes on the **form** (the render origin,
   form_validator.js:244) and `.up-loading` on the targeted group. The field never gets `.up-active`.
   Temp spec, `[up-validate]` field in a `<fieldset>`:
   - no attribute: field `.up-active` false, form `.up-active` false, fieldset `.up-loading` false
   - `form[up-watch-feedback]`: field false, form true, fieldset true (matches form_validate_fn_spec.js:853, which only tests with the attribute)

   Autosubmit behaves as documented. Temp spec: the field gets `.up-active` with no attribute
   (form.js:136-137 adds origin, default submit button and form).
   - World 1 (docs right, code bug): validation should get feedback by default, like every other render.
     The API reference also documents `[up-watch-feedback='true']` (pages/params/up-watch/loading-state.md:22),
     and form_validator.js:283 ("If any solution wants feedback, they all get it") reads like opt-out was meant.
     A fix would treat an unset `feedback` as `true` in `_mergeRenderOptions()`.
   - World 2 (code right, docs wrong): validations are silent background updates and should not flash
     loading classes unless asked. Then watch-options.md:154 must say "an autosubmit request" only. It
     should add that validations need `[up-watch-feedback]`, and that `.up-active` then lands on the form,
     not the field. The `[up-watch-feedback='true']` default in the API reference is wrong for `[up-validate]`.
   - Lean: World 1. Two documents say "true", and the code only defaults to false through `u.some()`.

2. **Q.** watch-options.md:41-42

   > It's OK to name multiple events that may result from the same change (e.g. `keydown keyup change`).
   > Unpoly guarantees the callback is run only once per unique changed value.

   This holds for `up.watch()`, `[up-autosubmit]` and `[up-switch]`, which go through `up.FieldWatcher`
   and skip unchanged values (field_watcher.js:99-101, :174-180). `[up-validate]` does not use
   FieldWatcher. Its listener validates on every event (form_validator.js:24-31). Temp spec:
   `[up-validate][up-watch-event="input"]` and an `input` event send one request. After the response,
   a `change` event with the **same** value sends a second request. This also hits the recommended
   validating-while-typing pattern (partials/validating-while-typing.md:7), because `input` expands to
   `['input', 'change']` (form.js:24). Typing and then tabbing out therefore validates twice.
   - World 1 (docs right, code bug): the validator should skip events whose field values equal those of
     the last validation, like FieldWatcher does.
   - World 2 (code right, docs wrong): the guarantee is limited to watchers and autosubmit, and the page
     should say that `[up-validate]` validates on every named event.
   - Lean: World 1. The page lists `[up-validate]` among the features these options apply to.

3. **A.** watch-options.md:9-16

   > The options on this page apply to all of these features:

   This is true for event and delay. The loading-state options are different: `[up-watch-disable]`,
   `-preview`, `-placeholder` and `-feedback` (watch-options.md:106-156) take effect only for features
   that render. `[up-switch]` runs a synchronous callback with no request (switcher.js:31-35), so they
   do nothing there. For `[up-watch]`/`up.watch()` they only take effect if the callback forwards its
   `options` to a render function (form.js:820-824; FieldWatcher never disables or previews by itself,
   field_watcher.js). Correction: after the table, add

   > Event and delay options apply to all of them. Options for loading state, like `[up-watch-disable]`,
   > apply to `[up-validate]` and `[up-autosubmit]`. An `[up-watch]` callback must
   > [forward its options](/up.watch) to the function that renders.


## Planned sitting additions

- **/validation concurrency paragraph:** holds, with two conditions.
  - "merges validations into a single request": holds for validations with the same method and URL
    while batching is on (default `up.form.config.validateBatch = true`; form_validator.js:205-207, form.js:23).
    Spec: form_validate_fn_spec.js:907, and :926 for a different URL.
  - "queues new validations while one is in flight": holds (form_validator.js:160, :171-186). Spec: form_validate_fn_spec.js:694.
  - "aborts pending validations when the form is submitted": holds **only when the submission's target
    contains the form**, e.g. the main element (the default) or a container around the form. Submissions
    abort with `abort: 'target'` (fragment.js:254, render_job.js:211-213), which aborts requests bound to the
    *success* target's subtree (fragment.js:2760). Queued validations are dropped only when
    `up:fragment:aborted` reaches the form or an ancestor (form_validator.js:34-44). A form with
    `[up-target="#comments"]` outside the form does **not** abort its validations. Spec:
    form_submit_fn_spec.js:509 (target `.container` around the form). Keep a qualifier, e.g. "…aborts
    pending validations when a submission replaces the form".
- **/reactive-server-forms "One request at a time":** holds (see above, spec form_validate_fn_spec.js:694).
- **"Batched updates" incl. ancestor rule:** holds for the same URL/method. Nested targets are compressed
  to the outer one (update_layer.js:205-206, fragment.js:2656-2660). Spec: fragment_render_target_spec.js:841,
  :870, :960. The exception: when the outer step prepends or appends, both are requested (:899, :930).
  That case does not arise for validation targets, which swap.
- **"Submitting wins":** keep the qualifier. It is true only when the submission targets the form or an
  ancestor (see the abort bullet above). The current wording at reactive-server-forms.md:144-146 is correct.
- **Timeline table:** matches the code. Weight and the second continent change queue behind request 1.
  Both have the same destination, so they go out as one request for `#country, #price`.
- **/switching-form-state "Fields inside a hidden element are still submitted":** holds. Submissions build
  params with the browser's `new FormData(form, submitter)` (params.js:532), which ignores `[hidden]` and
  omits disabled controls. The sitting's citation params.js:594 is the watcher/`fromFields()` path. Both
  agree, but :532 is the one that decides what is submitted.
- **/handling-all-forms macro example:** works. `submitSelectors` is evaluated per `submit` event
  (form.js:452), so a macro-set `[up-submit]` is honored, and `noSubmitSelectors` is applied on top
  (classes/config.js:25-28), so `[target]` and cross-origin `[action]` still load a full page. One catch:
  `form.setAttribute('up-disable', '')` **overwrites** an `[up-disable]` the author set on a single form, e.g.
  `[up-disable=".actions"]` becomes "disable everything". Suggest
  `if (!form.hasAttribute('up-disable')) form.setAttribute('up-disable', '')`, or excluding such forms in the selector.
- **/disabling-forms focus draft** ("A disabled field cannot have focus. When a focused field becomes disabled,
  the browser takes focus away from it."): consistent with form.js:222-226 and form_submit_fn_spec.js:533-560.
- **/submitting-forms #loading teaser:** holds. A submission sets feedback classes on the form, the submit
  button and the focused field (form.js:136-137, status_spec.js:522, :569), and accepts placeholders and previews.
- **/submitting-forms flashes pointer:** already verified in the sitting (radio.js:517). Not re-checked.
