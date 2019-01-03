###**
Tooltips
========

Unpoly comes with a basic tooltip implementation.

Add an [`up-tooltip`](/up-tooltip) attribute to any HTML tag to show a tooltip whenever
the user hovers over the element:

      <a href="/decks" up-tooltip="Show all decks">Decks</a>


\#\#\# Styling

The default styles
render a tooltip with white text on a gray background.
A gray triangle points to the element.

To change the styling, simply override the [CSS rules](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/unpoly/tooltip.sass) for the `.up-tooltip` selector and its `:after`
selector that is used for the triangle.

The HTML of a tooltip element is simply this:

    <div class="up-tooltip">
      Show all decks
    </div>

The tooltip element is appended to the end of `<body>`.

@class up.tooltip
###
up.tooltip = do ->
  
  u = up.util
  e = up.element

  ###**
  Configures defaults for future tooltips.

  @property up.tooltip.config
  @param {string} [config.position]
    The default position of tooltips relative to the element.
    Can be `'top'`, `'right'`, `'bottom'` or `'left'`.
  @param {string} [config.openAnimation='fade-in']
    The animation used to open a tooltip.
  @param {string} [config.closeAnimation='fade-out']
    The animation used to close a tooltip.
  @param {number} [config.openDuration]
    The duration of the open animation (in milliseconds).
  @param {number} [config.closeDuration]
    The duration of the close animation (in milliseconds).
  @param {string} [config.openEasing]
    The timing function controlling the acceleration of the opening animation.
  @param {string} [config.closeEasing]
    The timing function controlling the acceleration of the closing animation.
  @stable
  ###
  config = new up.Config
    position: 'top'
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    openDuration: 100
    closeDuration: 50
    openEasing: null
    closeEasing: null

  state = new up.Config
    phase: 'closed'      # can be 'opening', 'opened', 'closing' and 'closed'
    anchor: null         # the element to which the tooltip is anchored
    tooltip: null        # the .up-tooltip element
    content: null        # the .up-tooltip-content element
    tether: null         # the up.Tether instance controlling the tooltip's position
    position: null       # the position of the tooltip element relative to its anchor

  chain = new up.DivertibleChain()

  reset = ->
    state.tether?.destroy()
    state.reset()
    chain.reset()
    config.reset()

  createElement = (options) ->
    state.tether = new up.Tether(u.only(state, 'anchor', 'position'))
    state.tooltip = e.affix(state.tether.root, '.up-tooltip', 'up-position': state.position)
    state.content = e.affix(state.tooltip, '.up-tooltip-content')

    if options.text
      state.content.innerText = options.text
    else
      state.content.innerHTML = options.html

  ###**
  Opens a tooltip over the given element.

  The unobtrusive variant of this is the [`[up-tooltip]`](/up-tooltip) selector.

  \#\#\# Examples

  In order to attach a tooltip to a `<span class="help">?</span>`:

      up.tooltip.attach('.help', {
        text: 'Enter multiple words or phrases'
      });

  @function up.tooltip.attach
  @param {Element|jQuery|string} elementOrSelector
  @param {string} [options.text]
    The text to display in the tooltip.

    Any HTML control characters will be escaped.
    If you need to use HTML formatting in the tooltip, use `options.html` instead.
  @param {string} [options.html]
    The HTML to display in the tooltip unescaped.

    Make sure to escape any user-provided text before passing it as this option,
    or use `options.text` (which automatically escapes).
  @param {string} [options.position='top']
    The position of the tooltip.
    Can be `'top'`, `'right'`, `'bottom'` or `'left'`.
  @param {string} [options.animation]
    The [animation](/up.motion) to use when opening the tooltip.
  @return {Promise}
    A promise that will be fulfilled when the tooltip's opening animation has finished.
  @stable
  ###
  attachAsap = (elementOrSelector, options = {}) ->
    chain.asap closeNow, (-> attachNow(elementOrSelector, options))

  attachNow = (elementOrSelector, options = {}) ->
    anchor = e.get(elementOrSelector)
    html = options.html ? anchor.getAttribute('up-tooltip-html')
    text = options.text ? anchor.getAttribute('up-tooltip')
    position = options.position ? anchor.getAttribute('up-position') ? config.position
    animation = options.animation ? e.castedAttr(anchor, 'up-animation') ? config.openAnimation
    animateOptions = up.motion.animateOptions(options, anchor, duration: config.openDuration, easing: config.openEasing)

    state.phase = 'opening'
    state.anchor = anchor
    state.position = position
    createElement({ text, html })
    state.tether.align()
    up.animate(state.tooltip, animation, animateOptions).then ->
      state.phase = 'opened'

  ###**
  Closes a currently shown tooltip.

  Does nothing if no tooltip is currently shown.

  @function up.tooltip.close
  @param {Object} options
    See options for [`up.animate()`](/up.animate).
  @return {Promise}
    A promise for the end of the closing animation.
  @stable
  ###
  closeAsap = (options) ->
    chain.asap -> closeNow(options)

  closeNow = (options) ->
    unless isOpen() # this can happen when a request fails and the chain proceeds to the next task
      return Promise.resolve()

    options = u.options(options, animation: config.closeAnimation)
    animateOptions = up.motion.animateOptions(options, duration: config.closeDuration, easing: config.closeEasing)
    u.assign(options, animateOptions)
    state.phase = 'closing'
    up.destroy(state.tooltip, options).then ->
      state.phase = 'closed'
      state.tether.destroy()
      state.tether = null
      state.tooltip = null
      state.content = null
      state.anchor = null

  ###**
  Returns whether a tooltip is currently showing.

  @function up.tooltip.isOpen
  @stable
  ###
  isOpen = ->
    state.phase == 'opening' || state.phase == 'opened'

  ###**
  Displays a tooltip with text content when hovering the mouse over this element.

  \#\#\# Example

      <a href="/decks" up-tooltip="Show all decks">Decks</a>

  To make the tooltip appear below the element instead of above the element,
  add an `up-position` attribute:

      <a href="/decks" up-tooltip="Show all decks" up-position="bottom">Decks</a>

  @selector [up-tooltip]
  @param {string} [up-animation]
    The animation used to open the tooltip.
    Defaults to [`up.tooltip.config.openAnimation`](/up.tooltip.config).
  @param {string} [up-position]
    The default position of tooltips relative to the element.
    Can be either `"top"` or `"bottom"`.
    Defaults to [`up.tooltip.config.position`](/up.tooltip.config).
  @stable
  ###

  ###**
  Displays a tooltip with HTML content when hovering the mouse over this element:

      <a href="/decks" up-tooltip-html="Show &lt;b&gt;all&lt;/b&gt; decks">Decks</a>

  @selector [up-tooltip-html]
  @stable
  ###
  up.compiler '[up-tooltip], [up-tooltip-html]', (opener) ->
    # Don't register these events on document since *every*
    # mouse move interaction  bubbles up to the document. 
    opener.addEventListener 'mouseenter', -> attachAsap(opener)
    opener.addEventListener 'mouseleave', -> closeAsap()

  # We close the tooltip when someone clicks on the document.
  # We also need to listen to up:action:consumed in case an [up-instant] link
  # was followed on mousedown.
  up.on 'click up:action:consumed', (_event) -> # do take an argument so we won't parse [up-data]
    closeAsap()
    # Do not halt the event chain here. The user is allowed to directly activate
    # a link in the background, even with a (now closing) tooltip open.

  # The framework is reset between tests, so also close a currently open tooltip.
  up.on 'up:framework:reset', reset

  # Close the tooltip when the user presses ESC.
  up.event.onEscape(-> closeAsap())

  config: config
  attach: attachAsap
  isOpen: isOpen
  close: closeAsap

