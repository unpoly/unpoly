@partial up.render/loading-state

@param {boolean|string|Element|Array} [options.disable]
  [Disables form controls](/disabling-forms) while the request is loading.

@param {string|Element|List<Node>} [options.placeholder]
  A [placeholder](/placeholders) to show within the targeted fragment while new content is loading.

  Existing children of the targeted fragment [will be hidden](/placeholders#basic-example) during the request.
  When the request ends for any reason, all changes will be reverted.

  @experimental

@param {string|Function(up.Preview)|Array} [options.preview]
  One or more [previews](/previews) that temporarily change the page
  while new content is loading.

  The preview changes will be reverted automatically
  when the request ends for [any reason](/previews#ending).

@param {boolean} [options.feedback=true]
  Whether to set [feedback classes](/feedback-classes)
  while loading content.
