up.form = (->

  ###
  # Submits a form using the Up.js flow.
  #
  # @return {Promise} A promise for the AJAX call.
  ###
  submit = (form, options) ->
    options = up.util.options(options)
    $form = $(form)
    successSelector = options.target || $form.attr('up-target') || 'body'
    failureSelector = options.failTarget || $form.attr('up-fail-target') || up.util.createSelectorFromElement($form)
    pushHistory = options.history != false && $form.attr('up-history') != 'false'
    $form.addClass('up-active')

    request = {
      url: $form.attr('action') || location.href
      type: $form.attr('method')?.toUpperCase() || 'POST',
      data: $form.serialize(),
      selector: successSelector
    }

    success = (xhr) ->
      xhr.status == 200

    successUrl = (xhr) ->
      if pushHistory
        if redirectLocation = xhr.getResponseHeader('X-Up-Previous-Redirect-Location')
          redirectLocation
        else if request.type == 'GET'
          request.url + '?' + request.data

    promise = up.util.ajax(request)
    promise.always (html, textStatus, xhr) ->
      $form.removeClass('up-active')
      if success(xhr)
        up.flow.implant(successSelector, html, history: { url: successUrl(xhr) })
      else
        up.flow.implant(failureSelector, html)

    promise

  # Observes an input field by periodic polling and executes code when its value changes.
  observe = (field, options) ->

    $field = $(field)
    options = up.util.options(options, frequency: 500)
    knownValue = null
    timer = null
    callback = null
    if codeOnChange = $field.attr('up-observe')
      callback = (value, $field) ->
        eval(codeOnChange)
    else if options.change
      callback = options.change
    else
      up.util.error('observe: No change callback given')

    check = ->
      value = $field.val()
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
    return observe($field)

#  up.awaken '[up-autosubmit]', ($field) ->
#    return observe($field, change: ->
#      $form = $field.closest('form')
#      $field.addClass('up-active')
#      up.submit($form).always ->
#        $field.removeClass('up-active')
#    )

  submit: submit
  observe: observe

)()

up.submit = up.form.submit
up.observe = up.form.observe
