const u = up.util

up.FormValidator = class FormValidator {

  constructor(form) {
    this.form = form
    this.dirtySolutions = []
    this.nextRenderTimer = null
    this.rendering = false
    this.resetNextRenderPromise()
    this.honorAbort()
  }

  honorAbort() {
    up.fragment.onAborted(this.form, { around: true }, ({ target }) => this.unscheduleSolutionsWithin(target))
  }

  unscheduleSolutionsWithin(container) {
    this.dirtySolutions = u.reject(this.dirtySolutions, ({ element }) => container.contains(element))
  }

  resetNextRenderPromise() {
    this.nextRenderPromise = u.newDeferred()
  }

  watchContainer(fieldOrForm) {
    let { event } = this.originOptions(fieldOrForm)
    let guard = () => up.fragment.isAlive(fieldOrForm)
    let callback = () => up.error.muteUncriticalRejection(this.validate({ origin: fieldOrForm }))
    up.on(fieldOrForm, event, { guard }, callback)
  }

  validate(options = {}) {
    let solutions = this.getSolutions(options)
    this.dirtySolutions.push(...solutions)
    this.scheduleNextRender()
    return this.nextRenderPromise
  }

  getSolutions(options) {
    let solutions = this.getTargetSelectorSolutions(options)
      || this.getFieldSolutions(options)
      || this.getElementSolutions(options.origin)

    for (let solution of solutions) {
      solution.renderOptions = this.originOptions(solution.origin, options)

      // Resolve :origin selector here. We can't delegate to up.render({ origin })
      // as that only takes a single origin, even with multiple targets.
      solution.target = up.fragment.resolveOrigin(solution.target, solution)
    }

    return solutions
  }

  getFieldSolutions({ origin, ...options }) {
    if (up.form.isField(origin)) {
      return this.getValidateAttrSolutions(origin) || this.getFormGroupSolutions(origin, options)
    }
  }

  getFormGroupSolutions(field, { formGroup = true }) {
    if (!formGroup) return

    let solution = up.form.groupSolution(field)
    if (solution) {
      up.puts('up.validate()', 'Validating form group of field %o', field)
      return [solution]
    }
  }

  getTargetSelectorSolutions({ target, origin }) {
    if (u.isString(target) && target) {
      up.puts('up.validate()', 'Validating target "%s"', target)
      let simpleSelectors = up.fragment.splitTarget(target)
      return u.compact(simpleSelectors.map(function(simpleSelector) {
        let element = up.fragment.get(simpleSelector, { origin })
        if (element) {
          return {
            element,
            target: simpleSelector,
            origin
          }
        } else {
          up.fail('Validation target "%s" does not match an element', simpleSelector)
        }
      }))
    }
  }

  getElementSolutions(element) {
    up.puts('up.validate()', 'Validating element %o', element)
    return [{
      element,
      target: up.fragment.toTarget(element),
      origin: element
    }]
  }

  getValidateAttrSolutions(field) {
    // In case of radio buttons the [up-validate] attribute will
    // be set on a container containing the entire radio button group.
    let containerWithAttr = field.closest('[up-validate]')

    if (containerWithAttr) {
      let target = containerWithAttr.getAttribute('up-validate')
      return this.getTargetSelectorSolutions({ target, origin: field })
    }
  }

  originOptions(element, overrideOptions) {
    return up.form.watchOptions(element, overrideOptions, { defaults: { event: 'change' } })
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

  renderDirtySolutions() {
    up.error.muteUncriticalRejection(this.doRenderDirtySolutions())
  }

  async doRenderDirtySolutions() {
    // Remove solutions for elements that were detached while we were waiting for the timer.
    this.dirtySolutions = u.filter(this.dirtySolutions, ({ element, origin }) => up.fragment.isAlive(element) && up.fragment.isAlive(origin))
    if (!this.dirtySolutions.length || this.rendering) {
      return
    }

    let dirtySolutions = this.dirtySolutions // u.uniqBy(this.dirtySolutions, 'element')
    this.dirtySolutions = []

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
    let dataMap = this.buildDataMap(dirtySolutions)
    let dirtyRenderOptionsList = u.map(dirtySolutions, 'renderOptions')

    // Merge together all render options for all origins.
    let options = u.mergeDefined(
      ...dirtyRenderOptionsList,
      { dataMap },
      up.form.destinationOptions(this.form),
    )

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
    options.focus ??= 'keep'

    // The protocol doesn't define whether the validation results in a status code.
    // Some backends might want to communicate a failed validation, others might not.
    // In any case we render the same targets for both success and failure.
    //
    // In cases when the server does respond with an error status, we still want to
    // reject the up.validate() promise. Hence we use { failOptions: false } instead of
    // { fail: false }.
    options.failOptions = false

    options.params = up.Params.merge(
      options.params, // form field params we obtained from up.form.destinationOptions() above
      ...u.map(dirtyRenderOptionsList, 'params') // each validate() call can pass a a custom { params } option
    )

    options.headers = u.merge(...u.map(dirtyRenderOptionsList, 'headers'))

    // Make sure the X-Up-Validate header is present, so the server-side
    // knows that it should not persist the form submission
    options.headers[up.protocol.headerize('validate')] = dirtyNames.join(' ') || ':unknown'

    // The guardEvent will be be emitted on the render pass' { origin }, so the form in this case.
    // The guardEvent will also be assigned a { renderOptions } attribute in up.render()
    options.guardEvent = up.event.build('up:form:validate', {
      fields: dirtyFields,
      log: 'Validating form',
      params: options.params
    })

    // We don't render concurrently. If additional fields want to validate
    // while our request is in flight, they add to a new @dirtySolutions array.
    this.rendering = true

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
    options.disable = false
    for (let solution of dirtySolutions) {
      up.form.disableWhile(renderingPromise, {
        disable: solution.renderOptions.disable,
        origin: solution.origin,
      })
    }

    try {
      // Resolve all promises we have handed out for the now-rendered solutions.
      renderingPromise.resolve(up.render(options))
      await renderingPromise
    } finally {
      this.rendering = false
      // Additional solutions may have become dirty while we were rendering so we check again.
      // If no pending solutions are found, the method will return immediately.
      this.renderDirtySolutions()
    }
  }

  buildDataMap(solutions) {
    let dataMap = {}

    for (let solution of solutions) {
      let data = u.pluckKey(solution.renderOptions, 'data')
      let keepData = u.pluckKey(solution.renderOptions, 'keepData')
      if (keepData) {
        data = up.data(solution.element)
      }

      if (data) {
        dataMap[solution.target] = data
      }
    }

    return dataMap
  }

  static forElement(element) {
    let form = up.form.get(element)
    return form.upFormValidator ||= new this(form)
  }

}
