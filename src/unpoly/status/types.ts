import type * as u from '../util.js'
import type { Preview } from './preview.js'

/**
A preview function, registered with `up.preview()` or passed as `{ preview }`.
It changes the page while a request is loading, through the given `up.Preview`.
*/
export type PreviewFunction = (preview: Preview, options?: u.PlainObject) => any

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
