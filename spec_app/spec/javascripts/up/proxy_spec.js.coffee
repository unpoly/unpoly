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

        @lastRequest().respondWith
          status: 200
          contentType: 'text/html'
          responseText: 'foo'

        # See that both requests have been fulfilled by the same response
        expect(responses).toEqual(['foo', 'foo'])

        # Send another request after another 3 minutes
        # The clock is now a total of 6 minutes after the first request,
        # exceeding the cache's retention time of 5 minutes.
        jasmine.clock().tick(3 * 60 * 1000)
        up.proxy.ajax(url: '/foo').then (data) -> responses.push(data)

        # See that we have triggered a second request
        expect(jasmine.Ajax.requests.count()).toEqual(2)

        @lastRequest().respondWith
          status: 200
          contentType: 'text/html'
          responseText: 'bar'

        expect(responses).toEqual(['foo', 'foo', 'bar'])

      it "doesn't reuse responses for different paths", ->
        responses = []

        up.proxy.ajax(url: '/foo').then (data) -> responses.push(data)
        up.proxy.ajax(url: '/bar').then (data) -> responses.push(data)

        # See that only a single network request was triggered
        expect(jasmine.Ajax.requests.count()).toEqual(2)

        jasmine.Ajax.requests.at(0).respondWith
          status: 200
          contentType: 'text/html'
          responseText: 'foo'

        jasmine.Ajax.requests.at(1).respondWith
          status: 200
          contentType: 'text/html'
          responseText: 'bar'

        expect(responses).toEqual(['foo', 'bar'])

      u.each ['GET', 'HEAD', 'OPTIONS'], (method) ->

        it "caches #{method} requests", ->
          u.times 2, -> up.proxy.ajax(url: '/foo', method: method)
          expect(jasmine.Ajax.requests.count()).toEqual(1)

        it "does not cache #{method} requests with cache: false option", ->
          u.times 2, -> up.proxy.ajax(url: '/foo', method: method, cache: false)
          expect(jasmine.Ajax.requests.count()).toEqual(2)

      u.each ['POST', 'PUT', 'DELETE', 'DESTROY'], (method) ->

        it "does not cache #{method} requests", ->
          u.times 2, -> up.proxy.ajax(url: '/foo', method: method)
          expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "caches #{method} requests with cache: true option", ->
          u.times 2, -> up.proxy.ajax(url: '/foo', method: method, cache: true)
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          
      describe 'events', ->
        
        beforeEach ->
          up.proxy.defaults(busyDelay: 0)
          @events = []
          u.each ['proxy:load', 'proxy:receive', 'proxy:busy', 'proxy:idle'], (eventName) =>
            up.bus.on eventName, =>
              @events.push eventName

        it 'emits an proxy:busy event once the proxy started loading, and proxy:idle if it is done loading', ->
  
          up.proxy.ajax(url: '/foo')
  
          expect(@events).toEqual([
            'proxy:load',
            'proxy:busy'
          ])
  
          up.proxy.ajax(url: '/bar')
  
          expect(@events).toEqual([
            'proxy:load',
            'proxy:busy',
            'proxy:load'
          ])
  
          jasmine.Ajax.requests.at(0).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'foo'
  
          expect(@events).toEqual([
            'proxy:load',
            'proxy:busy',
            'proxy:load',
            'proxy:receive'
          ])
  
          jasmine.Ajax.requests.at(1).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'bar'
  
          expect(@events).toEqual([
            'proxy:load',
            'proxy:busy',
            'proxy:load',
            'proxy:receive',
            'proxy:receive',
            'proxy:idle'
          ])
  
        it 'does not emit an proxy:busy event if preloading', ->

          # A request for preloading preloading purposes
          # doesn't make us busy.
          up.proxy.ajax(url: '/foo', preload: true)
          expect(@events).toEqual([
            'proxy:load'
          ])
          expect(up.proxy.busy()).toBe(false)

          # The same request with preloading does make us busy.
          up.proxy.ajax(url: '/foo')
          expect(@events).toEqual([
            'proxy:load',
            'proxy:busy'
          ])
          expect(up.proxy.busy()).toBe(true)

          # The response resolves both promises and makes
          # the proxy idle again.
          jasmine.Ajax.requests.at(0).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'foo'
          expect(@events).toEqual([
            'proxy:load',
            'proxy:busy',
            'proxy:receive',
            'proxy:idle'
          ])
          expect(up.proxy.busy()).toBe(false)

        it 'can delay the proxy:busy event to prevent flickering of spinners', ->
          jasmine.clock().install()
          up.proxy.defaults(busyDelay: 100)

          up.proxy.ajax(url: '/foo')
          expect(@events).toEqual([
            'proxy:load'
          ])

          jasmine.clock().tick(50)
          expect(@events).toEqual([
            'proxy:load'
          ])

          jasmine.clock().tick(50)
          expect(@events).toEqual([
            'proxy:load',
            'proxy:busy'
          ])

          jasmine.Ajax.requests.at(0).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'foo'

          expect(@events).toEqual([
            'proxy:load',
            'proxy:busy',
            'proxy:receive',
            'proxy:idle'
          ])

        it 'does not emit proxy:idle if a delayed proxy:busy was never emitted due to a fast response', ->
          jasmine.clock().install()
          up.proxy.defaults(busyDelay: 100)

          up.proxy.ajax(url: '/foo')
          expect(@events).toEqual([
            'proxy:load'
          ])

          jasmine.clock().tick(50)

          jasmine.Ajax.requests.at(0).respondWith
            status: 200
            contentType: 'text/html'
            responseText: 'foo'

          jasmine.clock().tick(100)

          expect(@events).toEqual([
            'proxy:load',
            'proxy:receive'
          ])


    describe 'up.proxy.preload', ->

      it "loads and caches the given link's destination", ->
        $link = affix('a[href="/path"]')
        up.proxy.preload($link)
        expect(u.isPromise(up.proxy.get(url: '/path'))).toBe(true)

      it "does not load a link whose method has side-effects", ->
        $link = affix('a[href="/path"][data-method="post"]')
        up.proxy.preload($link)
        expect(up.proxy.get(url: '/path')).toBeUndefined()

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

      it 'preloads the link destination after a delay'
