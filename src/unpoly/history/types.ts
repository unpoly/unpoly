import type { UpEvent } from '../event.js'
import type { RenderOptions } from '../fragment.js'

/**
Why the location changed. `'detect'` is only used internally: we tell `'hash'` from `'pop'` later.
*/
export type LocationChangeReason = 'push' | 'replace' | 'pop' | 'hash' | 'detect' | null

/**
What Unpoly can update in the browser history. See `up.history.config.enabled`.
*/
export type HistoryAspect = 'location' | 'title' | 'metaTags' | 'lang'

/**
How to report the next location change. See `up:location:changed`.
@internal
*/
export interface HistoryTrackOptions {
  reason?: LocationChangeReason
  // The change was made by Unpoly, which has already updated the page.
  alreadyHandled?: boolean
  // Ignore the next location change.
  pauseTracking?: boolean
}

/**
The `up:location:changed` event.
*/
export interface LocationChangedEvent extends UpEvent {
  reason: LocationChangeReason
  location: string
  previousLocation?: string
  alreadyHandled: boolean
  willHandle: boolean
}

/**
The `up:location:restore` event.
*/
export interface LocationRestoreEvent extends UpEvent {
  location: string
  renderOptions: RenderOptions
}

/**
The settings in `up.history.config`, described in its doc comment.
*/
export interface HistoryConfig {
  enabled: boolean | HistoryAspect[]
  restoreTargets: string[]
  metaTagSelectors: string[]
  noMetaTagSelectors: string[]
}
