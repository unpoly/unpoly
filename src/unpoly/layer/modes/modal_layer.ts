import { OverlayWithViewport } from './overlay_with_viewport.js'
import type { LayerMode } from '../base.js'

export class ModalLayer extends OverlayWithViewport {
  static mode: LayerMode = 'modal'
}
