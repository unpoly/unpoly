import * as u from '../util.js'
import { type UpRequest } from '../network.js'
import { type Preview } from './preview.js'

/**
A preview function, registered with `up.preview()` or passed as `{ preview }`.
It changes the page while a request is loading, through the given `up.Preview`.
*/
export type PreviewFn = (preview: Preview, options?: u.PlainObject) => any

/**
The settings in `up.status.config`, described in its doc comment.
*/
export interface StatusConfig {
  currentClasses: string[]
  activeClasses: string[]
  loadingClasses: string[]
  revalidatingClasses: string[]
  navSelectors: string[]
  noNavSelectors: string[]
}

/**
Everything an `up.Preview` needs to know.
@internal
*/
export interface PreviewOptions {
  // Undefined when opening a layer.
  fragment: Element | undefined
  request: UpRequest
  renderOptions: u.PlainObject
  cleaner: u.Cleaner
}
