up.RenderJob = class RenderJob {

  constructor(options) {
    options = up.RenderOptions.preprocess(options)
    this.rendered = u.newDeferred()
    this.finished = u.newDeferred()
  }

  async execute() {
    try {
      let result = await this.makeChange()
      this.runResultCallbacks(result)
      return result
    } catch (error) {
      if (error instanceof up.RenderResult) {
        this.runResultCallbacks(error)
      } else {
        this.options.onError?.(error)
      }
      throw error
    }
  }

  runResultCallbacks(result) {
    // We call result.options.onRendered() instead of this.options.onRendered()
    // as this will call the correct options.onRendered() or onFailRendered()
    // depending on options.failOptions.
    result.options.onRendered?.(result)
    result.finished.then(result.options.onFinished)
  }

  async get finished() {
    try {
      let result = await this.rendered
      return await result.finished
    } catch (error) {
      if (error instanceof up.RenderResult) {
        throw await result.finished
      } else {
        throw error
      }
    }
  }

  // ...

}
