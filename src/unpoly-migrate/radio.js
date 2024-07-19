const e = up.element

/*-
@module up.radio
*/

up.radio.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'hungry', 'hungrySelectors')
})

up.radio.config.pollEnabled = true
let pollEnabledRef

up.radio.config.patch(function(config) {
  pollEnabledRef = up.migrate.removedProperty(config, 'pollEnabled', 'The configuration up.radio.config.pollEnabled has been removed. To disable polling, prevent up:fragment:poll instead.')
})

up.on('up:fragment:poll', function(event) {
  if (!pollEnabledRef[0]) {
    event.preventDefault()
  }
})

up.compiler('[up-hungry][up-if-history]', function(element) {
  let ifHistory = e.booleanAttr(element, 'up-if-history')
  if (!ifHistory) return

  element.addEventListener('up:fragment:hungry', function(event) {
    if (!event.renderOptions.history) {
      event.preventDefault()
    }
  })
})
