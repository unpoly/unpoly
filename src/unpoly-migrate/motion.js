let modernFinish = up.motion.finish

up.motion.finish = function(...args) {
  modernFinish(...args)
  return up.migrate.formerlyAsync('up.motion.finish()')
}

/*-
Returns whether Unpoly will perform animations and transitions.

Set [`up.motion.config.enabled = false`](/up.motion.config#config.enabled) in order to disable animations globally.

@function up.motion.isEnabled
@return {boolean}
  Whether animation is enabled.
@deprecated
  Use `up.motion.config.enabled` instead.
*/
up.motion.isEnabled = function() {
  up.migrate.deprecated('up.motion.isEnabled()', 'up.motion.config.enabled')
  return up.motion.config.enabled
}
