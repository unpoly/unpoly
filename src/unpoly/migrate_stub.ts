import * as u from './util.js'
import type { Compiler } from './script/hello_fragment.js'
import type { LocationChangedEvent } from './history.js'
import type { Layer } from './layer/base.js'
import type { RequestOptions } from './network/request.js'
import type { UpResponse } from './network/response.js'
import type { RenderOptions } from './fragment/render/render_options.js'

/**
The type of `up.migrate`.

Core only declares what it calls. The hooks exist only when unpoly-migrate.js is loaded, which
replaces the whole object. unpoly-migrate merges its own keys into this interface, including
`config`.

@internal
*/
export interface Migrate {
  loaded?: boolean

  formerlyAsync?(label: string): Promise<void>
  fixEventTypes?(eventTypes: string[]): string[]
  fixGetStyleProps?(keyOrKeys: string | string[]): string | string[]
  fixSetStyleProps?(props: string | u.PlainObject, unit?: string): string | u.PlainObject
  splitAtOr?(value: string): string[] | undefined
  clearCacheFromXHR?(xhr: XMLHttpRequest): string | false | undefined
  titleFromXHR?(xhr: XMLHttpRequest): string | false | undefined
  postCompile?(elements: Element[], compiler: Compiler): void
  watchForSwitch?(root: Element, callback: (event: Event) => void): (() => void) | undefined
  migratedFormGroupSelectors?(): string[]
  prepareLocationChangedEvent?(event: LocationChangedEvent): void
  warnOfHungryMetaTags?(metaTags: u.List<Element>): void
  handleResponseDocOptions?(docOptions: u.PlainObject): void
  processHelloMeta?(meta: u.PlainObject, response: UpResponse): void
  preprocessRenderOptions?(options: RenderOptions): void
  postprocessReloadOptions?(options: RenderOptions): void
  resolveOrigin?(target: string, options?: u.PlainObject): string
  handleRequestOptions?(options: RequestOptions): void
  preprocessAbortArgs?(args: any[]): void
  handleLayerOptions?(options: u.PlainObject): void
  handleLayerConfig?(modeConfig: u.PlainObject): void
  registerLayerCloser?(layer: Layer): void
}

export const api = {
  // This object will gain properties when users load the optional unpoly-migrate.js
  migrate: {
    config: {},
  } as Migrate,
}
