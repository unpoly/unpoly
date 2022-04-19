const u = up.util

/*-
(1) Parses JSON lazily on first use.
(2) Defaults values to the element's fataset.

@class up.FragmentDataProxyHandler
*/
up.FragmentDataProxyHandler = class FragmentDataProxyHandler {

  // (1) jsonString must be serialized object. It must not be empty.
  //     It must not contain a serialized, non-object value.
  // (2) The proxy's target must the element's `dataset`.
  constructor(jsonString) {
    this.jsonString = jsonString
  }

  get(target, key) {
    return this.json[key] ?? target[key]
  }

  getOwnPropertyDescriptor(target, key) {
    return Object.getOwnPropertyDescriptor(this.json, key) || Object.getOwnPropertyDescriptor(target, key)
  }

  set(target, key, value) {
    // (1) Since get() prioritizes values from the JSON object we only need to set it there.
    // (2) Setting a property on dataset would also set a [data-] attribute, which we don't need.
    this.json[key] = value
  }

  deleteProperty(target, key) {
    delete this.json[key]
    delete target[key]
    // The deleteProperty() method must return a Boolean indicating whether or not the
    // property has been successfully deleted. Vanilla JS objects always return true,
    // whether or not the property previously existed.
    return true
  }

  ownKeys(target) {
    return u.uniq(Object.keys(this.json).concat(Object.keys(target)))
  }

  has(target, key) {
    return (key in this.json) || (key in target)
  }

  get json() {
    return this.parsedJSON ||= JSON.parse(this.jsonString)
  }

}
