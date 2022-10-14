/*-
Instances of `up.RenderResult` describe the effects of [rendering](/up.render).

Functions like `up.render()`, `up.follow()` or `up.submit()` return a promise
that resolve with an `up.RenderResult`:

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
  The [target selector](/targeting-fragments) that was rendered.

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
  @internal
  */

  /*-
  A promise that settles when no further DOM changes will be caused by this render pass.

  In particular:

  - [Animations](/up.motion) have concluded and [transitioned](https://unpoly.com/a-up-transition) elements were removed from the DOM tree.
  - A [cached response](#options.cache) was [revalidated with the server](/up.fragment.config#config.autoRevalidate).
    If the server has responded with new content, this content has also been rendered.

  The promise resolves to an `up.RenderResult` for the effective fragments that were updated and are currently attached to the DOM.
  If cache revalidation has rendered new content, the `up.RenderResult` will contain the fragments from both render passes that
  are still attached to the DOM.

  The promise will reject if the server sends an error status,
  if there is a network issue, or if targets could not be matched.

  ### Example

  ```js
  let result = await up.render({ url: '/path' }).finished
  console.log(result.fragments)

  @property up.RenderResult#finished
  @param {Promise<up.RenderResult>}
  ```
  */

  keys() {
    return [
      'fragments',
      'layer',
      'target',
      'options',
      'finished',
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

  @property up.RenderResult#none
  @param {boolean} none
  @experimental
  */
  get none() {
    return !this.fragments.length
  }

  /*-
  Returns the inserted fragment.

  When [multiple fragments](/targeting-fragments#updating-multiple-fragments) were inserted, the first fragment is returned.
  To get a list of all inserted fragments, use the [`{ fragments }`](/up.RenderResult.prototype.fragments) property.

  @property up.RenderResult#fragment
  @param {Element} fragment
  @stable
  */
  get fragment() {
    return this.fragments[0]
  }

  update(otherResult) {
    this.fragments = this.fragments.concat(otherResult.fragments).filter(up.element.isAttached)
    this.target = otherResult.target
    this.layer = otherResult.layer
    this.finished = otherResult.finished
  }
}
