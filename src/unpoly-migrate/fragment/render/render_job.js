up.migrate.renamedProperty(
  up.RenderJob.prototype,
  'options',
  'renderOptions',
  { warning: 'up.RenderJob: Property { options } has been renamed to { renderOptions }' }
)
