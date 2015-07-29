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

        jasmine.Ajax.requests.mostRecent().respondWith
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

        jasmine.Ajax.requests.mostRecent().respondWith
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

    describe 'up.proxy.preload', ->

      it 'should have tests'

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
