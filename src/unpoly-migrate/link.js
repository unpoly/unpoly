/*-
@module up.link
*/

const followSelectorFn = up.link.config.selectorFn('followSelectors')
const submitSelectorFn = up.form.config.selectorFn('submitSelectors')
const preloadSelectorFn = up.link.config.selectorFn('preloadSelectors')

// Links and forms can open overlays, so old layer attributes are translated on both.
const layerOpenerSelectorFn = () => [followSelectorFn(), submitSelectorFn()].join()

up.migrate.renamedAttribute('up-flavor', 'up-mode', { scope: layerOpenerSelectorFn })
up.migrate.renamedAttribute('up-closable', 'up-dismissible', { scope: layerOpenerSelectorFn })
up.migrate.renamedAttribute('up-dismissable', 'up-dismissible', { scope: layerOpenerSelectorFn })
up.migrate.removedAttribute('up-width', { scope: layerOpenerSelectorFn, replacement: '[up-size] or [up-class]' })
up.migrate.removedAttribute('up-height', { scope: layerOpenerSelectorFn, replacement: '[up-size] or [up-class]' })
up.migrate.renamedAttribute('up-history-visible', 'up-history', { scope: layerOpenerSelectorFn })
up.migrate.renamedAttribute('up-clear-cache', 'up-expire-cache', { scope: layerOpenerSelectorFn })
up.migrate.renamedAttribute('up-bad-response-time', 'up-late-delay')

up.migrate.transformAttribute('up-solo', function(link, solo) {
  switch (solo) {
    case '':
      up.migrate.warn('Attribute [up-solo] has been replaced with [up-abort="all"] (found in %o)', link)
      link.setAttribute('up-abort', 'all')
      break
    case 'true':
      up.migrate.warn('Attribute [up-solo="true"] has been replaced with [up-abort="all"] (found in %o)', link)
      link.setAttribute('up-abort', 'all')
      break
    case 'false':
      up.migrate.warn('Attribute [up-solo="false"] has been replaced with [up-abort="false"] (found in %o)', link)
      up.migrate.warn('Unpoly 3+ only aborts requests targeting the same fragment. Setting [up-solo="false"] may no longer be necessary.')
      link.setAttribute('up-abort', 'false')
      break
    default:
      up.migrate.warn('Attribute [up-solo] has been renamed to [up-abort] and [up-abort] no longer accepts a URL pattern (found in %o). Check if you can use [up-abort="target"] instead.', link)
      link.setAttribute('up-abort', 'target')
  }
})

up.migrate.transformAttribute('up-reveal', function(link, reveal) {
  switch (reveal) {
    case '':
      up.migrate.warn('Attribute [up-reveal] has been replaced with [up-scroll="target"] (found in %o)', link)
      link.setAttribute('up-scroll', 'target')
      break
    case 'true':
      up.migrate.warn('Attribute [up-reveal="true"] has been replaced with [up-scroll="target"] (found in %o)', link)
      link.setAttribute('up-scroll', 'target')
      break
    case 'false':
      up.migrate.warn('Attribute [up-reveal="false"] has been replaced with [up-scroll="false"] (found in %o)', link)
      link.setAttribute('up-scroll', 'false')
      break
    default:
      up.migrate.warn('Attribute [up-reveal="%s"] has been replaced with [up-scroll="%s"] (found in %o)', reveal, reveal, link)
      link.setAttribute('up-scroll', reveal)
  }
})

up.migrate.transformAttribute('up-reset-scroll', function(link, resetScroll) {
  switch (resetScroll) {
    case '':
      up.migrate.warn('Attribute [up-reset-scroll] has been replaced with [up-scroll="top"] (found in %o)', link)
      link.setAttribute('up-scroll', 'top')
      break
    case 'true':
      up.migrate.warn('Attribute [up-reset-scroll="true"] has been replaced with [up-scroll="top"] (found in %o)', link)
      link.setAttribute('up-scroll', 'top')
      break
    case 'false':
      up.migrate.warn('Attribute [up-reset-scroll="false"] has been replaced with [up-scroll="false"] (found in %o)', link)
      link.setAttribute('up-scroll', 'false')
      break
  }
})

up.migrate.transformAttribute('up-restore-scroll', function(link, restoreScroll) {
  switch (restoreScroll) {
    case '':
      up.migrate.warn('Attribute [up-restore-scroll] has been replaced with [up-scroll="restore"] (found in %o)', link)
      link.setAttribute('up-scroll', 'restore')
      break
    case 'true':
      up.migrate.warn('Attribute [up-restore-scroll="true"] has been replaced with [up-scroll="restore"] (found in %o)', link)
      link.setAttribute('up-scroll', 'restore')
      break
    case 'false':
      up.migrate.warn('Attribute [up-restore-scroll="false"] has been replaced with [up-scroll="false"] (found in %o)', link)
      link.setAttribute('up-scroll', 'false')
      break
  }
})

