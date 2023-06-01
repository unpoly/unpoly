beforeEach ->
  # Make sure that motion specs work when the developer PC has disabled animations
  up.motion.config.enabled = true

  # Only run layer animations if the spec explicitly enables it.
  # Otherwise we have issues with opening layers bleeding into the next spec with an
  # AbortError in up.Change.OpenLayer#finish(). I wasn't able to fix this in reset_up.js.
  for mode in ['overlay', 'cover', 'drawer', 'modal', 'popup']
    up.layer.config[mode].openAnimation = false
    up.layer.config[mode].closeAnimation = false
