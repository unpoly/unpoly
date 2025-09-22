/*-
@module up.framework
*/

// The up:app:booted event has never been public API, but people have been using it as it was visible in the log.
up.migrate.renamedEvent('up:app:booted', 'up:framework:booted')

if (document.querySelector('script[up-boot=manual]')) {
  // We cannot make any migration changes here, because this line is evaled too late.
  // unpoly.js has already tested whether a manual boot is required.
  up.migrate.warn('The [up-boot="manual"] attribute must be set on the <html> element')
}
