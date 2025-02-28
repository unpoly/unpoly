@partial up.render/focus

@param {boolean|string|Element|Function} [options.focus]
  What to focus after the new fragment was rendered.

  See [Controlling focus](/focus) for a list of allowed values.

@param {boolean} [options.saveFocus=true]
  Whether to [save focus-related state](/up.viewport.saveFocus) before updating the fragment.

  Saved focus state can later be restored with [`{ focus: 'restore' }`](/focus#restoring-focus).
