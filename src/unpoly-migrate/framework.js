/*-
@module up.framework
*/

// The up:app:booted event has never been public API, but people have been using it as it was visible in the log.
up.migrate.renamedEvent('up:app:booted', 'up:framework:booted')
