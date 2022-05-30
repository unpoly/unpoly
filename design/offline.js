// up.util

function asyncTimer(delay) {
  return new Promise((resolve, _reject) => setTimeout(resolve, delay))
}


// up.network ?

config.testOfflinePath = () => document.querySelector('link[rel*=icon]')?.href || '/favicon.ico'
config.testOfflineInterval = 5000

const SELECTOR_LINK = 'a, [up-href]'
const CLASS_OFFLINE = 'up-offline'

let offline = false

function markLinksAsap(links) {
  requestIdleCallback(() => markLinksNow(links))
}

function isFollowableOffline(link) {
  return up.link.isFollowable(link) && up.link.cacheState(link)
}

function markLinksNow(links) {
  links ||= document.querySelectorAll(SELECTOR_LINK)
  for (let link of links) {
    if (!isFollowableOffline(link)) {
      link.classList.toggle(CLASS_OFFLINE, linkOffline)
    }
  }
}

function unmarkLinks() {
  for (let link of document.querySelectorAll('.up-offline')) {
    link.classList.remove(CLASS_OFFLINE)
  }
}

async function hasServerConnection() {
  if (!navigator.onLine) return false

  let path = u.evalOption(config.testOfflinePath)
  let timeout = config.testOfflineInterval

  const controller = new AbortController()
  const timeoutTimer = setTimeout(() => controller.abort(), timeout)

  try {
    await fetch(path, {
      cache: 'no-store',
      signal: controller.signal
    })
    return true
  } catch(error) {
    return false
  } finally {
    clearTimeout(timeoutTimer)
  }
}

async function updateOffline() {
  offline = !(await hasServerConnection())
}

async function startPolling() {
  while (offline) {
    await Promise.allSettled([
      updateOffline(),
      u.asyncTimer(config.testOfflineInterval)
    ])
  }
}

up.compiler(SELECTOR_LINK, { batch: true }, function(links) {
  if (offline) {
    markLinksAsap(links)
  }
})

function offlineDetected() {
  markLinksAsap()
  startPolling()
}

function onlineDetected() {
  offline = false
  requestIdleCallback(unmarkLinks)
}

window.addEventListener('offline', offlineDetected)
up.on('up:request:offline', offlineDetected)
up.on('up:request:loaded', onlineDetected) // TODO: DO we get up:request:loaded for cached requests ?

