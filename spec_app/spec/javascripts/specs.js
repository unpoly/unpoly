var context = require.context('./helpers', true, /(\.js|\.coffee)$/);
context.keys().forEach(context)

var context = require.context('./up', true, /(\.js|\.coffee)$/);
context.keys().forEach(context)
