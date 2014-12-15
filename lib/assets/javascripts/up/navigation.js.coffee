up.navigation = (->

  refreshNavigations = ->
    $('[up-navigation]').each ->
      $navigation = $(this)
      

  $(document).on("submit", "form[up-target]", (event) ->
    submit(this)
    false
  )

)()

