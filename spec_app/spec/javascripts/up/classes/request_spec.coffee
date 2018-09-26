describe 'up.Request', ->

  describe '#url', ->

    it 'returns the given URL', ->
      throw "needs test"

    it 'does not include a hash anchor', ->
      throw "needs test"

    it "includes { params } for HTTP methods that don't allow a payload", ->
      throw "needs test"

    it 'excludes { params } for HTTP methods that allow a payload', ->
      throw "needs test"

  describe '#hash', ->

    it 'returns the hash anchor from the given URL', ->
      throw "needs test"

    it 'returns undefined if the URL had no hash anchor', ->
      throw "needs test"

  describe '#params', ->

    it 'returns the given URL', ->
      throw "needs test"

    it "returns undefined for HTTP methods that don't allow a payload", ->
      throw "needs test"

    it 'returns the merged { params } and params from the URL for HTTP methods that allow a payload', ->
      throw "needs test"

