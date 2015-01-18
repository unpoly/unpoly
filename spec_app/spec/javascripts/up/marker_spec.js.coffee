describe 'up.marker', ->
  
  describe '[up-marker]', ->
    
    it 'hides empty containers', ->
      $element = affix('.element[up-marker]')
      up.ready($element)
      expect($element).not.toBeVisible()
    
    it 'does not hide empty containers', ->
      $element = affix('.element[up-marker]').text('content')
      up.ready($element)
      expect($element).toBeVisible()
    