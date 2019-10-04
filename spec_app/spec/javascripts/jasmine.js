require('jasmine-core/lib/jasmine-core/jasmine')
require('jasmine-core/lib/jasmine-core/jasmine-html')
require('jasmine-core/lib/jasmine-core/boot')

require('jasmine-core/lib/jasmine-core/jasmine.css')

require('jasmine-ajax')
require('./helpers/knife.js')

let jQuery = require('jquery')
window.jQuery = jQuery
