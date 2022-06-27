const u = up.util

up.Change.FromOptions = class FromOptions extends up.Change {

  constructor(options) {
    options = up.RenderOptions.preprocess(options)
    super(options)
  }

  async execute() {
    try {
      let result = await this.makeChange()
      result.options.onRendered?.(result)
      return result
    } catch (error) {
      if (error instanceof up.RenderResult) {
        const result = error
        // We call result.options.onRendered() instead of options.onRendered()
        // as this will call the correct options.onRendered() or onFailRendered()
        // depending on options.failOptions.
        result.options.onRendered?.(result)
      } else {
        this.options.onError?.(error)
      }
      throw error
    }
  }

  makeChange() {
    this.guardRender()

    if (this.options.url) {
      let onRequest = (request) => this.handleAbortOption(request)
      this.change = new up.Change.FromURL({ ...this.options, onRequest })
    } else {
      // No need to give feedback as local changes are sync.
      this.change = new up.Change.FromContent(this.options)
      this.handleAbortOption()
    }

    return this.change.execute()
  }

  guardRender() {
    up.browser.assertConfirmed(this.options)

    let guardEvent = u.pluckKey(this.options, 'guardEvent')
    if (guardEvent) {
      // Allow guard event handlers to manipulate render options for the default behavior.
      //
      // Note that we have removed { guardEvent } from options to not recursively define
      // guardEvent.renderOptions.guardEvent. This would cause an infinite loop for event
      // listeners that prevent the default and re-render.
      guardEvent.renderOptions = this.options
      if (up.emit(guardEvent, { target: this.options.origin }).defaultPrevented) {
        let message = `Rendering was prevented by ${guardEvent.type} listener`
        up.puts('up.render()', message)
        throw up.error.aborted(message)
      }
    }

    up.RenderOptions.assertContentGiven(this.options)
  }

  handleAbortOption(request) {
    // When preloading up.RenderOptions forces { abort: false }.
    let { abort } = this.options

    if (!abort || !up.network.isBusy()) return

    let { targetElements, layer, origin } = this.change.getPreflightProps()

    let abortOptions = {
      except: request, // don't abort the request we just made
      logOnce: ['up.render()', 'Change with { abort } option will abort other requests'],
    }

    if (abort === 'target') {
      // Abort requests in the subtree of the targeted fragment
      up.fragment.abort(targetElements, abortOptions)
    } else if (abort === 'layer') {
      // Abort requests targeting any fragment in the targeted layer
      up.fragment.abort({ ...abortOptions, layer })
    } else if (abort === 'all' || abort === true) {
      // Abort requests targeting any fragment in any layer
      up.fragment.abort({ ...abortOptions, layer: 'any' })
    } else {
      // (1) Abort requests in the subtree of a given selector (string)
      // (2) Abort requests targeting a given element element
      up.fragment.abort(abort, { ...abortOptions, layer, origin })
    }
  }

}
