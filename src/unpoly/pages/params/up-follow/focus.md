@partial up-follow/focus

@param [up-focus='auto']
  What to focus after the new fragment was rendered.

  See [Controlling focus](/focus) for a list of allowed values.

@param [up-focus-visible='auto']
  Whether the focused element should have a [visible focus ring](/focus-visibility).
  
  By default focus will be visible if `up.viewport.config.autoFocusVisible()`
  returns `true` for the focused element and [current input device](/up.event.inputDevice).

@param [up-save-focus='true']
  Whether to [save focus-related state](/up.viewport.saveFocus) before updating the fragment.

  Saved scroll positions can later be restored with [`[up-focus=restore]`](/focus#restoring-focus).
