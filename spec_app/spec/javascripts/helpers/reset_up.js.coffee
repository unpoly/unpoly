afterEach ->
  console.debug('--- Resetting Unpoly after example ---')
  up.motion.finish()
  up.reset()
  $('.up-error').remove()
  console.debug('--- Unpoly was reset after example ---')
