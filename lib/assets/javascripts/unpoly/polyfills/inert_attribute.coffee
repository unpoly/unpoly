#u = up.util
#e = up.element
#
#FOCUSABLE = [
#  'a[href]',
#  'area',
#  'input',
#  'select',
#  'textarea',
#  'button',
#  'iframe',
#  'object',
#  'embed',
#  '[tabindex]',
#  '[contenteditable]',
#]
#
#isInert = (element) -> e.closest(element, '[inert]')
#
#up.on 'focusin', (event) ->
#  console.debug("focusin on %o, activeElement is %o", event.target, document.activeElement)
#  if isInert(event.target)
#    console.debug("isInert()")
#    candidates = e.all(FOCUSABLE.join(','))
#    console.debug("nom-inert elements are %o", candidates)
#    candidate = u.detect candidates, (element) ->
#      !element.disabled && !isInert(element)
#
#    console.debug("candidate is %o", candidate)
#
#    if candidate
#      candidate.focus()
#
#    # the focusin event is not cancelable
c