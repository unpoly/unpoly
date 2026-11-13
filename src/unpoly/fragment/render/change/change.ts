import { NotImplemented } from '../../../error.js'
import type * as t from '../../types.js'

// The base class of the layer plans, CloseLayer and DestroyFragment. Most work with render options,
// up.destroy() passes its own options.
export class Change<O extends object = t.RenderOptions> {
  declare options: O

  constructor(options: O) {
    this.options = options
  }

  // Subclasses may take arguments.
  execute(...args: any[]): any
  execute(): never {
    throw new NotImplemented()
  }

}
