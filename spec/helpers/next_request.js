jasmine.nextEvent = function(...args) {
  let eventType = args.pop()
  let element = args[0] instanceof Element ? args.shift() : document
  return new Promise((resolve) => {
    element.addEventListener(eventType, resolve, { once: true })
  })
}
