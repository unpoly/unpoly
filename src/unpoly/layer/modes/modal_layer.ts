import type * as t from '../types.js'
import { OverlayWithViewport } from './overlay_with_viewport.js'

export class ModalLayer extends OverlayWithViewport {
  static mode: t.LayerMode = 'modal'
}
