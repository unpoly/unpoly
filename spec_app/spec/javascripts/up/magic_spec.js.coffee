describe 'up.magic', ->
  
  describe 'Javascript functions', ->
  
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

      it 'parses an up-data attribute as JSON and passes the parsed object as a second argument to the initializer', ->

        observeArgs = jasmine.createSpy()
        up.awaken '.child', ($element, data) ->
          observeArgs($element.attr('class'), data)

        data = { key1: 'value1', key2: 'value2' }

        $tag = affix(".child").attr('up-data', JSON.stringify(data))
        up.ready($tag)

        expect(observeArgs).toHaveBeenCalledWith('child', data)

      it 'passes an empty object as a second argument to the initializer if there is no up-data attribute', ->

        observeArgs = jasmine.createSpy()
        up.awaken '.child', ($element, data) ->
          observeArgs($element.attr('class'), data)

        up.ready(affix(".child"))

        expect(observeArgs).toHaveBeenCalledWith('child', {})


    describe 'up.ready', ->

      it 'should have tests'
      
     