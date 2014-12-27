up.cache = (->

  snapshots = {}

  normalizeUrl = up.util.normalizeUrl

  store = (url, bodyHtml = null) ->
    url = normalizeUrl(url)
    snapshots[url] = snapshot(bodyHtml)

  fetch = (url) ->
    url = normalizeUrl(url)
    snapshots[url]

  snapshot = (bodyHtml) ->
    bodyHtml: bodyHtml or document.body.innerHTML
    title: document.title
    positionY: window.pageYOffset
    positionX: window.pageXOffset
    cachedAt: new Date().getTime()

  store: store
  fetch: fetch

)()

