u = up.util
$ = jQuery

# We have a lot of specs that measure the distance of elements
# from the screen edge, so we can't have the Jasmine runner to have
# any margins on the body.
beforeEach ->
  $('body').css('margin-top': 0)
