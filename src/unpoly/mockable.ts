import * as u from './util.js'

/**
A function wrapped by `up.mockable()`. In specs, `fn.mock()` replaces the original with a Jasmine spy.
Outside of specs there is no wrapper and no `mock()`.
@internal
*/
export type MockableFunction<F extends u.AnyFunction> = F & { mock(): any }

export function mockable<F extends u.AnyFunction>(originalFn: F): MockableFunction<F> {
  if (window.jasmine) {
    let name = originalFn.name
    let obj = { [name]: originalFn }
    let mockableFn = function() {
      return obj[name].apply(this, arguments)
    } as MockableFunction<F>
    mockableFn.mock = () => spyOn(obj, name)
    return mockableFn
  } else {
    return originalFn as MockableFunction<F>
  }
}
