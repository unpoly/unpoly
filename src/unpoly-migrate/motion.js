let modernFinish = up.motion.finish

up.motion.finish = function(...args) {
  modernFinish(...args)
  return up.migrate.formerlyAsync('up.motion.finish()')
}
