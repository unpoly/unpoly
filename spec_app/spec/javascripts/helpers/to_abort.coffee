u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toAbort: (util, customEqualityTesters) ->
      compare: (fn) ->
        error = null

        try
          fn()
        catch e
          error = e

        pass: error && (error instanceof Error) && error.name == 'AbortError'
