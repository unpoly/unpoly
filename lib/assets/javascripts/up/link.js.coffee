###*
Links.
  
@class up.link
###

up.link = (->
  
  ###*
  Visits the given URL without a full page load.
  This is done by fetching `url` through an AJAX request
  and replaceing the current `<body>` tag with the response's `<body>` tag.. 
  
  @method up.visit
  @param {String} url
    The URL to visit.
  @param {Object} options
    See options for {{#crossLink "up.flow/up.replace"}}{{/crossLink}}.
  @example
      <a href="/users" up-follow>User list</a>
  ###
  visit = (url, options) ->
    console.log("up.visit", url)
    # options = up.util.options(options, )
    up.replace('body', url, options)

  ###*
  Follows the given link and replaces a selector in the current page
  with corresponding elements from a new page fetched from the server.
  
  @method up.follow
  @param {Element|jQuery|String} link
    An element or selector which resolves to an `<a>` tag
    or any element that is marked up with an `up-follow` attribute.
  @param {String} [options.target]
    The selector to replace.
    Defaults to the `up-target` attribute on `link`,
    or to `body` if such an attribute does not exist.
  @param {Function|String} [options.transition]
    A transition function or name.
  @example
      <a href="/users" up-target=".main">User list</a>
  ###
  follow = (link, options) ->
    $link = $(link)
    options = up.util.options(options)
    url = up.util.presentAttr($link, 'href', 'up-follow')
    selector = options.target || $link.attr("up-target") || 'body'
    options.transition ||= $link.attr('up-transition')
    up.replace(selector, url, options)

  resolve = (element) ->
    $element = $(element)
    if $element.is('a') || up.util.presentAttr($element, 'up-follow')
      $element
    else
      $element.find('a:first')

  resolveUrl = (element) ->
    if link = resolve(element)
      up.util.presentAttr(link, 'href', 'up-follow')
      
  markActive = (element) ->
    markUnactive()
    $element = $(element)
    $clickArea = $element.ancestors('up-follow')
    $clickArea = $element unless $clickArea.length
    $clickArea.addClass('up-active')
    
  markUnactive = ->
    $('[up-active]').removeClass('up-active')

  up.on 'click', 'a[up-target]', (event, $link) ->
    event.preventDefault()
    follow($link)

  up.on 'click', '[up-follow]', (event, $element) ->

    childLinkClicked = ->
      $target = $(event.target)
      $target.closest('a').length && $element.has($target).length

    unless childLinkClicked()
      event.preventDefault()
      follow(resolve($element))

  visit: visit
  follow: follow
  resolve: resolve
  resolveUrl: resolveUrl

)()

up.visit = up.link.visit
up.follow = up.link.follow
