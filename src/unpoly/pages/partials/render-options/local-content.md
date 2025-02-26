@partial render-options/local-content

@param {string|Element|List<Node>} [options.content]
  The new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
  for the targeted fragment.

  See [Updating an element's inner HTML from a string](/providing-html#content).

  Instead of passing an HTML string you can also [refer to a template](/templates).

@param {string|Element} [options.fragment]
  A string of HTML comprising only the new fragment's [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML).

  When passing `{ fragment }` you can omit the `{ target }` option.
  The target will be [derived](/target-derivation) from the root element in the given HTML.

  See [Rendering a string that only contains the fragment](/providing-html#fragment).

  Instead of passing an HTML string you can also [refer to a template](/templates).

@param {string|Element|Document} [options.document]
  A string of HTML containing the targeted fragment.

  See [Extracting an element's outer HTML from a larger HTML string](/providing-html#document).

  Instead of passing an HTML string you can also [refer to a template](/templates).

@param {up.Response} [options.response]
  An `up.Response` object that contains the targeted fragments in its [text](/up.Response.prototype.text).

  See [Rendering an up.Response object](/providing-html#response).
