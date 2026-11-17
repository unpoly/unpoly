// Core calls this hook (up.protocol).
up.migrate.clearCacheFromXHR = function(xhr) {
  let value = xhr.getResponseHeader('X-Up-Clear-Cache')

  if (value) {
    up.migrate.deprecated('X-Up-Clear-Cache', 'X-Up-Expire-Cache')

    if (value === 'false') {
      return false
    } else {
      return value
    }
  }
}

// X-Up-Title used to carry a window title as a bare string.
// We now require it to be a JSON-encoded string so we can escape high-ASCII characters:
// https://makandracards.com/makandra/536174-http-headers-can-only-transport-us-ascii-characters-safely
// Core calls this hook (up.protocol).
up.migrate.titleFromXHR = function(xhr) {
  let value = xhr.getResponseHeader('X-Up-Title')

  if (value) {
    if (value === 'false') {
      return false
    } else if (value[0] !== '"' && value[0] !== "'") {
      up.migrate.warn('X-Up-Title must now be a JSON-encoded string (got %o)', value)
      return value
    }
  }
}

up.protocol.config.patch(function() {
  const cspNonceMoved = () => up.migrate.deprecated('up.protocol.config.cspNonce', 'up.script.config.cspNonce')

  Object.defineProperty(this, 'cspNonce', {
    configurable: true,
    get() {
      cspNonceMoved()
      return up.script.config.cspNonce
    },
    set(value) {
      cspNonceMoved()
      up.script.config.cspNonce = value
    }
  })
})
