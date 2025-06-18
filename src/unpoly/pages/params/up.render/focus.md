@partial up.render/focus

@param {boolean|string|Element|Function} [options.focus]
  What to focus after the new fragment was rendered.

  See [Controlling focus](/focus) for a list of allowed values.

@param {boolean|string|Element|Function} [options.failFocus]
  What to focus after the new fragment was rendered from a failed response.

  See [Rendering failed responses differently](/failed-responses#fail-options).

@param {boolean|string} [options.focusVisible='auto']
  Whether the focused element should have a [visible focus ring](/focus-visibility).

  By default focus will be visible if `up.viewport.config.autoFocusVisible()`
  returns `true` for the focused element and [current input device](/up.event.inputDevice).

@param {boolean} [options.saveFocus=true]
  Whether to [save focus-related state](/up.viewport.saveFocus) before updating the fragment.

  Saved focus state can later be restored with [`{ focus: 'restore' }`](/focus#restoring-focus).
