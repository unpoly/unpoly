import { OverlayWithTether } from './overlay_with_tether.js'
import type { LayerMode } from '../base.js'

export class PopupLayer extends OverlayWithTether {
  static mode: LayerMode = 'popup'
}
