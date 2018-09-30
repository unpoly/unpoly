describe 'up.query', ->

  u = up.util

  describe 'up.query.all()', ->

    it 'returns all descendants of the given root matching the given selector', ->
      $element = affix('.element')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      results = up.query.all($element[0], '.match')
      expect(results).toEqual [$matchingChild[0], $matchingGrandChild[0]]

    it 'returns an empty list if no descendant matches', ->
      $element = affix('.element')
      $child = $element.affix('.child')
      $grandChild = $child.affix('.grand-child')
      results = up.query.all($element[0], '.match')
      expect(results).toEqual []

    it 'does not return the root itself, even if it matches', ->
      $element = affix('.element.match')
      results = up.query.all($element[0], '.match')
      expect(results).toEqual []

    it 'does not return ancestors of the root, even if they match', ->
      $parent = affix('.parent.match')
      $element = $parent.affix('.element')
      results = up.query.all($element[0], '.match')
      expect(results).toEqual []

    it 'supports the custom :has() selector', ->
      $element = affix('.element')
      $childWithSelectorWithChild = $element.affix('.selector')
      $childWithSelectorWithChild.affix('.match')
      $childWithSelectorWithoutChild = $element.affix('.selector')
      $childWithoutSelectorWithChild = $element.affix('.other-selector')
      $childWithoutSelectorWithChild.affix('.match')
      $childWithoutSelectorWithoutChild = affix('.other-selector')

      results = up.query.all($element[0], '.selector:has(.match)')
      expect(results).toEqual [$childWithSelectorWithChild[0]]

  describe 'up.query.first()', ->

    it 'returns the first descendant of the given root that matches the given selector', ->
      $element = affix('.element')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      result = up.query.first($element[0], '.match')
      expect(result).toEqual $matchingChild[0]

    it 'returns null if no descendant matches', ->
      $element = affix('.element')
      $child = $element.affix('.child')
      $grandChild = $child.affix('.grand-child')
      result = up.query.first($element[0], '.match')
      expect(result).toBeNull()

    it 'does not return the root itself, even if it matches', ->
      $element = affix('.element.match')
      result = up.query.first($element[0], '.match')
      expect(result).toBeNull()

    it 'does not return an ancestor of the root, even if it matches', ->
      $parent = affix('.parent.match')
      $element = $parent.affix('.element')
      result = up.query.first($element[0], '.match')
      expect(result).toBeNull()

    it 'supports the custom :has() selector', ->
      $element = affix('.element')
      $childWithSelectorWithChild = $element.affix('.selector')
      $childWithSelectorWithChild.affix('.match')
      $childWithSelectorWithoutChild = $element.affix('.selector')
      $childWithoutSelectorWithChild = $element.affix('.other-selector')
      $childWithoutSelectorWithChild.affix('.match')
      $childWithoutSelectorWithoutChild = affix('.other-selector')

      result = up.query.first($element[0], '.selector:has(.match)')
      expect(result).toEqual [$childWithSelectorWithChild[0]]

  describe 'up.query.subtree()', ->

    it 'returns all descendants of the given root matching the given selector', ->
      $element = affix('.element')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      results = up.query.all($element[0], '.match')
      expect(results).toEqual [$matchingChild[0], $matchingGrandChild[0]]

    it 'includes the given root if it matches the selector', ->
      $element = affix('.element.match')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      results = up.query.subtree($element[0], '.match')
      expect(results).toEqual [$element[0], $matchingChild[0], $matchingGrandChild[0]]

    it 'does not return ancestors of the root, even if they match', ->
      $parent = affix('.parent.match')
      $element = $parent.affix('.element')
      results = up.query.subtree($element[0], '.match')
      expect(results).toEqual []

    it 'returns an empty list if neither root nor any descendant matches', ->
      $element = affix('.element')
      $child = $element.affix('.child')
      results = up.query.subtree($element[0], '.match')
      expect(results).toEqual []

    it 'supports the custom :has() selector', ->
      $element = affix('.selector')
      $childWithSelectorWithChild = $element.affix('.selector')
      $childWithSelectorWithChild.affix('.match')
      $childWithSelectorWithoutChild = $element.affix('.selector')
      $childWithoutSelectorWithChild = $element.affix('.other-selector')
      $childWithoutSelectorWithChild.affix('.match')
      $childWithoutSelectorWithoutChild = affix('.other-selector')

      results = up.query.subtree($element[0], '.selector:has(.match)')
      expect(results).toEqual [$element[0], $childWithSelectorWithChild[0]]

  describe 'closest()', ->

    it 'returns the closest ancestor of the given root that matches the given selector', ->
      $grandGrandMother = affix('.match')
      $grandMother = affix('.match')
      $mother = $grandMother.affix('.no-match')
      $element = $mother.affix('.element')

      result = up.query.closest($element[0], '.match')
      expect(result).toBe($grandMother[0])

    it 'returns the given root if it matches', ->
      $mother = affix('.match')
      $element = $mother.affix('.match')

      result = up.query.closest($element[0], '.match')
      expect(result).toBe($element[0])

    it 'does not return descendants of the root, even if they match', ->
      $mother = affix('.match')
      $element = $mother.affix('.match')

      result = up.query.closest($element[0], '.match')
      expect(result).toBe($element[0])

    it 'returns null if neither root nor ancestor matches', ->
      $mother = affix('.no-match')
      $element = $mother.affix('.no-match')

      result = up.query.closest($element[0], '.match')
      expect(result).toBeNull()

