e = up.element

TRANSITION_DELAY = 300

class up.ProgressBar

  constructor: ->
    @step = 0
    @element = e.affix(document.body, 'up-progress-bar')
    @element.style.transition = "width #{TRANSITION_DELAY}ms ease-out"

    @moveTo(0)
    # The element must be painted at width: 0 before we apply the target width.
    # If the first paint sees the bar at the target width, we don't get an animated transition.
    up.element.paint(@element)

    @width = 31
    @nextStep()

  nextStep: ->
    if @width < 80
      if Math.random() < 0.15
        # Sometimes the bar grows quickly by (7..12) percent.
        diff = 7 + 5 * Math.random()
      else
        # Most of the time the bar progresses by (1.5..2) percent.
        diff = 1.5 + 0.5 * Math.random()
    else
      # Above 80% completion we grow the bar more slowly,
      # using a formula that can never reach 100%.
      diff = 0.13 * (100 - width) * Math.random()

    @moveTo(@width + diff)
    @step++

    # Steps occur less frequent the longer we wait for the server.
    nextStepDelay = TRANSITION_DELAY + @step * 40
    @timeout = setTimeout(@nextStep.bind(this), nextStepDelay)

  moveTo: (width) ->
    @width = width
    @element.style.width = "#{width}vw"

  destroy: ->
    clearTimeout(@timeout)
    e.remove(@element)

  conclude: ->
    clearTimeout(@timeout)
    @moveTo(100)
    setTimeout(@destroy.bind(this), TRANSITION_DELAY)
