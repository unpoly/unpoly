###*
Viewport scrolling
==================

This modules contains functions to scroll the viewport and reveal contained elements.

By default Up.js will always scroll to an element before updating it.

@class up.viewport  
###
up.viewport = (->

  u = up.util

  config =
    duration: 0
    view: 'body'
    easing: 'swing'

  ###*
  @method up.viewport.defaults
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @param {Number} [options.padding]
  @param {String|Element|jQuery} [options.view]
  ###
  defaults = (options) ->
    u.extend(config, options)

  SCROLL_PROMISE_KEY = 'up-scroll-promise'

  ###*
  @method up.scroll
  @param {String|Element|jQuery} viewOrSelector
  @param {Number} scrollPos
  @param {String}[options.duration]
  @param {String}[options.easing]
  @returns {Deferred}
  @protected 
  ###
  scroll = (viewOrSelector, scrollPos, options) ->
    $view = $(viewOrSelector)
    options = u.options(options)
    duration = u.option(options.duration, config.duration)
    easing = u.option(options.easing, config.easing)

    finishScrolling($view)

    if duration > 0
      deferred = $.Deferred()

      $view.data(SCROLL_PROMISE_KEY, deferred)
      deferred.then ->
        $view.removeData(SCROLL_PROMISE_KEY)
        $view.finish()

      targetProps =
        scrollTop: scrollPos

      $view.animate targetProps,
        duration: duration,
        easing: easing,
        complete: -> deferred.resolve()

      deferred
    else
      $view.scrollTop(scrollPos)
      u.resolvedDeferred()

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
  @param {String|Element|jQuery} [options.view]
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @param {Number} [options.padding]
  @returns {Deferred}
  @protected
  ###
  reveal = (elementOrSelector, options) ->

    options = u.options(options)
    view = u.option(options.view, config.view)
    padding = u.option(options.padding, config.padding)

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
  defaults: defaults

)()

up.scroll = up.viewport.scroll
up.reveal = up.viewport.reveal
