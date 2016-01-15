describe 'up.proxy', ->

  u = up.util

  describe 'Javascript functions', ->

    beforeEach ->
      jasmine.clock().install()
      jasmine.clock().mockDate()

    describe 'up.proxy.ajax', ->

      it 'caches server responses for 5 minutes', ->
        responses = []

        # Send the same request for the same path, 3 minutes apart
        up.proxy.ajax(url: '/foo').then (data) -> responses.push(data)
        jasmine.clock().tick(3 * 60 * 1000)
        up.proxy.ajax(url: '/foo').then (data) -> responses.push(data)

        # See that only a single network request was triggered
        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(responses).toEqual([])

        @respondWith('foo')

        # See that both requests have been fulfilled by the same response
        expect(responses).toEqual(['foo', 'foo'])

        # Send another request after another 3 minutes
        # The clock is now a total of 6 minutes after the first request,
        # exceeding the cache's retention time of 5 minutes.
        jasmine.clock().tick(3 * 60 * 1000)
        up.proxy.ajax(url: '/foo').then (data) -> responses.push(data)

        # See that we have triggered a second request
        expect(jasmine.Ajax.requests.count()).toEqual(2)

        @respondWith('bar')

        expect(responses).toEqual(['foo', 'foo', 'bar'])

      it "doesn't reuse responses when asked for the same path, but different selectors", ->
        up.proxy.ajax(url: '/path', selector: '.a')
        up.proxy.ajax(url: '/path', selector: '.b')
        expect(jasmine.Ajax.requests.count()).toEqual(2)

      it "reuses a response for an 'html' selector when asked for the same path and any other selector", ->
        up.proxy.ajax(url: '/path', selector: 'html')
        up.proxy.ajax(url: '/path', selector: 'body')
        up.proxy.ajax(url: '/path', selector: 'p')
        up.proxy.ajax(url: '/path', selector: '.klass')
        expect(jasmine.Ajax.requests.count()).toEqual(1)

      it "reuses a response for a 'body' selector when asked for the same path and any other selector other than 'html'", ->
        up.proxy.ajax(url: '/path', selector: 'body')
        up.proxy.ajax(url: '/path', selector: 'p')
        up.proxy.ajax(url: '/path', selector: '.klass')
        expect(jasmine.Ajax.requests.count()).toEqual(1)

      it "doesn't reuse a response for a 'body' selector when asked for the same path but an 'html' selector", ->
        up.proxy.ajax(url: '/path', selector: 'body')
        up.proxy.ajax(url: '/path', selector: 'html')
        expect(jasmine.Ajax.requests.count()).toEqual(2)

      it "doesn't reuse responses for different paths", ->
        up.proxy.ajax(url: '/foo')
        up.proxy.ajax(url: '/bar')
        expect(jasmine.Ajax.requests.count()).toEqual(2)

      u.each ['GET', 'HEAD', 'OPTIONS'], (method) ->

        it "caches #{method} requests", ->
          u.times 2, -> up.proxy.ajax(url: '/foo', method: method)
          expect(jasmine.Ajax.requests.count()).toEqual(1)

        it "does not cache #{method} requests with cache: false option", ->
          u.times 2, -> up.proxy.ajax(url: '/foo', method: method, cache: false)
          expect(jasmine.Ajax.requests.count()).toEqual(2)

      u.each ['POST', 'PUT', 'DELETE'], (method) ->

        it "does not cache #{method} requests", ->
          u.times 2, -> up.proxy.ajax(url: '/foo', method: method)
          expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "caches #{method} requests with cache: true option", ->
          u.times 2, -> up.proxy.ajax(url: '/foo', method: method, cache: true)
          expect(jasmine.Ajax.requests.count()).toEqual(1)

      it 'does not cache responses with a non-200 status code', ->
        # Send the same request for the same path, 3 minutes apart
        up.proxy.ajax(url: '/foo')

        @respondWith
          status: 500
          contentType: 'text/html'
          responseText: 'foo'

        up.proxy.ajax(url: '/foo')

        expect(jasmine.Ajax.requests.count()).toEqual(2)

      describe 'with config.maxRequests set', ->

        beforeEach ->
          up.proxy.config.maxRequests = 1

        it 'limits the number of concurrent requests', ->
          responses = []
          up.proxy.ajax(url: '/foo').then (html) -> responses.push(html)
          up.proxy.ajax(url: '/bar').then (html) -> responses.push(html)
          expect(jasmine.Ajax.requests.count()).toEqual(1) # only one request was made
          @respondWith('first response', request: jasmine.Ajax.requests.at(0))
          expect(responses).toEqual ['first response']
          expect(jasmine.Ajax.requests.count()).toEqual(2) # a second request was made
          @respondWith('second response', request: jasmine.Ajax.requests.at(1))
          expect(responses).toEqual ['first response', 'second response']

