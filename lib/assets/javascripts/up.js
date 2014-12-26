//= require up/module
//= require up/util
//= require up/bus
//= require up/magic
//= require up/history
//= require up/navigation
//= require up/api

$(document).on('ready', function() {
  up.bus.emit('app:ready')
});

