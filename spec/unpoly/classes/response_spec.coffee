describe 'up.Response', ->

  describe '#json', ->

    it 'returns the #text parsed as JSON', ->
      response = new up.Response(text: '{ "foo": "bar" }')
      expect(response.json).toEqual(foo: 'bar')

    it 'throws an error if #text is not a valid JSON string', ->
      response = new up.Response(text: 'foo')
      expect(-> response.json).toThrowError()

    it 'caches the parsed object', ->
      response = new up.Response(text: '{ "foo": "bar" }')
      expect(response.json).toEqual(foo: 'bar')
      response.json.bam = 'baz'
      expect(response.json).toEqual(foo: 'bar', bam: 'baz')
