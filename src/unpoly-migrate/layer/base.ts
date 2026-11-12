/*-
@class up.Layer
*/

// Adds members to up.Layer that core doesn't declare, so they exist only with unpoly-migrate.
declare module '../../unpoly/layer/base.js' {
  interface Layer {
    isOpen(): boolean
    isClosed(): boolean
    readonly historyVisible: Layer['history']
  }
}

/*-
Returns whether this layer is still part of the [layer stack](/api/up.layer.stack).

A layer is considered "closed" immediately after it has been [dismissed](/api/up.Layer.prototype.dismiss)
or [accepted](/api/up.Layer.prototype.accept). If the closing is animated, a layer may be considered "closed" while
the closing animation is still playing.

@function up.Layer#isOpen
@return {boolean}
  Whether this layer is still open.
@deprecated
  Use `up.Layer#isAlive()` instead.
*/
up.Layer.prototype.isOpen = function() {
  up.migrate.deprecated('up.Layer#isOpen()', 'up.Layer#isAlive()')
  return this.isAlive()
}

/*-
Returns whether this layer is no longer part of the [layer stack](/api/up.layer.stack).

A layer is considered "closed" immediately after it has been [dismissed](/api/up.Layer.prototype.dismiss)
or [accepted](/api/up.Layer.prototype.accept). If the closing is animated, a layer may be considered "closed" while
the closing animation is still playing.

@function up.Layer#isClosed
@return {boolean}
  Whether this layer has been closed.
@deprecated
  Use `!up.Layer#isAlive()` instead.
*/
up.Layer.prototype.isClosed = function() {
  up.migrate.deprecated('up.Layer#isClosed()', '!up.Layer#isAlive()')
  return !this.isAlive()
}

Object.defineProperty(up.Layer.prototype, 'historyVisible', { get: function() {
  up.migrate.deprecated('up.Layer#historyVisible', 'up.Layer#history')
  return this.history
} })
