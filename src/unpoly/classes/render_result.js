/*-
Instances of `up.RenderResult` describe the effects of [rendering](/up.render).

It is returned by functions like `up.render()` or `up.navigate()`:

```js
let result = await up.render('.target', content: 'foo')
console.log(result.fragments) // => [<div class="target">...</div>]
console.log(result.layer)     // => up.Layer.Root
```

@class up.RenderResult
@parent up.fragment
*/
up.RenderResult = class RenderResult extends up.Record {

  /*-
  An array of fragments that were inserted.

  @property up.RenderResult#fragments
  @param {Array<Element>} fragments
  @stable
  */

  /*-
  The updated [layer](/up.layer).

  @property up.RenderResult#layer
  @param {up.Layer} layer
  @stable
  */

  /*-
  The target selector rendered.

  @property up.RenderResult#target
  @param {string} target
  @stable
  */

  /*-
  The [render](/up.render) options used to produce this result.

  If this result was produced from a [failed response](/failed-response),
  [`fail` prefixes](/failed-response#rendering-failed-responses-differently)
  have been removed from the render options.

  @property up.RenderResult#options
  @param {string} options
  @experimental
  */

  keys() {
    return [
      'fragments',
      'layer',
      'target',
      'options',
    ]
  }

  defaults() {
    return {
      fragments: [],
    }
  }

  /*-
  Whether this render pass did not result in any fragments being rendered.

  There are some cases where we did not render any fragment:

  - Server sent HTTP status `304 Not Modified` (especially when reloading)
  - Server sent HTTP status `204 No Content`
  - The target selector was set to `':none'` by either client or server.
  - The server sent an `X-Up-Accept-Layer` or `X-Up-Dismiss-Layer` header.

  @function up.RenderResult#isNone
  @return {boolean}
  @experimental
  */
  isNone() {
    return !this.fragments.length
  }
}
