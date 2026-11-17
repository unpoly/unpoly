declare module '../unpoly.js' {
  interface Up {
    readonly CannotCompile: CoreApi['Error']
  }
}

class DeprecatedCannotCompile extends up.Error {}
// unpoly.ts names the classes on window.up before this script runs, so we name this one ourselves.
up.internal.setClassName(DeprecatedCannotCompile, 'up.CannotCompile')

Object.defineProperty(up, 'CannotCompile', { get: function() {
    up.migrate.warn('The error up.CannotCompile is no longer thrown. Compiler errors now emit an "error" event on window, but no longer crash the render pass.')
  return DeprecatedCannotCompile
} })
