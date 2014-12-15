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
    up.util.get(url, selector: selector).done((html) ->
      $target.removeClass("up-loading")
      implantHtml(selector, html, historyUrl: url)
    ).fail(up.util.error)

  implantHtml = (selector, html, options) ->
    $target = $(selector)
    $html = $(html)
    $substitute = $html.find(selector)
    if $substitute.length
      $target.replaceWith($substitute)
      title = $html.filter("title").text()
      if url = options.historyUrl
        document.title = title if title
        up.past.push(url)
        # Remember where the element came from so we can make
        # smaller page loads in the future (does this even make sense?).
        rememberSource($target)
    else
      up.util.error("Could not find selector (#{selector}) in response (#{html})")

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
      if redirectLocation = xhr.getResponseHeader('X-Up-Redirect-Location')
        implantHtml(successSelector, html, historyUrl: redirectLocation)

      else
        implantHtml(failureSelector, html)
    )

  visit = (url) ->
    replace('body', url)

  follow = (link) ->
    $link = $(link)
    url = $link.attr("href")
    selector = $link.attr("up-target")
    replace(selector, url)

  $(document).on("click", "a[up-target]", (event) ->
    follow(this)
    false
  )

  $(document).on("submit", "form[up-target]", (event) ->
    submit(this)
    false
  )

  return (
    replace: replace
    reload: reload
    remove: remove
    submit: submit
    visit: visit
    follow: follow
  )

)()
