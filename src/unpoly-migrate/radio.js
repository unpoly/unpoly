/*-
@module up.radio
*/

up.migrate.renamedProperty(up.radio.config, 'hungry', 'hungrySelectors')

up.radio.config.pollEnabled = true
let pollEnabledRef = up.migrate.removedProperty(up.radio.config, 'pollEnabled', 'The configuration up.radio.config.pollEnabled has been removed. To disable polling, prevent up:fragment:poll instead.')

up.on('up:fragment:poll', function(event) {
  if (!pollEnabledRef[0]) {
    event.preventDefault()
  }
})
