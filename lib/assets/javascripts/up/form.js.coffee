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
- Explain that the server needs to send `X-Up-Location` and `X-Up-Method` headers
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
    The URL where to submit the form.
    Defaults to the form's `action` attribute, or to the current URL of the browser window.
  @param {String} [options.method]
    The HTTP method used for the form submission.
    Defaults to the form's `up-method`, `data-method` or `method` attribute, or to `'post'`
    if none of these attributes are given.
  @param {String} [options.target]
    The selector to update when the form submission succeeds (server responds with status 200).
    Defaults to the form's `up-target` attribute, or to `'body'`.
  @param {String} [options.failTarget]
    The selector to update when the form submission fails (server responds with non-200 status).
    Defaults to the form's `up-fail-target` attribute, or to an auto-generated
    selector that matches the form itself.
  @param {Boolean|String} [options.history=true]
    Successful form submissions will add a history entry and change the browser's
    location bar if the form either uses the `GET` method or the response redirected
    to another page (this requires the `upjs-rails` gem).
    If want to prevent history changes in any case, set this to `false`.
    If you pass a `String`, it is used as the URL for the browser history.
  @param {String} [options.transition='none']
    The transition to use when a successful form submission updates the `options.target` selector.
    Defaults to the form's `up-transition` attribute, or to `'none'`.
  @param {String} [options.failTransition='none']
    The transition to use when a failed form submission updates the `options.failTarget` selector.
    Defaults to the form's `up-fail-transition` attribute, or to `options.transition`, or to `'none'`.
  @param {Number} [options.duration]
    The duration of the transition. See [`up.morph`](/up.motion#up.morph).
  @param {Number} [options.delay]
    The delay before the transition starts. See [`up.morph`](/up.motion#up.morph).
  @param {String} [options.easing]
    The timing function that controls the transition's acceleration. [`up.morph`](/up.motion#up.morph).
  @param {Boolean} [options.cache]
    Whether to accept a cached response.
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
    failureTransition = u.option(options.failTransition, $form.attr('up-fail-transition'), successTransition)
    httpMethod = u.option(options.method, $form.attr('up-method'), $form.attr('data-method'), $form.attr('method'), 'post').toUpperCase()
    animateOptions = up.motion.animateOptions(options, $form)
    useCache = u.option(options.cache, $form.attr('up-cache'))
    url = u.option(options.url, $form.attr('action'), up.browser.url())
    
    $form.addClass('up-active')
    
    if !up.browser.canPushState() && !u.castsToFalse(historyOption)
      $form.get(0).submit()
      return

    request = {
      url: url
      method: httpMethod
      data: $form.serialize()
      selector: successSelector
      cache: useCache
    }

    successUrl = (xhr) ->
      url = if historyOption
        if u.castsToFalse(historyOption)
          false
        else if u.isString(historyOption)
          historyOption
        else if currentLocation = u.locationFromXhr(xhr)
          currentLocation
        else if request.type == 'GET'
          request.url + '?' + request.data
      u.option(url, false)

    up.proxy.ajax(request)
      .always ->
        $form.removeClass('up-active')
      .done (html, textStatus, xhr) ->
        successOptions = u.merge(animateOptions,
          history: successUrl(xhr),
          transition: successTransition
        )
        up.flow.implant(successSelector, html, successOptions)
      .fail (xhr, textStatus, errorThrown) ->
        html = xhr.responseText
        failureOptions = u.merge(animateOptions, transition: failureTransition)
        up.flow.implant(failureSelector, html, failureOptions)

  ###*
  Observes a form field and runs a callback when its value changes.
  This is useful for observing text fields while the user is typing.

  For instance, the following would submit the form whenever the
  text field value changes:

      up.observe('input', { change: function(value, $input) {
        up.submit($input)
      } });

  \#\#\#\# Preventing concurrency

  Firing asynchronous code after a form field can cause
  [concurrency issues](https://makandracards.com/makandra/961-concurrency-issues-with-find-as-you-type-boxes).

  To mitigate this, `up.observe` will try to never run a callback
  before the previous callback has completed.
  To take advantage of this, your callback code must return a promise.
  Note that all asynchronous Up.js functions return promises.

  \#\#\#\# Throttling

  If you are concerned about fast typists causing too much
  load on your server, you can use a `delay` option to wait before
  executing the callback:

      up.observe('input', {
        delay: 100,
        change: function(value, $input) { up.submit($input) }
      });


  @method up.observe
  @param {Element|jQuery|String} fieldOrSelector
  @param {Function(value, $field)|String} options.change
    The callback to execute when the field's value changes.
    If given as a function, it must take two arguments (`value`, `$field`).
    If given as a string, it will be evaled as Javascript code in a context where
    (`value`, `$field`) are set.
  @param {Number} [options.delay=0]
    The number of miliseconds to wait before executing the callback
    after the input value changes. Use this to limit how often the callback
    will be invoked for a fast typist.
  ###
  observe = (fieldOrSelector, options) ->

    $field = $(fieldOrSelector)
    options = u.options(options)
    delay = u.option($field.attr('up-delay'), options.delay, 0)
    delay = parseInt(delay)

    knownValue = null
    callback = null
    callbackTimer = null

    if codeOnChange = $field.attr('up-observe')
      callback = (value, $field) ->
        eval(codeOnChange)
    else if options.change
      callback = options.change
    else
      u.error('up.observe: No change callback given')

    callbackPromise = u.resolvedPromise()

    # This holds the next callback function, curried with `value` and `$field`.
    # Since we're waiting for callback promises to resolve before running
    # another callback, this might be overwritten while we're waiting for a
    # previous callback to finish.
    nextCallback = null

    runNextCallback = ->
      if nextCallback
        returnValue = nextCallback()
        nextCallback = null
        returnValue

    check = ->
      value = $field.val()
      # don't run the callback for the check during initialization
      skipCallback = u.isNull(knownValue)
      if knownValue != value
        knownValue = value
        unless skipCallback
          clearTimer()
          nextCallback = -> callback.apply($field.get(0), [value, $field])
          callbackTimer = setTimeout(
            ->
              # Only run the callback once the previous callback's
              # promise resolves.
              callbackPromise.then ->
                returnValue = runNextCallback()
                # If the callback returns a promise, we will remember it
                # and chain additional callback invocations to it.
                if u.isPromise(returnValue)
                  callbackPromise = returnValue
                else
                  callbackPromise = u.resolvedPromise()
          , delay
          )

    clearTimer = ->
      clearTimeout(callbackTimer)

    changeEvents = if up.browser.canInputEvent()
      # Actually we only need `input`, but we want to notice
      # if another script manually triggers `change` on the element.
      'input change'
    else
      # Actually we won't ever get `input` from the user in this browser,
      # but we want to notice if another script  manually triggers `input`
      # on the element.
      'input change keypress paste cut click propertychange'
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
    The selector to replace if the form submission is successful (200 status code).
  @param {String} [up-fail-target]
  @param {String} [up-transition]
  @param {String} [up-fail-transition]
  @param {String} [up-history]
  @param {String} [up-method]
    The HTTP method to be used to submit the form (`get`, `post`, `put`, `delete`, `patch`).
    Alternately you can use an attribute `data-method`
    ([Rails UJS](https://github.com/rails/jquery-ujs/wiki/Unobtrusive-scripting-support-for-jQuery))
    or `method` (vanilla HTML) for the same purpose.  
  ###
  up.on 'submit', 'form[up-target]', (event, $form) ->
    event.preventDefault()
    submit($form)

  ###*
  Observes this form field and runs the given script
  when its value changes. This is useful for observing text fields
  while the user is typing.

  For instance, the following would submit the form whenever the
  text field value changes:

      <form method="GET" action="/search">
        <input type="query" up-observe="up.form.submit(this)">
      </form>

  The script given with `up-observe` runs with the following context:

  | Name     | Type      | Description                           |
  | -------- | --------- | ------------------------------------- |
  | `value`  | `String`  | The current value of the field        |
  | `this`   | `Element` | The form field                        |
  | `$field` | `jQuery`  | The form field as a jQuery collection |

  See up.observe.

  @method input[up-observe]
    The code to run when the field's value changes.
  @ujs
  @param {String} up-observe 
  ###
  up.compiler '[up-observe]', ($field) ->
    return observe($field)

#  up.compiler '[up-autosubmit]', ($field) ->
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
