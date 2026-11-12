// A deprecated alias has the type of the namespace that replaces it.
declare module '../unpoly.js' {
  interface Up {
    readonly navigation: Up['status']
    readonly feedback: Up['status']
  }
}

up.migrate.renamedNamespace('navigation', 'status')
up.migrate.renamedNamespace('feedback', 'status')

up.status.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'navs', 'navSelectors', { label: 'up.status.config' })
})
