###*
Links.
  
@class up.link
###

up.link = (->
  
  ###*
  Visits the given URL without a full page load.
  This is done by fetching `url` through an AJAX request
  and replacing the current `<body>` tag with the response's `<body>` tag.. 
  
  @method up.visit
  @param {String} url
    The URL to visit.
  @param {Object} options
    See options for {{#crossLink "up.flow/up.replace"}}{{/crossLink}}.
  @example
      up.visit('/users')
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
  ###
  follow = (link, options) ->
    $link = $(link)
    options = up.util.options(options)
    url = up.util.presentAttr($link, 'href', 'up-follow')
    selector = options.target || $link.attr("up-target") || 'body'
    options.transition ||= up.util.presence($link.attr('up-transition')) || up.util.presence($link.attr('up-animation')) 
    if history = $link.attr('up-history')
      if history == 'false'
        options.history = false
      else
        options.history = { url: history }
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
      
  ###*
  @method a[up-target]
  @param {String} up-target
  @example
      <a href="/users" up-target=".main">User list</a>
  ###
  up.on 'click', 'a[up-target]', (event, $link) ->
    event.preventDefault()
    follow($link)

  ###*
  @method [up-follow]
  @param {String} [up-follow]
  @example
      <a href="/users" up-follow>User list</a>
  ###
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


