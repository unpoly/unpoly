up.api = (->

  rememberSource = ($element) ->
    $element.attr("up-source", location.href)

  recallSource = ($element) ->
    $source = $element.closest("[up-source]")
    $source.attr("up-source") || location.href

  replace = (targetSelector, url, options) ->
    substituteSelector = options?.substituteSelector || targetSelector
    $target = $(targetSelector)
    $target = up.util.$createElementFromSelector(targetSelector) unless $target.length
    $target.addClass("up-loading")
    up.util.get(url, selector: substituteSelector).done((html) ->
      $target.removeClass("up-loading")
      implantHtml($target, substituteSelector, html)
    ).fail(up.util.error)

  implantHtml = ($targetOrSelector, substituteSelector, html) ->
    $target = if _.isString($targetOrSelector) then $($targetOrSelector) else $targetOrSelector
    $html = $(html)
    $substitute = $html.find(substituteSelector)
    if $substitute.length
      $target.replaceWith($substitute)
      title = $html.filter("title").text()
      document.title = title
      up.past.push(url)
      # Remember where the element came from so we can make
      # smaller page loads in the future (does this even make sense?).
      rememberSource($target)
    else
      up.util.error("Could not find selector (" + substituteSelector + ") in response (" + html + ")")


#  replaceTargetSelector = (targetSelector, htmlPromise) ->
#    substituteSelector = options?.substituteSelector || targetSelector
#    $target = $(targetSelector)
#    $target = up.util.$createElementFromSelector(targetSelector) unless $target.length
#    $target.addClass("up-loading")
#    htmlPromise.done((html) ->
#      $target.removeClass("up-loading")
#      $html = $(html)
#      $substitute = $html.find(substituteSelector)
#      if $substitute.length
#        $target.replaceWith($substitute)
#        title = $html.filter("title").text()
#        document.title = title
#        up.past.push(url)
#        # Remember where the element came from so we can make
#        # smaller page loads in the future (does this even make sense?).
#        rememberSource($target)
#      else
#        error("Could not find selector (" + substituteSelector + ") in response (" + html + ")")
#    )

  reload = (selector) ->
    replace(selector, recallSource($(selector)))

  remove = (elementOrSelector) ->
    $(elementOrSelector).remove()

  submit = (form) ->
    $form = $(form)
    $form.addClass('up-loading')
    $.ajax(
      url: $form.attr('action') || location.href
      type: $form.attr('method') || 'POST',
      data: $form.serialize()
    ).always((html, textStatus, xhr) ->
      $form.removeClass('up-loading')
      if redirectLocation = xhr.getResponseHeader('X-Up-Redirect-Location')
        # target ersetzen

      else
        implantHtml($form, html, up.util.createSelectorFromElement($form))
    )

  visit = (url) ->
    replace('body', url)

  $(document).on("click", "a[up-target]", (event) ->
    url = $(this).attr("href")
    targetSelector = $(this).attr("up-target")
    replace(targetSelector, url)
    false
  )

  $(document).on("submit", "form[up-target]", (event) ->
    submit($(this))
    false
  )

  return (
    replace: replace
    reload: reload
    remove: remove
    submit: submit
    visit: visit
  )

)()