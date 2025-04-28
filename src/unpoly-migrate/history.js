/*-
@module up.history
*/

up.history.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'popTargets', 'restoreTargets')
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
  this.updateMetaTagsValue = this.updateMetaTags
  this.updateMetaTagsSet = false

  Object.defineProperty(this, 'updateMetaTags', {
    configurable: true,
    get() {
      return this.updateMetaTagsValue
    },
    set(value) {
      this.updateMetaTagsValue = value
      this.updateMetaTagsSet = true
    }
  })
})

up.on('up:framework:boot', function() {
  if (!up.history.config.updateMetaTagsSet) {
    up.migrate.warn('Meta tags in the <head> are now updated automatically. Configure up.history.config.updateMetaTags to remove this warning.')
  }
})

// up.compiler('[up-hungry]')

up.migrate.warnOfHungryMetaTags = function(metaTags) {
  let fullHungrySelector = up.radio.config.selector('hungrySelectors')
  let hungryMetaTags = up.util.filter(metaTags, (meta) => meta.matches(fullHungrySelector))
  if (hungryMetaTags.length) {
    up.migrate.warn('Meta tags in the <head> are now updated automatically. Remove the [up-hungry] attribute from %o.', hungryMetaTags)
  }
}
