describe 'up.form', ->
  
  describe 'Javascript functions', ->
    
    describe 'up.observe', ->

      it 'should have tests'

    describe 'up.submit', ->
      
      if up.browser.canPushState()
      
        beforeEach ->
          jasmine.Ajax.install()
    
          $form = affix('form[action="/path/to"][method="put"][up-target=".response"]')
          $form.append('<input name="field1" value="value1">')
          $form.append('<input name="field2" value="value2">')
    
          affix('.response').text('old-text')
    
          @promise = up.submit($form)
    
          @request = jasmine.Ajax.requests.mostRecent()
          expect(@request.url).toMatch /\/path\/to$/
          expect(@request.method).toBe 'PUT'
          expect(@request.data()).toEqual
            field1: ['value1']
            field2: ['value2']
        
        it 'submits the given form and replaces the target with the response', (done) ->
    
          @request.respondWith
            status: 200
            contentType: 'text/html'
            responseText:
              """
              text-before
    
              <div class="response">
                new-text
              </div>
    
              text-after
              """
    
          @promise.then ->
            expect($('.response')).toHaveText('new-text')
            expect($('body')).not.toHaveText('text-before')
            expect($('body')).not.toHaveText('text-after')
            done()
        
        it 'places the response into the form if the submission returns a 5xx status code', (done) ->
          @request.respondWith
            status: 500
            contentType: 'text/html'
            responseText:
              """
              text-before
    
              <form>
                error-messages
              </form>
    
              text-after
              """
    
          @promise.always ->
            expect($('.response')).toHaveText('old-text')
            expect($('form')).toHaveText('error-messages')
            expect($('body')).not.toHaveText('text-before')
            expect($('body')).not.toHaveText('text-after')
            done()
        
        it 'respects a X-Up-Location header that the server sends in case of a redirect', (done) ->
    
          @request.respondWith
            status: 200
            contentType: 'text/html'
            responseHeaders: { 'X-Up-Location': '/other/path' }
            responseText:
              """
              <div class="response">
                new-text
              </div>
              """
    
          @promise.then ->
            expect(up.browser.url()).toMatch(/\/other\/path$/)
            done()
            
      else
        
        it 'submits the given form', ->
          $form = affix('form[action="/path/to"][method="put"][up-target=".response"]')
          form = $form.get(0)
          spyOn(form, 'submit')
          
          up.submit($form)
          expect(form.submit).toHaveBeenCalled()
          

  describe 'unobtrusive behavior', ->
    
    describe 'form[up-target]', ->

      it 'should have tests'
      
    describe 'input[up-observe]', ->

      it 'should have tests'
      
     