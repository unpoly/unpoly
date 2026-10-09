# Sitting notes: Forms (Henning 2026-10-09)

## /forms
- Italicize "before" in "To validate a field before the form is submitted".
- "Forms that react on the server": say explicitly that [up-validate] has a second use case (it can also be used to update dependent fields), since readers may be surprised the same attribute appears again.
- DECISION (applies to /forms AND /links): remove the "Submitting is navigation" / "Following is navigation" sections from both chapter overviews. The navigation explanation stays only in the detail guides (/submitting-forms, /following-links), which link to /navigation-defaults. Check that nothing links to the removed overview anchors (repoint to the detail page's section).

## /submitting-forms
- Shrink "Handling validation errors" {#validation} to one short paragraph: the 422 rule (error status + re-rendered form → Unpoly updates the form instead of the target) and a pointer to [[validation]] (rendering errors elsewhere, single-field validation, other failure detection). Keep the {#validation} and {#fail-target} anchors working (shim or repoint; grep both repos).
- EVERYTHING CUT must be covered on /validation: the example with success/failure chips, the [up-fail-target] subsection + example, "fail-prefixed render options → [[failed-responses]]", the failure-detection link (/failed-responses#customizing-failure-detection), "values and messages come from your server-rendered HTML". Merge what /validation lacks into its "Validating after submission" section; don't duplicate what it has.

## /validation
- "Updating form groups" {#form-groups} reads like a special case, but it is the default. Retitle (keep the anchor), e.g. "Which fragment is updated".
- CROSS-CUTTING (all pages): every Ruby on Rails backend example gets a short note that it works similarly with any other backend. Ruby/ERB code blocks today: validation, reactive-server-forms, attributes-and-options, context (guides); form.js, protocol.js (doc comments). Check prose-only Rails examples too.
- Concurrency is missing from /validation. Experienced readers worry about fast users and slow servers. Unpoly handles it: validations batched into one multi-target request, only one validation request in flight per form (others queued), ancestor targets absorb descendants, pending validations aborted when the user submits. Today this lives only in reactive-server-forms#race-conditions and the up.validate() reference (#batching). Bring it to /validation without creating a competing full copy (see placement decision below).
- DECISION (concurrency placement): reactive-server-forms#race-conditions OWNS concurrency, unchanged. /validation gets a short paragraph at the end of "Validating after changing a field" (after "You can also set it on any container..."), draft:
  > Users can change fields faster than your server responds, or submit the form while a validation is still loading. Unpoly keeps the form consistent: it merges validations into a single request, queues new validations while one is in flight, and aborts pending validations when the form is submitted. See [preventing race conditions](/reactive-server-forms#race-conditions) for details.
  Verify each claim against the code first (esp. the abort condition: only when the submission updates the form or an ancestor).
- Retitle of #form-groups agreed; Rails disclaimer agreed (all pages).
