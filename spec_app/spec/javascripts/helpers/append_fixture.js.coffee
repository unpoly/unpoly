u = up.util
$ = jQuery

beforeEach ->
  @appendFixture = (html) ->
    @$fixtureContainer ||= $('<div class="fixture-container"></div>').appendTo(document.body)
    $(html).appendTo(@$fixtureContainer)

afterEach ->
  $('.fixture-container').remove()
  @$fixtureContainer = undefined
