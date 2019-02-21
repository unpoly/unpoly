#= require ../../layer
#= require ./record

class up.layer.Base extends up.Record

  fields: ->
    fields = ['flavor']
    fields.conact(u.keys(@constructor.defaultConfig()))

  @defaultConfig: ->
    class: null
    history: true
    maxWidth: null
    width: null
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    openDuration: null
    closeDuration: null
    openEasing: null
    closeEasing: null
    backdropOpenAnimation: 'fade-in'
    backdropCloseAnimation: 'fade-out'
    dismissLabel: '×'
    dismissible: true
    position: null
    template: (layer) ->
      """
      <div class="up-layer" role="dialog">
        <div class="up-layer-backdrop"></div>
        <div class="up-layer-viewport"></div>
        <div class="up-layer-box">
          <div class="up-layer-content"></div>
          <div class="up-layer-close" up-close>#{layer.dismissLabel}</div>
        </div>
      </div>
      """

  throw "iOS doesnt bubble click events on up-layer-viewport"

  open: (parentElement, innerContentElement) ->
    throw "implement me"

  close: ->
    throw "implement me"

  sync: ->
    throw "implement me"

  part: (suffix) ->
    @element.querySelector("up-layer-#{suffix}")

  createElementFromTemplate: (options) ->
    @element = e.createFromHtml(@template)

    @element.classList.add(@class) if @class

    e.setAttrs @element,
      'up-dismissable', @dismissable
      'up-flavor', @flavor
      'up-align', @align
      'up-position', @position

    e.setInlineStyle(maxWidth: maxWidth) if @maxWidth
    e.setInlineStyle(width: width) if @width

    if options.viewport
      @shiftBody()
    else
      e.remove(@part('backdrop'))
      e.remove(@part('viewport'))


class up.layer.Root extends up.layer.Base

  constructor: (options) ->
    super(options)
    @element = document.documentElement
    @history = true

  open: (parent) ->
    throw new Error('Cannot open another root layer')

  close: ->
    throw new Error('Cannot close the root layer')


class up.layer.WithViewport extends up.layer.Base


class up.layer.Dialog extends up.layer.WithViewport

  open: (parentElement, @innerContentElement) ->


    @containerElement = e.affix(parentElement, '.up-layer[role=dialog]')
    @backdropElement = e.affix(@containerElement, '.up-layer-backdrop')
    @viewportElement = e.affix(@containerElement, '.up-layer-viewport')

    @element = e.createFromHtml(@template)
    @contentElement = @element.querySelector('[class$="-content"]')
    @contentElement.appendChild(@innerContentElement)

    @dismissible or e.remove(@part('dismiss'))

    throw "switch to [up-flavor=flavor]?"
    throw "where to set { class }, { position }, { align } ?"

#  <div class="up-layer" role="dialog">
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

#  <div class="up-layer" role="dialog">
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


#  <div class="up-layer" role="dialog" up-position="..." up-align="..." up-flavor="...">
#    <div class="up-layer-backdrop">
#    <div class="up-layer-viewport" onclick>
#      <div class="up-layer-box">
#        <div class="up-layer-content">
#          <!-- the matching element will be placed here -->
#        </div>
#        <div class="up-layer-close" up-close>X</div>
#      </div>
#    </div>
#  </div>





class up.layer.Drawer extends up.layer.WithViewport

  @defaultConfig: ->
    history: false
    position: 'right'


class up.layer.Fullscreen extends up.layer.WithViewport


class up.layer.Popover extends up.layer.Base

  @defaultConfig: ->
    history: false
    position: 'bottom'
    align: 'left'
