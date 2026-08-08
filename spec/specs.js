// Detect once whether the terminal harness (bin/test.mjs) is driving us. It
// installs the window.__postToTerminal binding before any page script runs, so
// this is set before the helpers below read specs.drivenByTerminal.
window.specs.drivenByTerminal = !!window.__postToTerminal

var context1 = require.context('./helpers', true, /\.js$/)
context1.keys().forEach(context1)

var context2 = require.context('./unpoly', true, /\.js$/)
context2.keys().forEach(context2)

require('./specs.sass')
