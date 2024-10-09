u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toContain: (util, customEqualityTesters) ->
      compare: (container, expectedElement) ->
        if u.isMissing(container)
          return { pass: false }

        if (container instanceof Element) || (container instanceof Document)
          return { pass: (expectedElement instanceof Node) && container.contains(expectedElement) }

        # Array, String
        return { pass: u.contains(container, expectedElement) }

