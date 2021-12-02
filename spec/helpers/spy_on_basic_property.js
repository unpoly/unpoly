window.spyOnValueProperty = function(obj, prop, accessType = 'get') {
  let descriptor = jasmine.util.getPropertyDescriptor(obj, prop)
  let value = descriptor.value
  let newDescriptor = {
    ...descriptor,
    get: () => value,
    set: (newValue) => value = newValue
  }
  delete newDescriptor.value
  delete newDescriptor.writable
  Object.defineProperty(obj, prop, newDescriptor)
  return spyOnProperty(obj, prop, accessType)
}
