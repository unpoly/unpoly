import { NotImplemented } from '../../../error.js'
import { RenderOptions } from '../render_options.js'

// The base class of all render passes and their parts. Most work with render options,
// up.destroy() passes its own options.
export class Change<O extends object = RenderOptions> {
  declare options: O

  constructor(options: O) {
    this.options = options
  }

  // Subclasses may take arguments.
  execute(...args: any[]): any
  execute() {
    throw new NotImplemented()
  }

  deriveFailOptions(this: Change<RenderOptions>): RenderOptions {
    // This will merge shared keys and unprefix failKeys.
    return RenderOptions.deriveFailOptions(this.options)
  }

}
