up.form = (->

  submit = (form, options) ->
    $form = $(form)
    successSelector = $form.attr('up-target') || 'body'
    failureSelector = $form.attr('up-fail-target') || up.util.createSelectorFromElement($form)
    $form.addClass('up-loading')
    request = {
      url: $form.attr('action') || location.href
      type: $form.attr('method') || 'POST',
      data: $form.serialize(),
      selector: successSelector
    }
    up.util.ajax(request).always((html, textStatus, xhr) ->
      $form.removeClass('up-loading')
      console.log("always args", xhr)
      if redirectLocation = xhr.getResponseHeader('X-Up-Previous-Redirect-Location')
        console.log("redirect location is", redirectLocation)
        up.flow.implant(successSelector, html, history: { url: redirectLocation })
      else
        up.flow.implant(failureSelector, html)
    )

  observe = (field, options) ->

    $field = $(field)
    options = up.util.options(frequency: 500)
    knownValue = null
    timer = null
    callback = null
    if codeOnChange = $field.attr('up-observe')
      callback = (value, $field) ->
        console.log("fire!!")
        eval(codeOnChange)
    else if options.change
      callback = options.change
    else
      up.util.error('observe: No change callback given')

    check = ->
      value = $field.val()
      console.log("checking", knownValue, value)
      skipCallback = _.isNull(knownValue) # don't run the callback for the check during initialization
      if knownValue != value
        knownValue = value
        callback.apply($field.get(0), [value, $field]) unless skipCallback

    resetTimer = ->
      if timer
        clearTimer()
        startTimer()

    clearTimer = ->
      clearInterval(timer)
      timer = null

    startTimer = ->
      timer = setInterval(check, options.frequency)

    # reset counter after user interaction
    $field.bind "keyup click mousemove", resetTimer # mousemove is for selects

    check()
    startTimer()

    # return destructor
    return clearTimer

  up.on 'submit', 'form[up-target]', (event, $form) ->
    event.preventDefault()
    submit($form)

  up.awaken '[up-observe]', ($field) ->
    # return destructor
    return observe($field)

  submit: submit
  observe: observe

)()

up.submit = up.form.submit
up.observe = up.form.observe
