up.flow = (->

  rememberSource = ($element) ->
    $element.attr("up-source", location.href)

  recallSource = ($element) ->
    $source = $element.closest("[up-source]")
    $source.attr("up-source") || location.href

  replace = (selector, url, options) ->
    $target = $(selector)
    $target = up.util.$createElementFromSelector(selector) unless $target.length
    $target.addClass("up-loading")
    options = up.util.options(options, history: { url: url })

    up.util.get(url, selector: selector)
      .done (html) ->
        $target.removeClass("up-loading")
        implant(selector, html, options)
      .fail(up.util.error)

  implant = (selector, html, options) ->
    $target = $(selector)
    options = up.util.options(options, history: { method: 'push' })
    # jQuery cannot construct transient elements that contain <html> or <body> tags,
    # so we're using the native browser API to grep through the HTML
    htmlElement = up.util.createElementFromHtml(html)
    if fragment = htmlElement.querySelector(selector)
      $fragment = $(fragment)
      up.bus.emit('fragment:destroy', $target)
      swapElements($target, $fragment, options.transition)
      title = htmlElement.querySelector("title")?.textContent # todo: extract title from header
      if options.history?.url
        document.title = title if title
        up.history[options.history.method](options.history.url)
        # Remember where the element came from so we can make
        # smaller page loads in the future (does this even make sense?).
        rememberSource($target)
      # The fragment is only ready after the history was (or wasn't) changed above
      up.bus.emit('fragment:ready', $fragment)

    else
      up.util.error("Could not find selector (#{selector}) in response (#{html})")

  swapElements = ($old, $new, transitionName) ->
    if up.util.isGiven(transitionName)
      if $old.is('body')
        up.util.error('Cannot apply transitions to body-elements')
      $new.insertAfter($old)
      up.transition($old, $new, transitionName).then -> $old.remove()
    else
      $old.replaceWith($new)


  reload = (selector) ->
    replace(selector, recallSource($(selector)))

  remove = (elementOrSelector) ->
    $(elementOrSelector).remove()

  replace: replace
  reload: reload
  remove: remove
  implant: implant

)()

up.replace = up.flow.replace
up.reload = up.flow.reload
up.remove = up.flow.remove


