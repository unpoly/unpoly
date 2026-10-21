/*-
@module up.history
*/

up.history.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'popTargets', 'restoreTargets', { label: 'up.history.config' })
})

/*-
Returns a normalized URL for the current history entry.

@function up.history.url
@return {string}
@deprecated Use the `up.history.location` property instead.
*/
up.history.url = function() {
  up.migrate.deprecated('up.history.url()', 'up.history.location')
  return up.history.location
}

up.migrate.renamedEvent('up:history:push', 'up:location:changed')
up.migrate.renamedEvent('up:history:pushed', 'up:location:changed')
up.migrate.renamedEvent('up:history:restore', 'up:location:changed')
up.migrate.renamedEvent('up:history:restored', 'up:location:changed')
// There was never an up:history:replace (present tense) event
up.migrate.renamedEvent('up:history:replaced', 'up:location:changed')

up.migrate.prepareLocationChangedEvent = function(event) {
  up.migrate.renamedProperty(event, 'url', 'location')
  // up.migrate.removedProperty(event, 'reason')
}


up.history.config.patch(function() {
  Object.defineProperty(this, 'updateMetaTags', {
    configurable: true,
    get() {
      return up.history.isEnabled('metaTags')
    },
    set(value) {
      // Apps used to set { updateMetaTags: true } to silence an old warning.
      // Since that is the default, we accept it without a warning.
      if (value) return

      // (1) This changes up.history.config.enabled once.
      // (2) When the app sets up.history.config.enabled afterwards, meta tags are updated again
      //     if the new value includes them. We accept this, and point to the array in the deprecation.
      up.migrate.deprecated('up.history.config.updateMetaTags = false', "an array of aspects without 'metaTags' in up.history.config.enabled")
      let { enabled } = this
      if (enabled === true) enabled = ['location', 'title', 'lang']
      if (up.util.isArray(enabled)) this.enabled = enabled.filter((aspect) => aspect !== 'metaTags')
    }
  })
})

// up.compiler('[up-hungry]')

up.migrate.warnOfHungryMetaTags = function(metaTags) {
  // Meta tags are not updated automatically when up.history.config.enabled excludes them.
  if (!up.history.isEnabled('metaTags')) return

  let fullHungrySelector = up.radio.config.selector('hungrySelectors')
  let hungryMetaTags = up.util.filter(metaTags, (meta) => meta.matches(fullHungrySelector))
  if (hungryMetaTags.length) {
    up.migrate.warn('Meta tags in the <head> are now updated automatically. Remove the [up-hungry] attribute from %o.', hungryMetaTags)
  }
}
