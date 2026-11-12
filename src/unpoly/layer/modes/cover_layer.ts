import { type LayerMode } from '../base.js'
import { OverlayWithViewport } from './overlay_with_viewport.js'

export class CoverLayer extends OverlayWithViewport {
  static mode: LayerMode = 'cover'
}
