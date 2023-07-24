var context1 = require.context('./helpers', true, /(\.js|\.coffee)$/)
context1.keys().forEach(context1)

var context2 = require.context('./unpoly', true, /(\.js|\.coffee)$/)
context2.keys().forEach(context2)

require('./specs.sass')
