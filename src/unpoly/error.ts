export { Aborted } from './error/aborted.js'
export { Blocked } from './error/blocked.js'
export { CannotMatch } from './error/cannot_match.js'
export { CannotParse } from './error/cannot_parse.js'
export { CannotTarget } from './error/cannot_target.js'
import { UpError } from './error/error.js'
export { UpError }
export { NotImplemented } from './error/not_implemented.js'
export { Offline } from './error/offline.js'

export function fail(...args: [message: string, ...vars: any[]]): never {
  // Yes, we pass the message plus all substitution vars as an array in the first arg slot.
  throw new UpError(args)
}

// up.Response and up.RenderResult implement this protocol to mark their instances as uncritical.
// An `instanceof` check would have to import them, but util imports this module. Their modules,
// and every namespace they import, would then be evaluated before util.
export function isCritical(error: any): boolean {
  return (typeof error !== 'object') || (error[isCritical.key] ? error[isCritical.key]() : (error.name !== 'AbortError'))
}

isCritical.key = 'up.error.isCritical' as const

// Takes a promise, or a promise-like object like an up.RenderJob.
export function muteUncriticalRejection<T>(promise: Pick<Promise<T>, 'catch'>): Promise<T | void> {
  return promise.catch(throwCritical)
}

export function muteUncriticalSync<T>(block: () => T): T | undefined {
  try {
    return block()
  } catch (error) {
    throwCritical(error)
  }
}

export function throwCritical(value: any): void {
  if (isCritical(value)) {
    throw value
  }
}

export function guard<A extends any[], R>(fn: (...args: A) => R, ...args: A): R | undefined {
  try {
    return fn(...args)
  } catch (error) {
    reportError(error)
  }
}

export function guardPromise<T>(promise: Promise<T>): Promise<T | void> {
  return promise.catch(reportError)
}

export function guardFn<A extends any[], R>(fn: ((...args: A) => R) | undefined): ((...args: A) => R | undefined) | undefined {
  if (fn) {
    return (...args) => guard(() => fn(...args))
  }
}

export const api = {
  error: {
    muteUncriticalRejection,
  },
}
