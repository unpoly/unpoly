u = up.util

class up.Waypoint extends up.Record

  update: =>
    @updateUrl()
    @updateTime()
    @updateScrollTops()
    @updateFormEntries()

  isDisplayed: ->
    !!up.first(u.attributeSelector('up-waypoint', @name))

  updateUrl: (url) ->
    @url = url || up.browser.url()

  updateTime: (time) ->
    @time = time || new Date()

  updateScrollTops: (scrollTops) ->
    @scrollTops = scrollTops || up.util.scrollTops()

  updateFormEntries: (formEntries) ->
    @formEntries = formEntries || @serializeSaveableForms()

  serializeSaveableForms: ->
    $forms = all('form[up-save-form]')
    u.flatMap $forms, (form) -> $(form).serializeArray()
