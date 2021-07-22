/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

/***
Instances of `up.RenderResult` describe the effects of [rendering](/up.render).

It is returned by functions like `up.render()` or `up.navigate()`:

```js
let result = await up.render('.target', content: 'foo')
console.log(result.fragments) // => [<div class="target">...</div>]
console.log(result.layer)     // => up.Layer.Root
```

@class up.RenderResult
*/
up.RenderResult = class RenderResult extends up.Record {

  /***
  An array of fragments that were inserted.

  @property up.RenderResult#fragments
  @param {Array<Element>} fragments
  @stable
  */

  /***
  The updated [layer](/up.layer).

  @property up.RenderResult#layer
  @param {up.Layer} layer
  @stable
  */

  keys() {
    return [
      'fragments',
      'layer',
//      'request',
//      'response'
    ];
  }
};

//  @getter 'ok', ->
//    if @response
//      @response.ok
//    else
//      true