/*-
[Follows](/api/up.follow) this link as fast as possible.

This is done by:

- [Following the link](/api/up-follow) without a full page load
- [Preloading the link's destination URL](/learn/preloading)
- [Triggering the link on `mousedown`](/api/up-instant) instead of on `click`

## Example

Use `[up-dash]` like this:

    <a href="/users" up-dash=".main">User list</a>

This is shorthand for:

    <a href="/users" up-target=".main" up-instant up-preload>User list</a>

@selector [up-dash]
@param [up-dash='body']
  The CSS selector to replace

  Inside the CSS selector you may refer to this link as `:origin`.
@deprecated
  To accelerate all links use `up.link.config.instantSelectors` and `up.link.config.preloadSelectors`.
*/
up.migrate.targetMacro('up-dash', { 'up-preload': '', 'up-instant': '' }, 'up.link.config.instantSelectors and up.link.config.preloadSelectors')

up.migrate.renamedAttribute('up-delay', 'up-preload-delay', { scope: preloadSelectorFn })

let preloadEnabledRef
up.link.config.patch(function(config) {
  preloadEnabledRef = up.migrate.removedProperty(config, 'preloadEnabled', { value: true, warning: 'The configuration up.link.config.preloadEnabled has been removed. To disable preloading, prevent up:link:preload instead.' })
})

up.on('up:link:preload', function(event) {
  if (!preloadEnabledRef[0]) {
    event.preventDefault()
  }
})

/*-
Makes any element [behave like a hyperlink](/learn/faux-interactive-elements).

## Example

The following `<span>` element will [navigate](/api/up-follow) to `/details` when clicked:

```html
<span up-href="/details">Read more</span>
```

@selector [up-href]
@param [up-href]
  The URL to load when activated.
@params-note
  All modifying attributes for `[up-follow]` may also be used.
@deprecated
  Following an element with only an `[up-href]` attribute is deprecated.
  Also set an `[up-follow]` attribute on the same element.
*/

const LEGACY_UP_HREF_FOLLOW_SELECTOR = '[up-href]:not([up-follow], [up-poll], [up-defer], [up-expand])'

// We set [up-follow] instead of adding our selector to up.link.config, so core and unpoly-migrate
// agree which elements are followable.
//
// The priority runs this macro before [up-back] (-100). That macro sets an [up-href] that the app never wrote,
// and only adds [up-follow] when the link isn't already followable, e.g. through [up-target].
// We also run before [up-clickable] (-200), which needs to see the [up-follow] attribute.
up.macro(LEGACY_UP_HREF_FOLLOW_SELECTOR, { priority: -50 }, function(element) {
  // A link like <a up-href up-target> is already followable through another attribute.
  if (up.link.isFollowable(element)) return

  up.migrate.warn('Following links with only [up-href] has been deprecated. You must now also set an [up-follow] on the same link (found in %o).', element)
  element.setAttribute('up-follow', '')
})

// We used to follow links with just an [up-instant] attribute.
// Now that [up-instant] is also a way to make generic clickable elements "act on press"
// we require users to set an [up-follow] attribute.
// We don't need to match [up-href] elements, since the macro above gives them [up-follow].
const LEGACY_UP_INSTANT_FOLLOW_INTENT_SELECTOR = 'a[href][up-instant]'

up.link.config.patch(function(config) {
  config.followSelectors.push(LEGACY_UP_INSTANT_FOLLOW_INTENT_SELECTOR)
})

// Only warn about links that the legacy selector alone makes followable.
function isFollowableWithoutLegacyInstant(element) {
  let { followSelectors, noFollowSelectors } = up.link.config
  let modernFollowSelectors = followSelectors.filter((selector) => selector !== LEGACY_UP_INSTANT_FOLLOW_INTENT_SELECTOR)
  return element.matches(up.element.unionSelector(modernFollowSelectors, noFollowSelectors))
}

up.compiler(LEGACY_UP_INSTANT_FOLLOW_INTENT_SELECTOR, function(element) {
  if (up.link.isFollowable(element) && !isFollowableWithoutLegacyInstant(element)) {
    up.migrate.warn('Following links with only [up-instant] has been deprecated. You must now also set an [up-follow] on the same link (found in %o).', element)
  }
})
