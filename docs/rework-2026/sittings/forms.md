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

## /reactive-server-forms
- #server: add `@purchase.validate` to the validation branch of the Rails example (and make the prose match).
- #urls ("Rendering from other URLs"): keep on this page.
- [up-watch-disable] subsection: stays under race conditions.
- #race-conditions restructure (owner of concurrency, see /validation decision):
  (1) Lead with the promise, then three bold-keyword guarantees (ancestor rule folded into batching):
  > Users can change fields faster than your server responds. Unpoly keeps the form consistent, however fast the user is and however slow the network:
  > - **One request at a time.** Each form has at most one validation request in flight. Later changes wait until it has loaded.
  > - **Batched updates.** Changes that waited are sent together, in a single request for all their targets. When one target contains another, only the outer one is requested.
  > - **Submitting wins.** When the user submits while a validation is loading, the validation is aborted. (Verify the exact abort condition in code; keep the qualifier if it only applies when the submission updates the form or an ancestor.)
  (2) Replace the six-step prose scenario with a timeline table, headings "User input | Network | Form changes":
  | User input | Network | Form changes |
  |---|---|---|
  | Selects a continent | Request 1 for the country select | |
  | Enters a parcel weight | *waits for request 1* | |
  | Changes the continent again | *waits for request 1* | |
  | | Request 1 loads | Country select updated |
  | | Request 2 for country select and price | |
  | | Request 2 loads | Country select and price updated |
  Keep the one-line lead-in pointing at the postage example and the closing "consistent values" sentence.

## /switching-form-state
- Section order (field-type sections): keep. Client vs. server line: clear. Custom effects: distinct, keep.
- #reacting-to-different-events: leave the topic to [[watch-options]]. Shrink to one or two sentences (default is the `input` event; other events and debouncing via [[watch-options]]), keep the anchor.
- After "A hidden element gets a `[hidden]` attribute." add that fields inside it are still submitted with the form. Draft: "Fields inside a hidden element are still submitted with the form. To exclude them from the submission, [disable](#disable) them instead." (Verified: up.Params excludes only disabled fields, params.js:594.)

## /disabling-forms
- Title stays "Disabling forms while working" (page and menu). Nothing to do: the sidebar already uses the page title (my "menu says Disabling forms" pointer was wrong).
- Duplicates with watch-options#disabling, previews, reactive-server-forms: accepted.
- #from-link: explained well enough ("prevents unwanted user input in the form while the link is navigating away").
- #focus-preservation: make it clearer that disabling a field takes away existing focus, not only that it can't receive focus. Draft opening: "A disabled field cannot have focus. When a focused field becomes disabled, the browser takes focus away from it." Then Unpoly's group/form fallback and the restore.

## /submitting-forms (follow-up from /disabling-forms)
- #loading ("Showing that the form is processing"): reduce to a teaser of disabling + the other loading state methods, no single-method example. Draft:
  > While the form is submitting, you can show the user that it is processing: [disable](/disabling-forms) its fields and buttons, style it with [feedback classes](/feedback-classes), show a [placeholder](/placeholders) or run a [preview](/previews). See [[loading-state]] for an overview.
  Keep the #loading anchor.

## /flashes
- Verified: "keeps its messages until new ones arrive" is correct ([up-flashes] = hungry + keep; keep is only prevented when the new fragment is non-empty, radio.js:517).
- Overlay subsections: keep. Caching gotcha: explained. Screenshot: fine.
- DECISION: /flashes moves to the Live fragments chapter, after hungry-elements (toc.yml moved in the sitting). Fix round: Live fragments overview gets a short mention/link (e.g. at the end of the hungry elements section: flashes are a ready-made hungry element); Forms overview line "To show confirmations or errors after a submission, see [[flashes]]" stays.
- /submitting-forms gets a SHORT section "Showing confirmation or error flashes" (pointer to [[flashes]]: render an [up-flashes] element in the response, it updates with any response; one tiny example at most).
