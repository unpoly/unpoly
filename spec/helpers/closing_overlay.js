// Helpers for specs about elements in an overlay that has closed, but is still playing its exit animation.
//
// configure_animation.js and makeLayers() disable close animations. Without an animation a closing
// overlay's element is removed right away, and such a spec would test nothing. So these helpers open
// an overlay with a real close animation. Browser timers are not precise, so don't make it much shorter.

const CLOSE_ANIMATION_OPTIONS = { closeAnimation: 'fade-out', closeDuration: 100 }

// Opens an overlay that keeps its element in the DOM for its close animation.
window.openOverlayWithCloseAnimation = async function(options = {}) {
  let overlay = await up.layer.open({ ...CLOSE_ANIMATION_OPTIONS, ...options })
  // An overlay only animates its closing once it has finished its opening animation (which
  // has no duration here, but is still async).
  await wait()
  return overlay
}

// Opens { overlays } overlays. The front overlay contains the given { form }, which must
// render into its parent layer's <main id="main">. The form is submitted, closing the front overlay ("peeling").
// We expect the render pass to succeed while the closing overlay is still in the DOM.
window.expectSubmitFromClosingOverlay = async function({ overlays, form, prepare }) {
  if (overlays === 2) {
    await up.layer.open({ fragment: '<main id="main">old main</main>' })
  } else {
    htmlFixtureList('<main id="main">old main</main>')
  }

  let closingOverlay = await openOverlayWithCloseAnimation({ fragment: form })
  let formElement = closingOverlay.element.querySelector('form')
  await prepare?.(formElement)

  let renderJob = up.submit(formElement)
  await wait()
  jasmine.respondWith('<main id="main">new main</main>')

  await expectAsync(renderJob).toBeResolved()

  expect(closingOverlay.element).toHaveClass('up-destroying')
  expect(closingOverlay).not.toBeAlive()
  expect(up.layer.count).toBe(overlays)
  expect(up.fragment.get('#main', { layer: 'front' })).toHaveText('new main')

  return { closingOverlay, formElement }
}
