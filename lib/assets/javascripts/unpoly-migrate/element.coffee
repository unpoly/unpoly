###**
@module up.element
###

up.element.first = (args...) ->
  up.migrate.deprecated('up.element.first()', 'up.element.get()')
  return up.element.get(args...)

up.element.createFromHtml = (args...) ->
  up.migrate.deprecated('up.element.createFromHtml', 'up.element.createFromHTML')
  return up.element.createFromHTML(args...)
