/*-
@module up.util
*/

/*-
Returns a copy of the given object that only contains
the given keys.

@function up.util.only
@param {Object} object
@param {Array} ...keys
@deprecated
  Use `up.util.pick()` instead.
*/
up.util.only = function(object, ...keys) {
  up.migrate.deprecated('up.util.only(object, ...keys)', 'up.util.pick(object, keys)')
  return up.util.pick(object, keys)
}

/*-
Returns a copy of the given object that contains all except
the given keys.

@function up.util.except
@param {Object} object
@param {Array} ...keys
@deprecated
  Use `up.util.omit(object, keys)` (with an array argument) instead of `up.util.object(...keys)` (with rest arguments).
*/
up.util.except = function(object, ...keys) {
  up.migrate.deprecated('up.util.except(object, ...keys)', 'up.util.omit(object, keys)')
  return up.util.omit(object, keys)
}

up.util.parseUrl = function(...args) {
  up.migrate.deprecated('up.util.parseUrl()', 'up.util.parseURL()')
  return up.util.parseURL(...args)
}

up.util.any = function(...args) {
  up.migrate.deprecated('up.util.any()', 'up.util.some()')
  return up.util.some(...args)
}

up.util.all = function(...args) {
  up.migrate.deprecated('up.util.all()', 'up.util.every()')
  return up.util.every(...args)
}

up.util.detect = function(...args) {
  up.migrate.deprecated('up.util.detect()', 'up.util.find()')
  return up.util.find(...args)
}

up.util.select = function(...args) {
  up.migrate.deprecated('up.util.select()', 'up.util.filter()')
  return up.util.filter(...args)
}

up.util.setTimer = function(...args) {
  up.migrate.deprecated('up.util.setTimer()', 'up.util.timer()')
  return up.util.timer(...args)
}

up.util.escapeHtml = function(...args) {
  up.migrate.deprecated('up.util.escapeHtml()', 'up.util.escapeHTML()')
  return up.util.escapeHTML(...args)
}

up.util.selectorForElement = function(...args) {
  up.migrate.deprecated('up.util.selectorForElement()', 'up.fragment.toTarget()')
  return up.fragment.toTarget(...args)
}

up.util.nextFrame = function(...args) {
  up.migrate.deprecated('up.util.nextFrame()', 'up.util.task()')
  return up.util.task(...args)
}

/*-
Calls the given function for the given number of times.

@function up.util.times
@param {number} count
@param {Function()} block
@deprecated
  Use a `for` loop instead.
*/
up.util.times = function(count, block) {
  for (let i = 0; i < count; i++) {
    block()
  }
}

// Remove with IE11
up.util.assignPolyfill = function(target, ...sources) {
  for (let source of sources) {
    for (let key in source) {
      target[key] = source[key]
    }
  }
  return target
}

/*-
Merge the own properties of one or more `sources` into the `target` object.

@function up.util.assign
@param {Object} target
@param {Array<Object>} sources...
@deprecated
  Use `Object.assign()` instead.
*/
up.util.assign = Object.assign || up.util.assignPolyfill

// Remove with IE11
function valuesPolyfill(object) {
  return Object.keys(object).map((key) => object[key])
}

/*-
Returns an array of values of the given object.

@function up.util.values
@param {Object} object
@return {Array<string>}
@deprecated
  Use `Object.values()` instead.
*/
up.util.values = Object.values || valuesPolyfill
