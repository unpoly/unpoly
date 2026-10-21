/*-
@module up.motion
*/

// up.motion.finish() already returns up.migrate.formerlyAsync() from core.

/*-
Returns whether Unpoly will perform animations and transitions.

Set [`up.motion.config.enabled = false`](/api/up.motion.config#config.enabled) in order to disable animations globally.

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
