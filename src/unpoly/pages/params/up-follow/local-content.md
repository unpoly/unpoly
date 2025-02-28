@partial up-follow/local-content

@param [up-content]
  The new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
  for the targeted fragment.

  See [Updating an element's inner HTML from a string](/providing-html#content).

  Instead of passing an HTML string you can also [pass a template selector](/templates),
  optionally with [variables](/placeholders#dynamic-templates).

@param [up-fragment]
  A string of HTML comprising *only* the new fragment's
  [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML).

  With an `[up-fragment]` attribute you can omit the `[up-target]` attribute.
  The target will be [derived](/target-derivation) from the root element in the given HTML.

  See [Rendering a string that only contains the fragment](/providing-html#fragment).

  Instead of passing an HTML string you can also [pass a template selector](/templates),
  optionally with [variables](/placeholders#dynamic-templates).

@param [up-document]
  A string of HTML containing the targeted fragment.

  See [Extracting an element's outer HTML from a larger HTML string](/providing-html#document).

  Instead of passing an HTML string you can also [pass a template selector](/templates),
  optionally with [variables](/placeholders#dynamic-templates).
