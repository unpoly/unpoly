u = up.util
e = up.element
$ = jQuery

appendDefaultFallback = (parent) ->
  e.affix(parent, '.default-fallback')

beforeEach (done) ->
  up.on 'click', 'a[href]', (event) ->
    event.preventDefault()
    messageParts = ['Unhandled default click behavior for link %o', event.target]
    up.fail(messageParts...)
    done.fail(u.sprintf(messageParts...))
  up.on 'submit', 'form', (event) ->
    event.preventDefault()
    messageParts = ['Unhandled default submit behavior for form %o', event.target]
    up.fail(messageParts...)
    done.fail(u.sprintf(messageParts...))
  done()

beforeEach ->
  up.layer.config.all.targets = ['.default-fallback']
  up.fragment.config.targets = [] # no 'body'
  up.history.config.restoreTargets = ['.default-fallback']
  appendDefaultFallback(document.body)

  up.on 'up:layer:opening', (event) ->
    appendDefaultFallback(event.layer.element.querySelector('.up-overlay-content'))

afterEach ->
  up.destroy('.default-fallback', log: false)
