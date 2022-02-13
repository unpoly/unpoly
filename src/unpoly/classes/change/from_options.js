up.Change.FromOptions = class FromOptions extends up.Change {

  constructor(options) {
    options = up.RenderOptions.preprocess(options)
    super(options)
  }

  execute() {
    // Convert thrown errors into rejected promises.
    // Convert non-promise values into a resolved promise.
    return u.asyncify(() => {
      this.guardRender()
      this.handleAbort()

      if (this.options.url) {
        return this.renderFromURL()
      } else {
        return this.renderFromContent()
      }
    })
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
      up.event.assertEmitted(guardEvent, { target: this.options.origin })
    }

    up.RenderOptions.assertContentGiven(this.options)
  }

  handleAbort() {
    throw "TODO. Hier müssen wir die Change previewen."
  }

  renderFromURL() {
    return new up.Change.FromURL(this.options).execute()
  }

  renderFromContent() {
    // When we have a given { url }, the { solo } option is honored by up.request().
    // But up.request() is never called when we have local content given as { document },
    // { content } or { fragment }. Hence we abort here.
    up.network.mimicLocalRequest(this.options)

    // (1) No need to give feedback as local changes are sync.
    // (2) Value will be converted to a fulfilled promise by up.util.asyncify() in render().
    return new up.Change.FromContent(this.options).execute()
  }

}
