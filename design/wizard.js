/*
<form class="wizard">
  <div class="wizard--step">
    ...
  </div>
  <div class="wizard--step">
    ...
  </div>
</form>
*/


up.compiler('form.wizard', function(form) {

  function getSteps() {
    return form.querySelectorAll('.wizard--step')
  }

  function getCurrentStep() {
    return getSteps()[stepIndex]
  }

  function toggleSteps() {
    getSteps().forEach((step, index) => {
      up.element.toggle(step, index === stepIndex)
    })
  }

  function stepDone() {
    if (stepIndex < getSteps().length - 1) {
      stepIndex++
      toggleSteps()
    } else {
      up.form.submit(form, { isFinalSubmit: true })
    }
  }

  function hasError(step) {
    return !!step.querySelector('.field-with-errors')
  }

  form.addEventListener('up:form:submit', async function(event) {
    if (event.renderOptions.isFinalSubmit) return

    event.preventDefault()

    await up.validate(getCurrentStep())

    if (!hasError(getCurrentStep())) {
      stepDone()
    }
  })

  let stepWithErrors = getSteps().find(hasError)
  let stepIndex = stepWithErrors ? getSteps.indexOf(stepWithErrors) : 0

  toggleSteps()
})
