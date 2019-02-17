#= require ../../layer

class up.layer.Base

  constructor: ->
    @url = null
    @title = null
    @history = null

  open: (element, options) ->
    throw "implement me"


class up.layer.Root extends up.layer.Base

  throw "macht das überhaupt sinn die root als layer zu führen?"

  constructor: ->
    super()
    @element = document.documentElement
    @history = true


class up.layer.Modal extends up.layer.Base


class up.layer.Window extends up.layer.Modal


#  <div class="up-layer">
#    <div class="up-layer-backdrop">
#    <div class="up-layer-viewport">
#      <div class="up-window">
#        <div class="up-window-content">
#          <!-- the matching element will be placed here -->
#        </div>
#        <div class="up-window-close" up-close>X</div>
#      </div>
#    </div>
#  </div>

#  <div class="up-layer">
#    <div class="up-layer-backdrop">
#    <div class="up-layer-viewport">
#      <div class="up-window">
#        <div class="up-window-content">
#          <!-- the matching element will be placed here -->
#        </div>
#        <div class="up-window-close" up-close>X</div>
#      </div>
#    </div>
#  </div>


up.layer.dialog 'window', up.layer.Window


class up.layer.Drawer extends up.layer.Modal

up.layer.dialog 'drawer', up.layer.Drawer


class up.layer.Fullscreen extends up.layer.Modal

up.layer.dialog 'fullscreen', up.layer.Fullscreen


class up.layer.Popover extends up.layer.Base

up.layer.dialog 'popover', up.layer.Popover