#        it 'considers preloading links for the request limit', ->
#          up.proxy.ajax(url: '/foo', preload: true)
#          up.proxy.ajax(url: '/bar')
#          expect(jasmine.Ajax.requests.count()).toEqual(1)

      describe 'events', ->
        
        beforeEach ->
          up.proxy.config.busyDelay = 0
          @events = []
          u.each ['up:proxy:load', 'up:proxy:received', 'up:proxy:busy', 'up:proxy:idle'], (eventName) =>
            up.on eventName, =>
              @events.push eventName

        it 'emits an up:proxy:busy event once the proxy started loading, and up:proxy:idle if it is done loading', ->
  
          up.proxy.ajax(url: '/foo')
  
          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy'
          ])
  
          up.proxy.ajax(url: '/bar')
  
          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy',
            'up:proxy:load'
          ])
  
          jasmine.Ajax.requests.at(0).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'foo'
  
          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy',
            'up:proxy:load',
            'up:proxy:received'
          ])
  
          jasmine.Ajax.requests.at(1).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'bar'
  
          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy',
            'up:proxy:load',
            'up:proxy:received',
            'up:proxy:received',
            'up:proxy:idle'
          ])
  
        it 'does not emit an up:proxy:busy event if preloading', ->

          # A request for preloading preloading purposes
          # doesn't make us busy.
          up.proxy.ajax(url: '/foo', preload: true)
          expect(@events).toEqual([
            'up:proxy:load'
          ])
          expect(up.proxy.busy()).toBe(false)

          # The same request with preloading does make us busy.
          up.proxy.ajax(url: '/foo')
          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy'
          ])
          expect(up.proxy.busy()).toBe(true)

          # The response resolves both promises and makes
          # the proxy idle again.
          jasmine.Ajax.requests.at(0).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'foo'
          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy',
            'up:proxy:received',
            'up:proxy:idle'
          ])
          expect(up.proxy.busy()).toBe(false)

        it 'can delay the up:proxy:busy event to prevent flickering of spinners', ->
          up.proxy.config.busyDelay = 100

          up.proxy.ajax(url: '/foo')
          expect(@events).toEqual([
            'up:proxy:load'
          ])

          jasmine.clock().tick(50)
          expect(@events).toEqual([
            'up:proxy:load'
          ])

          jasmine.clock().tick(50)
          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy'
          ])

          jasmine.Ajax.requests.at(0).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'foo'

          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy',
            'up:proxy:received',
            'up:proxy:idle'
          ])

        it 'does not emit up:proxy:idle if a delayed up:proxy:busy was never emitted due to a fast response', ->
          up.proxy.config.busyDelay = 100

          up.proxy.ajax(url: '/foo')
          expect(@events).toEqual([
            'up:proxy:load'
          ])

          jasmine.clock().tick(50)

          jasmine.Ajax.requests.at(0).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'foo'

          jasmine.clock().tick(100)

          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:received'
          ])

        it 'emits up:proxy:idle if a request returned but failed', ->

          up.proxy.ajax(url: '/foo')

          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy'
          ])

          jasmine.Ajax.requests.at(0).respondWith
            status: 500
            contentType: 'text/html'
            responseText: 'something went wrong'

          expect(@events).toEqual([
            'up:proxy:load',
            'up:proxy:busy',
            'up:proxy:received',
            'up:proxy:idle'
          ])


    describe 'up.proxy.preload', ->

      if up.browser.canPushState()

        it "loads and caches the given link's destination", ->
          $link = affix('a[href="/path"]')
          up.proxy.preload($link)
          expect(u.isPromise(up.proxy.get(url: '/path'))).toBe(true)

        it "does not load a link whose method has side-effects", ->
          $link = affix('a[href="/path"][data-method="post"]')
          up.proxy.preload($link)
          expect(up.proxy.get(url: '/path')).toBeUndefined()

      else

        it "does nothing", ->
          $link = affix('a[href="/path"]')
          up.proxy.preload($link)
          expect(jasmine.Ajax.requests.count()).toBe(0)

    describe 'up.proxy.get', ->

      it 'should have tests'

    describe 'up.proxy.set', ->

      it 'should have tests'

    describe 'up.proxy.alias', ->

      it 'uses an existing cache entry for another request (used in case of redirects)'

    describe 'up.proxy.clear', ->

      it 'removes all cache entries'

  describe 'unobtrusive behavior', ->

    describe '[up-preload]', ->

      it 'preloads the link destination on mouseover, after a delay'

      it 'triggers a separate AJAX request with a short cache expiry when hovered multiple times', (done) ->
        up.proxy.config.cacheExpiry = 10
        up.proxy.config.preloadDelay = 0
        spyOn(up, 'follow')
        $element = affix('a[href="/foo"][up-preload]')
        Trigger.mouseover($element)
        @setTimer 1, =>
          expect(up.follow.calls.count()).toBe(1)
          @setTimer 16, =>
            Trigger.mouseover($element)
            @setTimer 1, =>
              expect(up.follow.calls.count()).toBe(2)
              done()
