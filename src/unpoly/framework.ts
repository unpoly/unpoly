import { emit, type UpEvent } from './event.js'
import { mockable } from './mockable.js'

/**
The `up:framework:boot` and `up:framework:booted` events.
*/
export interface FrameworkBootedEvent extends UpEvent {
  mode: 'auto' | 'manual'
}

declare module './event.js' {
  interface UpEventMap {
    'up:framework:boot': FrameworkBootedEvent
    'up:framework:booted': FrameworkBootedEvent
    'up:framework:reset': UpEvent
  }
}

// Event                          up.framework.readyState   document.readyState
// ------------------------------------------------------------------------------------------------------
// Browser starts parsing HTML    -                         loading
// Unpoly script is running       evaling                   loading (if sync) or interactive (if defered)
// ... namespaces are running     evaling                   loading (if sync) or interactive (if defered)
// User scripts are running       configuring               loading (if sync) or interactive (if defered)
// DOMContentLoaded               configuring => booting    interactive
// Initial page is compiling      booting                   interactive
// Document resources loaded      booted                    complete
type ReadyState = 'evaling' | 'configuring' | 'booting' | 'booted'

let readyState: ReadyState = 'evaling' // evaling => configuring => booting => booted

export function emitReset(): void {
  emit('up:framework:reset', { log: false })
}

export function boot({ mode = 'manual' }: { mode?: 'manual' | 'auto' } = {}): void {
  if (readyState !== 'configuring') {
    // In an app with a lot of async script the user may attempt to boot us twice.
    console.error('Unpoly has already booted')
    return
  }

  // This is called synchronously after all Unpoly namespaces have been parsed
  // and executed. We cannot delay booting until the DOM is ready, since by then
  // all user-defined event listeners and compilers will have registered.
  // Note that any non-async scripts after us will delay DOMContentLoaded.
  let issue = supportIssue()
  if (!issue) {
    // Change the state in case any user-provided compiler calls up.boot().
    // up.boot() is a no-op unless readyState === 'configuring'.
    readyState = 'booting'
    emit('up:framework:boot', { mode, log: false })
    readyState = 'booted'
    // The initial page has been compiled, so CSS can stop hiding unprocessed elements.
    document.documentElement.classList.add('up-booted')
    emit('up:framework:booted', { mode, log: false })
  } else {
    console.error("Unpoly cannot boot: %s", issue)
  }
}

function mustManualBoot(): boolean | undefined {
  // (A) If we're loaded via <script async>, there are no guarantees when we're called or when
  //     subsequent scripts that configure Unpoly have executed.
  // (B) We cannot rely on document.currentScript being present.
  //     This function runs before the support check, we may be dealing with a browser that doesn't support `document.currentScript` (e.g. IE11).
  //     Also `document.currentScript` is `undefined` for a `<script type="module">`.
  if ((document.currentScript as HTMLScriptElement)?.async) {
    return true
  }

  // (A) If we're loaded with <html up-boot="manual"> the user explicitly requested to boot Unpoly manually.
  // (B) There is a legacy API to also allow <script up-boot="manual">.
  //     We cannot migrate this in unpoly-migrate, as unpoly-migrate will be evaled after us.
  if (document.querySelector('[up-boot=manual]:is(html, script)')) {
    return true
  }

  // If we're loaded this late, someone loads us dynamically.
  // We don't know when subsequent scripts that configure Unpoly
  // have executed.
  if (document.readyState === 'complete') {
    return true
  }
}

export function onEvaled(): void {
  emit('up:framework:evaled', { log: false })

  if (mustManualBoot()) {
    console.debug('Call up.boot() after you have configured Unpoly')
  } else {
    // (1) On DOMContentLoaded we know that all non-[async] scripts have executed.
    // (2) Deferred scripts execute after the DOM was parsed (document.readyState === 'interactive'),
    //     but before DOMContentLoaded. That's why we must *not* boot synchonously when
    //     document.readyState === 'interactive'. We must wait until DOMContentLoaded, when we know that
    //     subsequent users scripts have executed and (possibly) configured Unpoly.
    // (3) There are no guarantees when [async] scripts execute. These must boot Unpoly manually.
    document.addEventListener('DOMContentLoaded', () => boot({ mode: 'auto' }))
  }

  // After this line user scripts may run and configure Unpoly, add compilers, etc.
  readyState = 'configuring'
}

export function startExtension(): void {
  if (readyState !== 'configuring') {
    throw new Error('Unpoly extensions must be loaded before booting')
  }
  readyState = 'evaling'
}

export function stopExtension(): void {
  readyState = 'configuring'
}

export function isSupported(): boolean {
  return !supportIssue()
}

export function isEvaling(): boolean {
  return readyState === 'evaling'
}

export function isBooted(): boolean {
  return readyState === 'booted'
}

// Mockable, so specs can pretend that Unpoly hasn't booted.
export const isBeforeBoot = mockable(function isBeforeBoot(): boolean {
  return readyState !== 'booting' && readyState !== 'booted'
})

// Gives a class its public name, which survives minification (see unpoly.ts). We define the
// tag instead of assigning it, which would throw when the class inherits a getter or read-only tag.
// The tag stays writable and configurable, so an app can still assign its own tag to a subclass or instance.
export function setClassName(klass: abstract new (...args: any[]) => any, name: string): void {
  Object.defineProperty(klass, 'name', { value: name })
  Object.defineProperty(klass.prototype, Symbol.toStringTag, { value: name, writable: true, configurable: true })
}

function supportIssue(): string | undefined {
  for (let feature of ['Promise', 'DOMParser', 'FormData', 'reportError'] as const) {
    if (!window[feature]) {
      return `Browser doesn't support the ${feature} API`
    }
  }

  if (document.compatMode === 'BackCompat') {
    return 'Browser is in quirks mode (missing DOCTYPE?)'
  }

  for (let selector of [':is(*)', ':has(*)']) {
    if (!CSS.supports(`selector(${selector})`)) {
      return `Browser doesn't support the ${selector} selector`
    }
  }
}

export const api = {
  framework: {
    boot,
    get booted() { return isBooted() },
    isSupported,
  },
  boot,
}
