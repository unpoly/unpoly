declare module '../unpoly.js' {
  interface Up {
    motion: CoreApi['motion'] & {
      isEnabled(): boolean
    }
  }
}

// up.motion.finish() already returns up.migrate.formerlyAsync() from core.

up.motion.isEnabled = function() {
  up.migrate.deprecated('up.motion.isEnabled()', 'up.motion.config.enabled')
  return up.motion.config.enabled
}
