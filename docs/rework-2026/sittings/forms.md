# Sitting notes: Forms (Henning 2026-10-09)

## /forms
- Italicize "before" in "To validate a field before the form is submitted".
- "Forms that react on the server": say explicitly that [up-validate] has a second use case (it can also be used to update dependent fields), since readers may be surprised the same attribute appears again.
- DECISION (applies to /forms AND /links): remove the "Submitting is navigation" / "Following is navigation" sections from both chapter overviews. The navigation explanation stays only in the detail guides (/submitting-forms, /following-links), which link to /navigation-defaults. Check that nothing links to the removed overview anchors (repoint to the detail page's section).

## /submitting-forms
- Shrink "Handling validation errors" {#validation} to one short paragraph: the 422 rule (error status + re-rendered form → Unpoly updates the form instead of the target) and a pointer to [[validation]] (rendering errors elsewhere, single-field validation, other failure detection). Keep the {#validation} and {#fail-target} anchors working (shim or repoint; grep both repos).
- EVERYTHING CUT must be covered on /validation: the example with success/failure chips, the [up-fail-target] subsection + example, "fail-prefixed render options → [[failed-responses]]", the failure-detection link (/failed-responses#customizing-failure-detection), "values and messages come from your server-rendered HTML". Merge what /validation lacks into its "Validating after submission" section; don't duplicate what it has.
