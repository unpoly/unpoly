import { NotImplemented } from '../../../error/not_implemented.js'
import { RenderOptions } from '../render_options.js'

export class Change {

  constructor(options) {
    this.options = options
  }

  execute() {
    throw new NotImplemented()
  }

  deriveFailOptions() {
    // This will merge shared keys and unprefix failKeys.
    return RenderOptions.deriveFailOptions(this.options)
  }

}
