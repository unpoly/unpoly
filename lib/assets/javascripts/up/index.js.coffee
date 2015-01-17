#= require up/module
#= require up/util
#= require up/browser
#= require up/bus
#= require up/flow
#= require up/magic
#= require up/history
#= require up/motion
#= require up/link
#= require up/form
#= require up/popup
#= require up/modal
#= require up/tooltip
#= require up/navigation
#= require up/marker

up.bus.emit('framework:ready')
$(document).on 'ready', -> up.bus.emit('app:ready')
