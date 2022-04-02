const u = up.util
const e = up.element

up.FormValidator = class FormValidator {

  constructor(form) {
    this.form = form
    this.formDefaults = form ? up.form.submitOptions(form, {}, { only: ['feedback', 'disable', 'contentType', 'headers', 'params', 'url', 'method'] }) : {}
    this.dirtySolutions = []
    this.nextRenderTimer = null
    this.rendering = false
    this.resetNextRenderPromise()
    this.honorAbort()
  }

  honorAbort() {
    up.fragment.onAborted(this.form, ({ target }) => {
      this.dirtySolutions = u.reject(this.dirtySolutions, ({ element }) => target.contains(element))
    })
  }

  resetNextRenderPromise() {
    this.nextRenderPromise = u.newDeferred()
  }

  observeField(field) {
    let { event } = this.originOptions(field)
    up.on(field, event, () => this.validate({ origin: field }))
  }

  validate(options = {}) {
    let solution = this.getSolution(options)
    this.dirtySolutions.push(solution)
    this.scheduleNextRender()
    return this.nextRenderPromise
  }

  getSolution(options) {
    let solution = this.getTargetSelectorSolution(options)
      || this.getFieldSolution(options)
      || this.getElementSolution(options.origin)

    solution.renderOptions = { ...this.formDefaults, ...this.originOptions(solution.origin), ...options }

    // Resolve :origin selector here. We can't delegate to up.render({ origin })
    // as that only takes a single origin, even with multiple targets.
    solution.target = up.fragment.resolveOrigin(solution.target, solution)

    return solution
  }

  getFieldSolution({ origin, ... options }) {
    if (up.form.isField(origin)) {
      return this.getValidateAttrSolution(origin) || this.getFormGroupSolution(origin, options)
    }
  }

  getFormGroupSolution(field, { formGroup = true }) {
    if (!formGroup) return

    let solution = up.form.groupSolution(field)
    if (solution) {
      up.puts('up.validate()', 'Validating form group of field %o', field)
      return solution
    }
  }

  getTargetSelectorSolution({ target, origin }) {
    if (u.isString(target)) {
      up.puts('up.validate()', 'Validating target "%s"', target)
      const element = up.fragment.get(target, { origin })
      return { target, element, origin }
    }
  }

  getElementSolution(element) {
    up.puts('up.validate()', 'Validating element %o', element)
    return {
      element,
      target: up.fragment.toTarget(element),
      origin: element
    }
  }

  getValidateAttrSolution(field) {
    // In case of radio buttons the [up-validate] attribute will
    // be set on a container containing the entire radio button group.
    let containerWithAttr = e.closest(field, '[up-validate]')

    if (containerWithAttr) {
      let target = containerWithAttr.getAttribute('up-validate')

      if (target) {
        up.puts('up.validate()', 'Validating [up-validate] target "%s" from field %o', target, field)
        return {
          target,
          element: up.fragment.get(target, { origin: field }),
          origin: field
        }
      }
    }
  }

  originOptions(element, overrideOptions) {
    let defaults = { event: 'change', ...this.formDefaults }
    let closestOptions = up.form.observeOptions(element, {}, { defaults })
    return { ...this.formDefaults, ...closestOptions, ...overrideOptions }
  }

  scheduleNextRender() {
    let solutionDelays = this.dirtySolutions.map((solution) => solution.renderOptions.delay)
    let shortestDelay = Math.min(...solutionDelays) || 0
    // Render requests always reset the timer, using their then-current delay.
    this.unscheduleNextRender()
    this.nextRenderTimer = u.timer(shortestDelay, () => this.renderDirtySolutions())
  }

  unscheduleNextRender() {
    clearTimeout(this.nextRenderTimer)
  }

  // noinspection ES6MissingAwait
  async renderDirtySolutions() {
    // Remove solutions for elements that were detached while we were waiting for the timer.
    this.dirtySolutions = u.reject(this.dirtySolutions, (solution) => e.isDetached(solution.element) || e.isDetached(solution.origin))

    if (!this.dirtySolutions.length || this.rendering) {
      return
    }

    let dirtySolutions = u.uniqBy(this.dirtySolutions, 'element')
    // Dirty fields are the fields that triggered the validation, not the fields contained
    // by the solution elements. This is not the same thing in a scenario like this:
    //
    //     <form>
    //       <input type="text" name="email" up-validate=".results">
    //       <div class="results"></div>
    //     </form>

    // Remove duplicate names as a radio button group has multiple inputs with the same name.
    let dirtyOrigins = u.map(dirtySolutions, 'origin')
    let dirtyFields = u.flatMap(dirtyOrigins, up.form.fields)
    let dirtyNames = u.uniq(u.map(dirtyFields, 'name'))
    let dirtyRenderOptionsList = u.map(dirtySolutions, 'renderOptions')

    // Merge together all render options for all origins.
    let options = u.merge(this.formDefaults, ...dirtyRenderOptionsList)

    // Update the collected targets of all solutions.
    options.target = u.map(dirtySolutions, 'target').join(', ')

    // If any solution wants feedback, they all get it.
    options.feedback = u.some(dirtyRenderOptionsList, 'feedback')

    // Since we may render multiple dirty elements we cannot have individual origins
    // for each. We already resolved an :origin selector in getSolution(), so we don't
    // need { origin } for target resolution.
    options.origin = this.form

    // In case we're replacing an input that the user is typing in,
    // preserve focus, selection and scroll positions.
    options.focus = 'keep'

    // The protocol doesn't define whether the validation results in a status code.
    // Hence we use the same options for both success and failure.
    options.fail = false

    // Make sure the X-Up-Validate header is present, so the server-side
    // knows that it should not persist the form submission
    options.headers ||= {}
    options.headers[up.protocol.headerize('validate')] = dirtyNames.join(' ') || ':unknown'

    // The guardEvent will be be emitted on the render pass' { origin }, so the form in this case.
    // The guardEvent will also be assigned a { renderOptions } attribute in up.render()
    options.guardEvent = up.event.build('up:form:validate', { fields: dirtyFields, log: 'Validating form' })

    // We don't render concurrently. If additional fields want to validate
    // while our request is in flight, they add to a new @dirtySolutions array.
    this.rendering = true
    this.dirtySolutions = []

    // Just like we're gathering new dirty solutions for our next render pass,
    // we now pass out a new validate() promise for that next pass.
    let renderingPromise = this.nextRenderPromise
    this.resetNextRenderPromise()

    // We may render multiple solutions with { disable } options, and most delay options
    // are specific to an { origin }. For instance, { disable: 'form-group' } disables the closest
    // form group around the origin. Since up.render({ disable }) can only take a single
    // value for { disable, origin }, we disable each solution outside of rendering.
    //
    // Disabling the same elements multiple time is not an issue since up.form.disable()
    // only sees enabled elements.
    delete options.delay
    for (let solution of dirtySolutions) {
      up.form.disableAroundRequest(renderingPromise, {
        disable: solution.renderOptions.disable,
        origin: solution.origin,
        targetElements: [solution.element]
      })
    }

    try {
      // Resolve all promises we have handed out for the now-rendered solutions.
      // Since we passed { fail: false } above we will always fulfill for a matchable
      // HTML response, but still reject for fatal errors (e.g. connectivity loss).
      renderingPromise.resolve(up.render(options))
      await renderingPromise
    } finally {
      this.rendering = false
      // Additional solutions may have become dirty while we were rendering so we check again.
      // If no pending solutions are found, the method will return immediately.
      this.renderDirtySolutions()
    }
  }

  static forElement(element) {
    let form = up.form.get(element)
    return form.upFormValidator ||= new this(form)
  }

}
