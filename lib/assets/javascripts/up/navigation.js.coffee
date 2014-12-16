up.navigation = (->

  refreshNavigations = ->
    $('[up-navigation]').each ->
      $navigation = $(this)

  sectionClicked($section) = ->

  up.magic.app.selector("[up-navigation] [href]", "click", (event) ->
    event.preventDefault()
    sectionClicked($(this))
  )

)()

