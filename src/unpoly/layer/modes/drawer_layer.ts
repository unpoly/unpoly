import { type LayerMode } from '../../layer.js'
import { OverlayWithViewport } from './overlay_with_viewport.js'

export class DrawerLayer extends OverlayWithViewport {
  static mode: LayerMode = 'drawer'
}
