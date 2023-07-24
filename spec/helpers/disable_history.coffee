beforeEach ->
  # Webkit ignores replaceState() calls after 100 calls / 30 sec.
  # So specs need to explicitly enable history handling.
  up.history.config.enabled = false
