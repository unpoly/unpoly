# up.util

@namespace up.util

-----

# up.util.only()

Returns a copy of the given object that only contains
the given keys.

@function up.util.only
@param {Object} object
@param {Array} ...keys
@deprecated
  Use `up.util.pick()` instead.

-----

# up.util.except()

Returns a copy of the given object that contains all except
the given keys.

@function up.util.except
@param {Object} object
@param {Array} ...keys
@deprecated
  Use `up.util.omit(object, keys)` (with an array argument) instead of `up.util.except(object, ...keys)` (with rest arguments).

-----

# up.util.times()

Calls the given function for the given number of times.

@function up.util.times
@param {number} count
@param {Function()} block
@deprecated
  Use a `for` loop instead.

-----

# up.util.assign()

Merge the own properties of one or more `sources` into the `target` object.

@function up.util.assign
@param {Object} target
@param {Array<Object>} ...sources
@deprecated
  Use [`Object.assign()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) instead.

-----

# up.util.values()

Returns an array of values of the given object.

@function up.util.values
@param {Object} object
@return {Array<string>}
@deprecated
  Use [`Object.values()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values) instead.

-----

# up.util.microtask()

Pushes the given function to the [JavaScript microtask queue](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/).

@function up.util.microtask
@param {Function()} task
@return {Promise}
  A promise that is resolved with the return value of `task`.

  If `task` throws an error, the promise is rejected with that error.
@deprecated
  Use [`queueMicrotask()`](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask) instead.
