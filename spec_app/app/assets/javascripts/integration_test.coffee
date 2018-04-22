#= require jquery
#= require jquery_ujs
#= require es6-promise.auto
#= require helpers/knife
#= require unpoly

up.compiler '.compiler', ($element) ->
  console.error('*** Compiler called for %o', $element.get(0))
  -> console.error('*** Destructor called for %o', $element.get(0))
