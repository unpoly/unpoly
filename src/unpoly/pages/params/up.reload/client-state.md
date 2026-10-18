@partial up.reload/client-state

@param {boolean} [options.keepData]
  Whether to [preserve](/learn/data#preserving) the fragment's [data object](/learn/data) throughout the update.

  Properties from the new fragment's `[up-data]` are overridden with the old fragment's `[up-data]`.

@mix up.render/client-state
