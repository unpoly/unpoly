const u = up.util

/*-
Instances of `up.RenderResult` describe the effects of [rendering](/up.render).

Functions like `up.render()`, `up.follow()` or `up.submit()` return a promise
that resolve with an `up.RenderResult`:

```js
let result = await up.render('.target', content: 'foo')
console.log(result.fragments)     // result: [<div class="target">...</div>]
console.log(result.layer)         // result: up.Layer.Root
console.log(result.renderOptions) // result: { target: '.target', content: 'foo', ... }
```

@class up.RenderResult
@parent up.fragment
*/
up.RenderResult = class RenderResult {

  /*-
  The effective fragments that ended up being inserted.

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
  The effective [target selector](/targeting-fragments) for the rendered fragments.

  ## Matches the actual fragments

  Note that this property an exact target the for the [fragments that were rendered](/up.RenderResult.prototype.fragments).
  This may differ from the initial render options.

  For example, if our original render options contained an optional selector with `:maybe`,
  and that selector didn't match, it is omitted from the `result.target`:

  ```js
  let result = await up.render({ target: '#foo, #bar:maybe' })
  result.renderOptions // result: "#foo, #bar:maybe"
  result.target        // result: "#foo"
  ```

  If any `[up-hungry]` elements were added to the render pass, they
  are included in `result.target`, although they never explicitly mentioned in our render options:

  ```js
  let result = await up.render({ target: '#foo' })
  result.renderOptions // result: "#foo"
  result.target        // result: "#foo, #hungry"
  ```

  @property up.RenderResult#target
  @param {string} target
  @stable
  */

  /*-
  The [render](/up.render) options used to produce this result.

  If this result was produced from a [failed response](/failed-responses),
  [`fail` prefixes](/failed-responses#fail-options)
  have been removed from the render options.

  @property up.RenderResult#renderOptions
  @param {Object} renderOptions
  @experimental
  */

  /*-
  A promise that settles when no further DOM changes will be caused by this render pass.

  In particular:

  - [Animations](/up.motion) have concluded and [transitioned](/up-transition) elements were removed from the DOM tree.
  - A [cached response](#options.cache) was [revalidated with the server](/caching#revalidation).
    If the server has responded with new content, this content has also been rendered.

  The promise resolves to the last `up.RenderResult` that updated a fragment.
  If [revalidation](/caching#revalidation) re-rendered the fragment, it is the result from the
  second render pass. If no revalidation was performed, or if revalidation yielded an [empty response](/caching#when-nothing-changed),
  it is the result from the initial render pass.

  The promise will reject if the server sends an error status,
  if there is a network issue, or if targets could not be matched.

  Also see [Awaiting postprocessing](/render-lifecycle#postprocessing).

  ### Example

  ```js
  let result = await up.render({ url: '/path' }).finished
  console.log(result.fragments)

  @property up.RenderResult#finished
  @param {Promise<up.RenderResult>} finished
    A promise that settles after all DOM changes.
  ```
  */

  constructor({ layer, target, renderOptions, weavables } = {}) {
    this.layer = layer
    this.target = target
    this.renderOptions = renderOptions
    this._collapseWeavables([...weavables, ...(renderOptions.extraWeavables || [])])
  }

  /*-
  Whether this render pass did not result in any fragments being rendered.

  There are some cases where we did not render any fragment:

  - Server sent HTTP status `304 Not Modified` to [avoid re-rendering unchanged content](/skipping-rendering).
  - Server sent HTTP status `204 No Content`.
  - The target selector was set to `':none'` by either client or server.
  - The server sent an `X-Up-Accept-Layer` or `X-Up-Dismiss-Layer` header.
    This [closes an overlay](/closing-overlays#from-server) before content is rendered.

  @property up.RenderResult#none
  @param {boolean} none
  @stable
  */
  get none() {
    return !this.fragments.length
  }

  /*-
  Returns the inserted fragment.

  When [multiple fragments](/targeting-fragments#multiple) were inserted, the first fragment is returned.
  To get a list of all inserted fragments, use the [`{ fragments }`](/up.RenderResult.prototype.fragments) property.

  @see up.Request.prototype.fragment

  @property up.RenderResult#fragment
  @param {Element} fragment
  @stable
  */
  get fragment() {
    return this.fragments[0]
  }

  /*-
  Whether this render pass has rendered a successful response.

  By default responses with a `2xx` status code are considered successful.
  Other HTTP codes (like `500` or `404`) are considered [failed responses](/failed-responses#fail-options).

  Rendering a [string of HTML](/providing-html#string) is always successful.

  @property up.RenderResult#ok
  @param {boolean} up.RenderResult#ok
  @experimental
  */
  get ok() {
    return !this.renderOptions.didFail
  }

  // addStep(fragments, finisher) {
  //   this.fragments.push(...fragments)
  //   if (finisher) this.finishers.push(finisher)
  // }
  //
  // addVerifyer(verifyer) {
  //   this.verifyers.push(verifyer)
  // }

  _collapseWeavables(weavables) {
    this.fragments = this._getWeavablePhase(weavables, 'value').flat()
    this.finished = this._finish(weavables)
  }

  async _finish(weavables) {
    let finishFns = this._getWeavablePhase(weavables, 'finish')
    let verifyFns = this._getWeavablePhase(weavables, 'verify')

    let finishedResult = this
    await Promise.all(u.callAll(finishFns, finishedResult))

    for (let verifyFn of verifyFns) {
      let verifyerResult = await verifyFn(finishedResult)
      finishedResult = verifyerResult || finishedResult
    }
    return finishedResult
  }

  _getWeavablePhase(weavables, phase) {
    return u.compact(u.map(weavables, phase))
  }

  // emitAsEvent() {
  //   let event = up.event.build('up:fragment:rendered')
  //   // We cannot set { target } on an event
  //   u.delegate(event, ['ok', 'none', 'fragment', 'fragments', 'layer', 'renderOptions', 'finished'], () => this)
  //   up.emit(this.layer, event, { log: ['Render pass inserted %d fragment(s)', this.fragments.length] })
  // }

  // static both(main, extension, mergeFinished = true) {
  //   // TODO: Why does mergeFinished call this with an undefined extension?
  //   if (!extension) {
  //     return main
  //   }
  //
  //   return new this({
  //     ...main,
  //     fragments: main.fragments.concat(extension.fragments),
  //     finished: (mergeFinished && this.mergeFinished(main, extension))
  //   })
  // }
  //
  // static async mergeFinished(main, extension) {
  //   return this.both(
  //     await main.finished,
  //     await extension.finished,
  //     false
  //   )
  // }

}
