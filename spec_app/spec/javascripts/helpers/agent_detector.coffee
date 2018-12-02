u = up.util
$ = jQuery

@AgentDetector = do ->

  match = (regexp) ->
    navigator.userAgent.match(regexp)

  isIE = ->
    match(/\bTrident\b/)

  isEdge = ->
    match(/\bEdge\b/)

  isSafari = ->
    match(/\bSafari\b/) && !match(/\bChrome\b/)

  isIE: isIE
  isEdge: isEdge
  isSafari: isSafari
