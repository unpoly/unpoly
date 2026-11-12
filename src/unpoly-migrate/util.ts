// A deprecated alias has the type of the function that replaces it.
declare module '../unpoly.js' {
  interface Up {
    util: CoreApi['util'] & {
      only<T extends object, K extends keyof T>(object: T, ...keys: K[]): Pick<T, K>
      except<T extends object, K extends keyof T>(object: T, ...keys: K[]): Omit<T, K>
      parseUrl: CoreApi['util']['parseURL']
      any: CoreApi['util']['some']
      all: CoreApi['util']['every']
      detect: CoreApi['util']['find']
      select: CoreApi['util']['filter']
      setTimer: CoreApi['util']['timer']
      escapeHtml: CoreApi['util']['escapeHTML']
      selectorForElement: CoreApi['fragment']['toTarget']
      nextFrame: CoreApi['util']['task']
      times(count: number, block: () => void): void
      assign: ObjectConstructor['assign']
      values: ObjectConstructor['values']
      microtask<T>(task: () => T): Promise<T>
    }
  }
}

up.util.only = function(object, ...keys) {
  up.migrate.deprecated('up.util.only(object, ...keys)', 'up.util.pick(object, keys)')
  return up.util.pick(object, keys)
}

up.util.except = function(object, ...keys) {
  up.migrate.deprecated('up.util.except(object, ...keys)', 'up.util.omit(object, keys)')
  return up.util.omit(object, keys)
}

up.util.parseUrl = function(...args) {
  up.migrate.deprecated('up.util.parseUrl()', 'up.util.parseURL()')
  return up.util.parseURL(...args)
}

up.util.any = function(...args) {
  up.migrate.deprecated('up.util.any()', 'up.util.some()')
  return up.util.some(...args)
}

up.util.all = function(...args) {
  up.migrate.deprecated('up.util.all()', 'up.util.every()')
  return up.util.every(...args)
}

up.util.detect = function(...args) {
  up.migrate.deprecated('up.util.detect()', 'up.util.find()')
  return up.util.find(...args)
}

up.util.select = function(...args) {
  up.migrate.deprecated('up.util.select()', 'up.util.filter()')
  return up.util.filter(...args)
}

up.util.setTimer = function(...args) {
  up.migrate.deprecated('up.util.setTimer()', 'up.util.timer()')
  return up.util.timer(...args)
}

up.util.escapeHtml = function(...args) {
  up.migrate.deprecated('up.util.escapeHtml()', 'up.util.escapeHTML()')
  return up.util.escapeHTML(...args)
}

up.util.selectorForElement = function(...args) {
  up.migrate.deprecated('up.util.selectorForElement()', 'up.fragment.toTarget()')
  return up.fragment.toTarget(...args)
}

up.util.nextFrame = function(...args) {
  up.migrate.deprecated('up.util.nextFrame()', 'up.util.task()')
  return up.util.task(...args)
}

up.util.times = function(count, block) {
  up.migrate.deprecated('up.util.times()', 'a `for` loop')
  for (let i = 0; i < count; i++) {
    block()
  }
}

up.util.assign = function(...args: [object, ...any[]]) {
  up.migrate.deprecated('up.util.assign()', 'Object.assign()')
  return Object.assign(...args)
}

up.util.values = function(...args: [object]) {
  up.migrate.deprecated('up.util.values()', 'Object.values()')
  return Object.values(...args)
}

up.util.microtask = function(task) {
  up.migrate.deprecated('up.util.microtask()', 'queueMicrotask()')
  return Promise.resolve().then(task)
}

// Core calls this hook (up.util).
up.migrate.splitAtOr = function(value) {
  let parts = value.split(/\s+or\s+/)
  if (parts.length >= 2) {
    up.migrate.warn(`Separating tokens by \`or\` has been deprecated. Use a comma (\`,\`) instead. Found in "${value}".`)
    return parts
  }
}
