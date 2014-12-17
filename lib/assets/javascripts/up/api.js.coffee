up.api = (->

  rememberSource = ($element) ->
    $element.attr("up-source", location.href)

  recallSource = ($element) ->
    $source = $element.closest("[up-source]")
    $source.attr("up-source") || location.href

  replace = (selector, url) ->
    $target = $(selector)
    $target = up.util.$createElementFromSelector(selector) unless $target.length
    $target.addClass("up-loading")
    up.util.get(url, selector: selector)
      .done (html) ->
        $target.removeClass("up-loading")
        implantFragment(selector, html, historyUrl: url)
      .fail(up.util.error)

  implantFragment = (selector, html, options) ->
    $target = $(selector)
    $html = $(html)
    $fragment = $html.find(selector)
    if $fragment.length
      $target.replaceWith($fragment)
      title = $html.filter("title").text()
      if url = options.historyUrl
        document.title = title if title
        up.past.push(url, html)
        # Remember where the element came from so we can make
        # smaller page loads in the future (does this even make sense?).
        rememberSource($target)
      compile($fragment)
    else
      up.util.error("Could not find selector (#{selector}) in response (#{html})")

  compile = (fragment) ->
    up.bus.emit('fragment:ready', $(fragment))

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
      data: $form.serialize()
    }
    $.ajax(request).always((html, textStatus, xhr) ->
      $form.removeClass('up-loading')
      if redirectLocation = xhr.getResponseHeader('X-Up-Previous-Redirect-Location')
        implantFragment(successSelector, html, historyUrl: redirectLocation)

      else
        implantFragment(failureSelector, html)
    )

  visit = (url) ->
    replace('body', url)

  follow = (link) ->
    $link = $(link)
    url = $link.attr("href")
    selector = $link.attr("up-target")
    replace(selector, url)

  up.app.on 'click', 'a[up-target]', (event, $link) ->
    event.preventDefault()
    follow($link)

  up.app.on 'submit', 'form[up-target]', (event, $form) ->
    event.preventDefault()
    submit($form)

  replace: replace
  reload: reload
  remove: remove
  submit: submit
  visit: visit
  follow: follow
  compile: compile

)()

up.util.extend(up, up.api)
