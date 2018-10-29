describe 'up.query', ->

  u = up.util

  describe 'up.query.descendants()', ->

    it 'returns all descendants of the given root matching the given selector', ->
      $element = affix('.element')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      results = up.query.descendants($element[0], '.match')
      expect(results).toEqual [$matchingChild[0], $matchingGrandChild[0]]

    it 'returns an empty list if no descendant matches', ->
      $element = affix('.element')
      $child = $element.affix('.child')
      $grandChild = $child.affix('.grand-child')
      results = up.query.descendants($element[0], '.match')
      expect(results).toEqual []

    it 'does not return the root itself, even if it matches', ->
      $element = affix('.element.match')
      results = up.query.descendants($element[0], '.match')
      expect(results).toEqual []

    it 'does not return ancestors of the root, even if they match', ->
      $parent = affix('.parent.match')
      $element = $parent.affix('.element')
      results = up.query.descendants($element[0], '.match')
      expect(results).toEqual []

    it 'supports the custom :has() selector', ->
      $element = affix('.element')
      $childWithSelectorWithChild = $element.affix('.selector')
      $childWithSelectorWithChild.affix('.match')
      $childWithSelectorWithoutChild = $element.affix('.selector')
      $childWithoutSelectorWithChild = $element.affix('.other-selector')
      $childWithoutSelectorWithChild.affix('.match')
      $childWithoutSelectorWithoutChild = affix('.other-selector')

      results = up.query.descendants($element[0], '.selector:has(.match)')
      expect(results).toEqual [$childWithSelectorWithChild[0]]

  describe 'up.query.descendant()', ->

    it 'returns the first descendant of the given root that matches the given selector', ->
      $element = affix('.element')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      result = up.query.descendant($element[0], '.match')
      expect(result).toEqual $matchingChild[0]

    it 'returns missing if no descendant matches', ->
      $element = affix('.element')
      $child = $element.affix('.child')
      $grandChild = $child.affix('.grand-child')
      result = up.query.descendant($element[0], '.match')
      expect(result).toBeMissing()

    it 'does not return the root itself, even if it matches', ->
      $element = affix('.element.match')
      result = up.query.descendant($element[0], '.match')
      expect(result).toBeMissing()

    it 'does not return an ancestor of the root, even if it matches', ->
      $parent = affix('.parent.match')
      $element = $parent.affix('.element')
      result = up.query.descendant($element[0], '.match')
      expect(result).toBeMissing()

    it 'supports the custom :has() selector', ->
      $element = affix('.element')
      $childWithSelectorWithChild = $element.affix('.selector')
      $childWithSelectorWithChild.affix('.match')
      $childWithSelectorWithoutChild = $element.affix('.selector')
      $childWithoutSelectorWithChild = $element.affix('.other-selector')
      $childWithoutSelectorWithChild.affix('.match')
      $childWithoutSelectorWithoutChild = affix('.other-selector')

      result = up.query.descendant($element[0], '.selector:has(.match)')
      expect(result).toEqual [$childWithSelectorWithChild[0]]

    it 'supports the custom :has() selector when a previous sibling only matches its own selector, but not the descendant selector (bugfix)', ->
      $element = affix('.element')
      $childWithSelectorWithoutChild = $element.affix('.selector')
      $childWithSelectorWithChild = $element.affix('.selector')
      $childWithSelectorWithChild.affix('.match')

      result = up.query.descendant($element[0], '.selector:has(.match)')
      expect(result).toEqual [$childWithSelectorWithChild[0]]


  describe 'up.query.subtree()', ->

    it 'returns all descendants of the given root matching the given selector', ->
      $element = affix('.element')
      $matchingChild = $element.affix('.child.match')
      $matchingGrandChild = $matchingChild.affix('.grand-child.match')
      $otherChild = $element.affix('.child')
      $otherGrandChild = $otherChild.affix('.grand-child')
      results = up.query.subtree($element[0], '.match')
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

  describe 'up.query.closest()', ->

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
      $element = affix('.element')
      $child = $element.affix('.match')

      result = up.query.closest($element[0], '.match')
      expect(result).toBeMissing()

    it 'returns missing if neither root nor ancestor matches', ->
      $mother = affix('.no-match')
      $element = $mother.affix('.no-match')

      result = up.query.closest($element[0], '.match')
      expect(result).toBeMissing()

  describe 'up.query.ancestor()', ->

    it 'returns the closest ancestor of the given root that matches the given selector', ->
      $grandGrandMother = affix('.match')
      $grandMother = affix('.match')
      $mother = $grandMother.affix('.no-match')
      $element = $mother.affix('.element')

      result = up.query.ancestor($element[0], '.match')
      expect(result).toBe($grandMother[0])

    it 'does not return the given root, even if it matches', ->
      $element = affix('.match')

      result = up.query.ancestor($element[0], '.match')
      expect(result).toBeMissing()

    it 'does not return descendants of the root, even if they match', ->
      $element = affix('.element')
      $child = $element.affix('.match')

      result = up.query.ancestor($element[0], '.match')
      expect(result).toBeMissing()

    it 'returns missing if no ancestor matches', ->
      $mother = affix('.no-match')
      $element = $mother.affix('.no-match')

      result = up.query.ancestor($element[0], '.match')
      expect(result).toBeMissing()

  describe 'up.query.triggerCustom()', ->

    it 'triggers an event with the given name on the given element', ->
      element = affix('.element')[0]
      callback = jasmine.createSpy('event handler')
      element.addEventListener('custom:name', callback)
      expect(callback).not.toHaveBeenCalled()
      up.query.triggerCustom(element, 'custom:name')
      expect(callback).toHaveBeenCalled()

    it 'allows to pass custom event properties', ->
      element = affix('.element')[0]
      callback = jasmine.createSpy('event handler')
      element.addEventListener('custom:name', callback)
      up.query.triggerCustom(element, 'custom:name', customProp: 'customValue')
      expect(callback).toHaveBeenCalled()
      expect(callback.calls.mostRecent().args[0].customProp).toEqual('customValue')

    it 'triggers an event that bubbles', ->
      $parent = affix('.parent')
      $element = $parent.affix('.element')
      callback = jasmine.createSpy('event handler')
      $parent[0].addEventListener('custom:name', callback)
      up.query.triggerCustom($element[0], 'custom:name')
      expect(callback).toHaveBeenCalled()

    it 'triggers an event that can be stopped from propagating', ->
      $parent = affix('.parent')
      $element = $parent.affix('.element')
      callback = jasmine.createSpy('event handler')
      $parent[0].addEventListener('custom:name', callback)
      $element[0].addEventListener('custom:name', (event) -> event.stopPropagation())
      up.query.triggerCustom($element[0], 'custom:name')
      expect(callback).not.toHaveBeenCalled()

  describe 'up.query.remove()', ->

    it 'removes the given element from the DOM', ->
      element = affix('.element')[0]
      expect(element).toBeAttached()
      up.query.remove(element)
      expect(element).toBeDetached()

  describe 'up.query.toggle()', ->

    it 'hides the given element if the second argument is false', ->
      element = affix('.element')[0]
      expect(element).toBeVisible()
      up.query.toggle(element, false)
      expect(element).toBeHidden()

    it 'shows the given element if the second argument is true', ->
      element = affix('.element')[0]
      element.style.display = 'none'
      expect(element).toBeHidden()
      up.query.toggle(element, true)
      expect(element).toBeVisible()

