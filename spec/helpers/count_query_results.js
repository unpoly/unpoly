// Counts the elements returned by querySelectorAll(), which is how lookups find candidate elements.
// Call within a spec. Returns a function that returns the count so far.
window.countQueryResults = function() {
  let count = 0
  for (let prototype of [Element.prototype, Document.prototype]) {
    let original = prototype.querySelectorAll
    spyOn(prototype, 'querySelectorAll').and.callFake(function(...args) {
      let result = original.apply(this, args)
      count += result.length
      return result
    })
  }
  return () => count
}
