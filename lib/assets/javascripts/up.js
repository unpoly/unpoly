//= require up/module
//= require up/util
//= require up/bus
//= require up/magic
//= require up/past
//= require up/api

up.util.extend(up, up.api);

$(document).on('ready', function() {
  up.bus.emit('app:ready')
});

