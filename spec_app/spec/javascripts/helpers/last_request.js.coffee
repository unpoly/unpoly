beforeEach ->
  @lastRequest = ->
    jasmine.Ajax.requests.mostRecent() or up.util.error('There is no last request')

