###**
@module up.util
###

###**
Returns a copy of the given object that only contains
the given keys.

@function up.util.only
@param {Object} object
@param {Array} keys...
@deprecated
  Use `up.util.pick()` instead.
###
up.util.only = (object, keys...) ->
  up.migrate.deprecated('up.util.only(object, keys...)', 'up.util.pick(object, keys)')
  return up.util.pick(object, keys)

###**
Returns a copy of the given object that contains all except
the given keys.

@function up.util.except
@param {Object} object
@param {Array} keys...
@deprecated
  Use `up.util.omit()` instead.
###
up.util.except = (object, keys...) ->
  up.migrate.deprecated('up.util.except(object, keys...)', 'up.util.omit(object, keys)')
  return up.util.omit(object, keys)

up.util.parseUrl = (args...) ->
  up.migrate.warn('up.util.parseUrl() has been renamed to up.util.parseURL()')
  return up.util.parseURL(args...)

up.util.any = (args...) ->
  up.migrate.warn('up.util.any() has been renamed to up.util.some()')
  return some(args...)

up.util.all = (args...) ->
  up.migrate.warn('up.util.all() has been renamed to up.util.every()')
  return up.util.every(args...)

up.util.detect = (args...) ->
  up.migrate.warn('up.util.detect() has been renamed to up.util.find()')
  return up.util.find(args...)

up.util.select = (args...) ->
  up.migrate.warn('up.util.select() has been renamed to up.util.filter()')
  return up.util.filter(args...)

up.util.setTimer = (args...) ->
  up.migrate.warn('up.util.setTimer() has been renamed to up.util.timer()')
  return up.util.timer(args...)

up.util.escapeHtml = (args...) ->
  up.migrate.deprecated('up.util.escapeHtml', 'up.util.escapeHTML')
  return up.util.escapeHTML(args...)

up.util.selectorForElement = (args...) ->
  up.migrate.warn('up.util.selectorForElement() has been renamed to up.fragment.toTarget()')
  return up.fragment.toTarget(args...)

up.util.nextFrame = (args...) ->
  up.migrate.warn('up.util.nextFrame() has been renamed to up.util.task()')
  return up.util.task(args...)
