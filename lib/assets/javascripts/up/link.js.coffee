up.link = (->

  visit = (url, options) ->
    console.log("up.visit", url)
    # options = up.util.options(options, )
    up.replace('body', url, options)

  follow = (link, options) ->
    $link = $(link)
    options = up.util.options(options)
    url = up.util.presentAttr($link, 'href', 'up-follow')
    selector = options.target || $link.attr("up-target") || 'body'
    up.replace(selector, url, options)

  find = (element) ->
    $element = $(element)
    if $element.is('a') || up.util.presentAttr($element, 'up-follow')
      $element
    else
      $element.find('a:first')

  findUrl = (element) ->
    if link = find(element)
      up.util.presentAttr(link, 'href', 'up-follow')

  up.on 'click', 'a[up-target]', (event, $link) ->
    event.preventDefault()
    follow($link)

  up.on 'click', '[up-follow]', (event, $element) ->

    childLinkClicked = ->
      $target = $(event.target)
      $target.closest('a').length > 0 && $element.has($target).length > 0

    relevantElement = ->
      if up.util.presentAttr($element, 'up-follow')
        $element
      else
        $element.find('a:first')

    unless childLinkClicked()
      event.preventDefault()
      follow(relevantElement())

  visit: visit
  follow: follow
  find: find
  findUrl: findUrl

)()

up.visit = up.link.visit
up.follow = up.link.follow
