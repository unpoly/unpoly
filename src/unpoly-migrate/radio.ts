const e = up.element

type FragmentHungryEvent = import('../unpoly/radio.js').FragmentHungryEvent

up.radio.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'hungry', 'hungrySelectors', { label: 'up.radio.config' })
})

let pollEnabledRef: [boolean]

up.radio.config.patch(function(config) {
  pollEnabledRef = up.migrate.removedProperty(config, 'pollEnabled', { value: true, warning: 'The configuration up.radio.config.pollEnabled has been removed. To disable polling, prevent up:fragment:poll instead.' })
})

up.on('up:fragment:poll', function(event) {
  if (!pollEnabledRef[0]) {
    event.preventDefault()
  }
})

up.compiler('[up-hungry][up-if-history]', function(element) {
  let ifHistory = e.booleanAttr(element, 'up-if-history')
  if (!ifHistory) return

  up.migrate.warn('Attribute [up-if-history] has been deprecated. Use [up-on-hungry="if (!renderOptions.history) event.preventDefault()"] instead (found in %o).', element)

  element.addEventListener('up:fragment:hungry', function(event: FragmentHungryEvent) {
    if (!event.renderOptions.history) {
      event.preventDefault()
    }
  })
})
