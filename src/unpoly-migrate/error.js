class DeprecatedCannotCompile extends up.Error {
  get [Symbol.toStringTag]() { return 'up.CannotCompile' }
}

Object.defineProperty(up, 'CannotCompile', { get: function() {
    up.migrate.warn('The error up.CannotCompile is no longer thrown. Compiler errors now emit an "error" event on window, but no longer crash the render pass.')
  return DeprecatedCannotCompile
} })
