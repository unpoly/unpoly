u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toContain: (util, customEqualityTesters) ->
      compare: (container, expectedElement) ->
        if u.isMissing(container)
          return { pass: false }

        if u.isElementLike(container)
          return { pass: container.contains(expectedElement) }

        # Array, String
        return { pass: u.contains(container, expectedElement) }

