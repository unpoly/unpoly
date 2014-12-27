up.api = (->

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
        implantFragment(selector, html, options)
      .fail(up.util.error)

  implantFragment = (selector, html, options) ->
    $target = $(selector)
    options = up.util.options(options, history: { method: 'push' })
    # jQuery cannot construct transient elements that contain <html> or <body> tags,
    # so we're using the native browser API to grep through the HTML
    htmlElement = up.util.createElementFromHtml(html)
    if fragment = htmlElement.querySelector(selector)
      $fragment = $(fragment)
      up.bus.emit('fragment:destroy', $target)
      $target.replaceWith(fragment)
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

#  replaceElement = (target, replacement) ->
#    target = up.util.unwrap(target)
#    replacement = up.util.unwrap(replacement)
#    document.documentElement.replaceChild()

  reload = (selector) ->
    replace(selector, recallSource($(selector)))

  remove = (elementOrSelector) ->
    $(elementOrSelector).remove()

  submit = (form) ->
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
      console.log("always args", xhr, xhr.getResponseHeader)
      if redirectLocation = xhr.getResponseHeader('X-Up-Previous-Redirect-Location')
        implantFragment(successSelector, html, history: { url: redirectLocation })

      else
        implantFragment(failureSelector, html)
    )

  visit = (url, options) ->
    console.log("up.visit", url)
    replace('body', url, options)

  follow = (link, options) ->
    $link = $(link)
    url = $link.attr("href")
    selector = $link.attr("up-target") || 'body'
    replace(selector, url, options)

  up.on 'click', 'a[up-target], a[up-follow]', (event, $link) ->
    event.preventDefault()
    follow($link)

  up.on 'submit', 'form[up-target]', (event, $form) ->
    event.preventDefault()
    submit($form)

  replace: replace
  reload: reload
  remove: remove
  submit: submit
  visit: visit
  follow: follow

)()

up.util.extend(up, up.api)
