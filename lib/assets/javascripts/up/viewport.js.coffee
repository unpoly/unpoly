###*
Scrolling
=========

@class up.viewport  
###
up.viewport = (->

  SCROLL_PROMISE_KEY = 'up-scroll-promise'
  
  u = up.util
  ###*
  @method up.scroll
  @param {Number} scrollPos
  @param {String|Element|jQuery} [options.duration=100]
  @returns {Deferred}
  @protected 
  ###
  scroll = (viewOrSelector, scrollPos, options) ->
    $view = $(viewOrSelector)
    options = u.options(options)
    duration = u.option(options.duration, 0)

    finishScrolling($view)

    deferred = $.Deferred()

    $view.data(SCROLL_PROMISE_KEY, deferred)
    deferred.then ->
      $view.removeData(SCROLL_PROMISE_KEY)
      $view.finish()

    targetProps =
      scrollTop: scrollPos

    $view.animate targetProps,
      duration: duration
      complete: -> deferred.resolve()

    deferred

  ###*
  @method up.viewport.finishScrolling
  @private
  ###
  finishScrolling = (elementOrSelector) ->
    $(elementOrSelector).each ->
      if existingScrolling = $(this).data(SCROLL_PROMISE_KEY)
        existingScrolling.resolve()

  ###*
  @method up.reveal
  @param {String|Element|jQuery} element
  @param {String|Element|jQuery} [options.view='body']
  @param {String|Element|jQuery} [options.duration=100]
  @param {Number} [options.padding=0]
  @returns {Deferred}
  @protected
  ###
  reveal = (elementOrSelector, options) ->
    options = u.options(options)
    view = u.option(options.view, 'body')
    padding = u.option(options.padding, 0)

    $element = $(elementOrSelector)
    $view = $(view)

    viewHeight = $view.height()
    scrollPos = $view.scrollTop()

    firstVisibleRow = scrollPos
    lastVisibleRow = scrollPos + viewHeight

    elementTop = $element.position().top
    
    elementTooHigh = elementTop - padding < firstVisibleRow
    elementTooLow = elementTop > lastVisibleRow - padding

    if elementTooHigh || elementTooLow
      scrollPos = elementTop - padding
      scrollPos = Math.max(scrollPos, 0)
      scrollPos = Math.min(scrollPos, viewHeight - 1)
      scroll($view, scrollPos, options)
    else
      u.resolvedDeferred()

  reveal: reveal
  scroll: scroll
  finishScrolling: finishScrolling

)()

up.scroll = up.viewport.scroll
up.reveal = up.viewport.reveal
