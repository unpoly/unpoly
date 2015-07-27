describe 'up.marker', ->
  
  describe 'unobtrusive behavior', ->
  
    describe '[up-slot]', ->
      
      it 'hides empty containers', ->
        $element = affix('.element[up-slot]')
        up.ready($element)
        expect($element).not.toBeVisible()
      
      it 'does not hide empty containers', ->
        $element = affix('.element[up-slot]').text('content')
        up.ready($element)
        expect($element).toBeVisible()
      