@partial up-follow/loading-state

@param [up-disable]
  [Disables form controls](/disabling-forms#from-link) while the link is loading.

@param [up-placeholder]
  A [placeholder](/placeholders) to show in the targeted fragment while new content is loading.

  Existing children of the targeted fragment [will be hidden](/placeholders#basic-example) during the request.
  When the request ends for any reason, all changes will be reverted.

  You can either [pass a HTML string](/placeholders#basic-example)
  or [refer to a template](/placeholders#from-template), optionally with
  [variables](/placeholders#dynamic-templates).

  If this link [opens a new overlay](/opening-overlays), the placeholder
  will be shown temporary overlay with the same [visual style](/customizing-overlays) and open animation.

  @experimental

@param [up-preview]
  The name of a [preview](/previews) that temporarily changes the page
  while new content is loading.

  The preview changes will be reverted automatically
  when the request ends for [any reason](/previews#ending).

@param [up-feedback='true']
  Whether to set [feedback classes](/feedback-classes)
  while loading content.
