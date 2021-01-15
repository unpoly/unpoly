#= require jquery
#= require helpers/jquery_no_conflict
#= require jquery_ujs
#= require es6-promise.auto
#= require unpoly
#= require unpoly-bootstrap4

#up.on 'up:fragment:loaded', (event) ->
#  if event.response.text.indexOf('Exception caught') >= 0
#    event.preventDefault()
#    event.request.loadPage()
