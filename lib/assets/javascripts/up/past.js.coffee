up.past = (->

  pages = {}

  pageSnapshot = (bodyHtml) ->
    bodyHtml: bodyHtml or document.body.innerHTML
    title: document.title
    positionY: window.pageYOffset
    positionX: window.pageXOffset
    cachedAt: new Date().getTime()

  replace = (url, bodyHtml) ->
    manipulateHistory "replaceState", url, bodyHtml

  push = (url, bodyHtml) ->
    manipulateHistory "pushState", url, bodyHtml

  manipulateHistory = (method, url, bodyHtml) ->
    url = up.util.normalizeUrl(url or location.href)
    pages[url] = pageSnapshot(bodyHtml)
    history[method] { fromUp: true, url: url }, '', url

  restorePage = (page) ->
    up.bus.emit "page:hibernate"
    document.title = page.title
    document.documentElement.replaceChild up.util.createBody(page.bodyHtml), document.body
    up.bus.emit "fragment:ready", $(document.body)

  pop = (event) ->
    state = event.originalEvent.state
    url = undefined
    console.log "popping state", state
    console.log "current href", location.href
    if state and state.fromUp
      url = up.util.normalizeUrl(state.url)
      if page = pages[url]
        restorePage page
      else
        visit url
      false
    else
      console.log "null state"

  up.app.timeout 300, ->
    $(window).on "popstate", pop
    replace()

  push: push

)()
