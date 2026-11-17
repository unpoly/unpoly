// Adds members to up.Layer that core doesn't declare, so they exist only with unpoly-migrate.
declare module '../../unpoly/layer/layer.js' {
  interface Layer {
    isOpen(): boolean
    isClosed(): boolean
    readonly historyVisible: Layer['history']
  }
}

up.Layer.prototype.isOpen = function() {
  up.migrate.deprecated('up.Layer#isOpen()', 'up.Layer#isAlive()')
  return this.isAlive()
}

up.Layer.prototype.isClosed = function() {
  up.migrate.deprecated('up.Layer#isClosed()', '!up.Layer#isAlive()')
  return !this.isAlive()
}

Object.defineProperty(up.Layer.prototype, 'historyVisible', { get: function() {
  up.migrate.deprecated('up.Layer#historyVisible', 'up.Layer#history')
  return this.history
} })
