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
  @experimental
  */

  keys() {
    return [
      'fragments',
      'layer',
      'target',
    ]
  }

  isNone() {
    // There are some cases where we did not render any fragment:
    //
    // - Server sent HTTP status `304 Not Modified` (especially when reloading)
    // - Server sent HTTP status `204 No Content`
    // - Target was :none (can be set by both client and server)
    // - Server sent `X-Up-Accept-Layer` or `X-Up-Dismiss-Layer`, although the server
    //   may send an optional body in case the response is used on the root layer.
    return !this.fragments.length
  }
}
