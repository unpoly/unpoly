// Waits until the element's Web Animation is playing, then pauses it at the given time
// (in milliseconds). Returns the animation, so the spec can seek further by setting its
// `currentTime`, or resume with `play()`.
//
// Only seeks the element's first animation. For an element with several animations (like
// a CSS transition next to up.animate()), seek each from `element.getAnimations()`.
//
// Use this to assert an intermediate frame. Waiting for a fixed time and then asserting
// fails on a busy machine (like CI), where the browser may not render a frame for hundreds
// of milliseconds, and an animation that should be half-way still shows its first frame.
async function seekAnimation(element, time) {
  const [animation] = element.getAnimations()
  if (!animation) throw new Error('Element has no animation')

  await animation.ready
  animation.pause()
  animation.currentTime = time
  return animation
}

jasmine.seekAnimation = seekAnimation
