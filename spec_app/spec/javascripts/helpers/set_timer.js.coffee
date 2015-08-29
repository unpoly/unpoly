beforeEach ->
  @setTimer = (millis, fun) ->
    setTimeout(fun, millis)
