import type * as t from '../types.js'
import { OverlayWithTether } from './overlay_with_tether.js'

export class PopupLayer extends OverlayWithTether {
  static mode: t.LayerMode = 'popup'
}
