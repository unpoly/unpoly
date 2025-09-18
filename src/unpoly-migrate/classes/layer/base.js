/*-
Returns whether this layer is still part of the [layer stack](/up.layer.stack).

A layer is considered "closed" immediately after it has been [dismissed](/up.Layer.prototype.dismiss)
or [accepted](/up.Layer.prototype.dismiss). If the closing is animated, a layer may be considered "closed" while
closing animation is still playing.

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
Returns whether this layer is no longer part of the [layer stack](/up.layer.stack).

A layer is considered "closed" immediately after it has been [dismissed](/up.Layer.prototype.dismiss)
or [accepted](/up.Layer.prototype.dismiss). If the closing is animated, a layer may be considered "closed" while
closing animation is still playing.

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
