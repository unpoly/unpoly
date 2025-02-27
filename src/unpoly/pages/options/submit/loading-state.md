@partial options/submit/loading-state

@mix options/render/loading-state
  @param options.disable
    [Disables form controls](/disabling-forms) while the request is loading.

    The values of disabled fields will still be included in the submitted form params.
