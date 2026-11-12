import { type LayerMode } from '../base.js'
import { OverlayWithTether } from './overlay_with_tether.js'

export class PopupLayer extends OverlayWithTether {
  static mode: LayerMode = 'popup'
}
