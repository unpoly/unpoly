describe 'up.magic', ->
  
  describe 'up.on', ->
    
    it 'registers a delagating event listener to the document body', ->
      
      affix('.container .child')
      observeClass = jasmine.createSpy()
      up.on 'click', '.child', (event, $element) ->
        observeClass($element.attr('class'))
 
      $('.container').click()
      $('.child').click()
 
      expect(observeClass).not.toHaveBeenCalledWith('container')
      expect(observeClass).toHaveBeenCalledWith('child')           
    
  describe 'up.awaken', ->
    
    it 'applies an event initializer whenever a matching fragment is inserted', ->

      observeClass = jasmine.createSpy()
      up.awaken '.child', ($element) ->
        observeClass($element.attr('class'))

      up.ready(affix('.container .child'))
 
      expect(observeClass).not.toHaveBeenCalledWith('container')
      expect(observeClass).toHaveBeenCalledWith('child')           

    it 'lets allows initializers return a destructor function, which is called when the awakened fragments gets destroyed', ->

      destructor = jasmine.createSpy()
      up.awaken '.child', ($element) ->
        destructor

      up.ready(affix('.container .child'))
      expect(destructor).not.toHaveBeenCalled()
      
      up.destroy('.container')
      expect(destructor).toHaveBeenCalled()
          