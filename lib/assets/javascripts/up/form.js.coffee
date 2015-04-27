###*
Forms and controls
==================
  
Up.js comes with functionality to submit forms without
leaving the current page. This means you can replace page fragments,
open dialogs with sub-forms, etc. all without losing form state.
  
\#\#\# Incomplete documentation!
  
We need to work on this page:
  
- Explain how to display form errors
- Explain that the server needs to send 2xx or 5xx status codes so
  Up.js can decide whether the form submission was successful
- Explain that the server needs to send an `X-Up-Current-Location` header
  if an successful form submission resulted in a redirect
- Examples
  

  
@class up.form
###
up.form = (->
  
  u = up.util

  ###*
  Submits a form using the Up.js flow:
  
      up.submit('form.new_user')
  
  Instead of loading a new page, the form is submitted via AJAX.
  The response is parsed for a CSS selector and the matching elements will
  replace corresponding elements on the current page.
  
  @method up.submit
  @param {Element|jQuery|String} formOrSelector
    A reference or selector for the form to submit.
    If the argument points to an element that is not a form,
    Up.js will search its ancestors for the closest form.
  @param {String} [options.url]
  @param {String} [options.method]
  @param {String} [options.target]
  @param {String} [options.failTarget]
  @param {Boolean|String} [options.history=true]
    Successful form submissions will add a history entry and change the browser's
    location bar if the form either uses the `GET` method or the response redirected
    to another page (this requires the `upjs-rails` gem).
    If want to prevent history changes in any case, set this to `false`.
    If you pass a `String`, it is used as the URL for the browser history.
  @param {String} [options.transition]
  @param {String} [options.failTransition]
  @return {Promise}
    A promise for the AJAX response
  ###
  submit = (formOrSelector, options) ->
    
    $form = $(formOrSelector).closest('form')

    options = u.options(options)
    successSelector = u.option(options.target, $form.attr('up-target'), 'body')
    failureSelector = u.option(options.failTarget, $form.attr('up-fail-target'), -> u.createSelectorFromElement($form))
    historyOption = u.option(options.history, $form.attr('up-history'), true)
    successTransition = u.option(options.transition, $form.attr('up-transition'))
    failureTransition = u.option(options.failTransition, $form.attr('up-fail-transition'))
    httpMethod = u.option(options.method, $form.attr('up-method'), $form.attr('data-method'), $form.attr('method'), 'post').toUpperCase()
    url = u.option(options.url, $form.attr('action'), up.browser.url())
    
    $form.addClass('up-active')
    
    if !up.browser.canPushState() && !u.castsToFalse(historyOption)
      $form.get(0).submit()
      return

    request = {
      url: url
      type: httpMethod
      data: $form.serialize(),
      selector: successSelector
    }

    successUrl = (xhr) ->
      url = if historyOption
        if historyOption == 'false'
          false
        else if u.isString(historyOption)
          historyOption
        else if currentLocation = u.locationFromXhr(xhr)
          currentLocation
        else if request.type == 'GET'
          request.url + '?' + request.data
      u.option(url, false)

    u.ajax(request)
      .always ->
        $form.removeClass('up-active')
      .done (html, textStatus, xhr) ->
        up.flow.implant(successSelector, html,
          history: successUrl(xhr),
          transition: successTransition
        )
      .fail (xhr, textStatus, errorThrown) ->
        html = xhr.responseText
        up.flow.implant(failureSelector, html,
          transition: failureTransition
        )

  ###*
  Observes an input field and executes code when its value changes.

      up.observe('input', { change: function(value, $input) {
        up.submit($input)
      } });

  This is useful for observing text fields while the user is typing,
  since browsers will only fire a `change` event once the user
  blurs the text field.

  @method up.observe
  @param {Element|jQuery|String} fieldOrSelector
  @param {Function(value, $field)|String} options.change
    The callback to execute when the field's value changes.
    If given as a function, it must take two arguments (`value`, `$field`).
    If given as a string, it will be evaled as Javascript code in a context where
    (`value`, `$field`) are set.
  @param {Number} [options.delay=100]
    The number of miliseconds to wait before executing the callback
    after the input value changes. Use this to limit how often the callback
    will be invoked for a fast typist.
  ###
  observe = (fieldOrSelector, options) ->

    $field = $(fieldOrSelector)
    options = u.options(options)
    delay = u.option($field.attr('up-delay'), options.delay, 0)
    delay = parseInt(delay)
    delay = 100

    knownValue = null
    callback = null
    callbackTimer = null

    if codeOnChange = $field.attr('up-observe')
      callback = (value, $field) ->
        console.log("Change!", value)
        eval(codeOnChange)
    else if options.change
      callback = options.change
    else
      u.error('observe: No change callback given')

    callbackPromise = u.resolvedPromise()

    nextCallback = null

    runNextCallback = ->
      if nextCallback
        returnValue = nextCallback()
        nextCallback = null
        returnValue

    check = ->
      value = $field.val()
      skipCallback = _.isNull(knownValue) # don't run the callback for the check during initialization
      if knownValue != value
        knownValue = value
        unless skipCallback
          clearTimer()
          nextCallback = -> callback.apply($field.get(0), [value, $field])
          callbackTimer = setTimeout(
            ->
              callbackPromise.then ->
                callbackReturn = runNextCallback()
                if u.isPromise(callbackReturn)
                  callbackPromise = callbackReturn
                else
                  callbackPromise = u.resolvedPromise()
          , delay
          )

    clearTimer = ->
      clearTimeout(callbackTimer)

    changeEvents = if up.browser.canInputEvent() then 'input' else 'keypress paste cut change click propertychange'
    $field.on changeEvents, check

    check()

    # return destructor
    return clearTimer

  ###*
  Submits the form through AJAX, searches the response for the selector
  given in `up-target` and replaces the selector content in the current page:

      <form method="post" action="/users" up-target=".main">
        ...
      </form>

  @method form[up-target]
  @ujs
  @param {String} up-target
  @param {String} [up-fail-target]
  @param {String} [up-transition]
  @param {String} [up-fail-transition]
  @param {String} [up-history]
  @param {String} [up-method]
    The HTTP method to be used to submit the form
    (`get`, `post`, `put`, `delete`, `patch`).
    Alternately you can use an attribute `data-method` (Rails UJS)
    or `method` (vanilla HTML) for the same purpose.  
  ###
  up.on 'submit', 'form[up-target]', (event, $form) ->
    event.preventDefault()
    submit($form)

  ###*
  Observes this form control by periodically polling its value.
  Executes the given Javascript if the value changes:

      <form method="GET" action="/search">
        <input type="query" up-observe="up.form.submit(this)">
      </form>

  This is useful for observing text fields while the user is typing,
  since browsers will only fire a `change` event once the user
  blurs the text field.

  @method input[up-observe]
  @ujs
  @param {String} up-observe 
  ###
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
