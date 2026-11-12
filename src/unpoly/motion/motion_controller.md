# startFunction()

Calls the given function and tracks the animation it starts, so it can be
[`finished`](/up.MotionController.finish) later.

Does not finish existing animations. Callers are expected to finish previous
animations on their elements before they first change the DOM, unless they are nested.

The function is expected to return a promise that is fulfilled when
the animation ends. The function is also expected to listen to
`this.finishEvent` and instantly skip to the last frame
when the event is observed.

@function startFunction
@param {List<Element>} cluster
  A list of elements that will be affected by the motion.
@param {Function(): Promise} startMotionFn
@return {Promise}
  A promise that fulfills when the animation ends.
@internal
