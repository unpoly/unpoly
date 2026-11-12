import { type LayerMode } from '../base.js'
import { OverlayWithViewport } from './overlay_with_viewport.js'

export class ModalLayer extends OverlayWithViewport {
  static mode: LayerMode = 'modal'
}
