describe 'up.magic', ->
  
  describe 'up.on', ->
    
    it 'registers a delagating event listener to the document body', ->
      
      affix('.container .child')
      observeClass = jasmine.createSpy('observeClass')
      up.on 'click', '.child', (event, $element) ->
        observeClass($element.attr('class'))
#      
      $('.container').click()
      $('.child').click()
#
      expect(observeClass).not.toHaveBeenCalledWith('container')
      expect(observeClass).toHaveBeenCalledWith('child')           
    