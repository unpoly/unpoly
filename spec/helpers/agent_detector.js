const u = up.util
const $ = jQuery

window.AgentDetector = (function() {

  const match = (regexp) => navigator.userAgent.match(regexp)

  const isIE = () => match(/\bTrident\b/)

  const isLegacyEdge = () => match(/\bEdge\b/)

  const isSafari = () => match(/\bSafari\b/) && !match(/\bChrome\b/)

  const isFirefox = () => match(/\bFirefox\b/)

  return {
    isIE,
    isLegacyEdge,
    isSafari,
    isFirefox
  }
})()
