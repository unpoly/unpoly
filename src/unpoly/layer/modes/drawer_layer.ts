import type * as t from '../types.js'
import { OverlayWithViewport } from './overlay_with_viewport.js'

export class DrawerLayer extends OverlayWithViewport {
  static mode: t.LayerMode = 'drawer'
}
