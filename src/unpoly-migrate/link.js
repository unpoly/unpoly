/*-
@module up.link
*/

const followSelectorFn = up.link.config.selectorFn('followSelectors')
const preloadSelectorFn = up.link.config.selectorFn('preloadSelectors')

up.migrate.renamedAttribute('up-flavor', 'up-mode', { scope: followSelectorFn })
up.migrate.renamedAttribute('up-closable', 'up-dismissable', { scope: followSelectorFn })
up.migrate.removedAttribute('up-width', { scope: followSelectorFn, replacement: '[up-size] or [up-class]' })
up.migrate.removedAttribute('up-height', { scope: followSelectorFn, replacement: '[up-size] or [up-class]' })
up.migrate.renamedAttribute('up-history-visible', 'up-history', { scope: followSelectorFn })
up.migrate.renamedAttribute('up-clear-cache', 'up-expire-cache', { scope: followSelectorFn })

up.migrate.transformAttribute('up-solo', function(link, solo) {
  switch (solo) {
    case '':
      up.migrate.warn('Attribute [up-solo] has been replaced with [up-abort="all"]')
      link.setAttribute('up-abort', 'all')
      break
    case 'true':
      up.migrate.warn('Attribute [up-solo="true"] has been replaced with [up-abort="all"]')
      link.setAttribute('up-abort', 'all')
      break
    case 'false':
      up.migrate.warn('Attribute [up-solo="false"] has been replaced with [up-abort="false"]')
      up.migrate.warn('Unpoly 3+ only aborts requests targeting the same fragment. Setting [up-solo="false"] may no longer be necessary.')
      link.setAttribute('up-abort', 'false')
      break
    default:
      up.migrate.warn('Attribute [up-solo] has been renamed to [up-abort] and [up-abort] no longer accepts a URL pattern. Check if you can use [up-abort="target"] instead.')
      link.setAttribute('up-abort', 'target')
  }
})

up.migrate.transformAttribute('up-reveal', function(link, reveal) {
  switch (reveal) {
    case '':
      up.migrate.warn('Attribute [up-reveal] has been replaced with [up-scroll="target"]')
      link.setAttribute('up-scroll', 'target')
      break
    case 'true':
      up.migrate.warn('Attribute [up-reveal="true"] has been replaced with [up-scroll="target"]')
      link.setAttribute('up-scroll', 'target')
      break
    case 'false':
      up.migrate.warn('Attribute [up-reveal="false"] has been replaced with [up-scroll="false"]')
      link.setAttribute('up-scroll', 'false')
      break
    default:
      up.migrate.warn('Attribute [up-reveal="%s"] has been replaced with [up-scroll="%s"]', reveal)
  }
})

up.migrate.transformAttribute('up-reset-scroll', function(link, resetScroll) {
  switch (resetScroll) {
    case '':
      up.migrate.warn('Attribute [up-reset-scroll] has been replaced with [up-scroll="reset"]')
      link.setAttribute('up-scroll', 'reset')
      break
    case 'true':
      up.migrate.warn('Attribute [up-reset-scroll="true"] has been replaced with [up-scroll="reset"]')
      link.setAttribute('up-scroll', 'reset')
      break
    case 'false':
      up.migrate.warn('Attribute [up-reset-scroll="false"] has been replaced with [up-scroll="false"]')
      link.setAttribute('up-scroll', 'false')
      break
  }
})

up.migrate.transformAttribute('up-restore-scroll', function(link, restoreScroll) {
  switch (restoreScroll) {
    case '':
      up.migrate.warn('Attribute [up-restore-scroll] has been replaced with [up-scroll="restore"]')
      link.setAttribute('up-scroll', 'restore')
      break
    case 'true':
      up.migrate.warn('Attribute [up-restore-scroll="true"] has been replaced with [up-scroll="restore"]')
      link.setAttribute('up-scroll', 'restore')
      break
    case 'false':
      up.migrate.warn('Attribute [up-restore-scroll="false"] has been replaced with [up-scroll="false"]')
      link.setAttribute('up-scroll', 'false')
      break
  }
})

/*-
[Follows](/up.follow) this link as fast as possible.

This is done by:

- [Following the link through AJAX](/a-up-follow) instead of a full page load
- [Preloading the link's destination URL](/a-up-preload)
- [Triggering the link on `mousedown`](/a-up-instant) instead of on `click`

### Example

Use `[up-dash]` like this:

    <a href="/users" up-dash=".main">User list</a>

This is shorthand for:

    <a href="/users" up-target=".main" up-instant up-preload>User list</a>

@selector a[up-dash]
@param [up-dash='body']
  The CSS selector to replace

  Inside the CSS selector you may refer to this link as `:origin`.
@deprecated
  To accelerate all links use `up.link.config.instantSelectors` and `up.link.config.preloadSelectors`.
*/
up.migrate.targetMacro('up-dash', { 'up-preload': '', 'up-instant': '' }, () => up.migrate.deprecated('a[up-dash]', 'up.link.config.instantSelectors and up.link.config.preloadSelectors'))

up.migrate.renamedAttribute('up-delay', 'up-preload-delay', { scope: preloadSelectorFn })

up.link.config.preloadEnabled = true
let preloadEnabledRef = up.migrate.removedProperty(up.link.config, 'preloadEnabled', 'The configuration up.link.config.preloadEnabled has been removed. To disable preloading, prevent up:link:preload instead.')

up.on('up:link:preload', function(event) {
  if (!preloadEnabledRef[0]) {
    event.preventDefault()
  }
})
