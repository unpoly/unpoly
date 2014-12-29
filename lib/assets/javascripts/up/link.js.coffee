up.link = (->

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

  visit: visit
  follow: follow

)()

up.visit = up.link.visit
up.follow = up.link.follow
