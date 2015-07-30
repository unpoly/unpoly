###*
Content slots
=============

It can be useful to mark "slots" in your page layout where you expect
content to appear in the future.

For example, you might have

    <div up-slot class="alerts"></div>

    <script>
      up.awaken('.alerts', function ($element) {
        setInterval(3000, function() { up.reload('.alerts') });
      });
    </script>

Seeing that the `.alerts` container is empty, Up.js will hide it:

    <div class="alerts" up-slot style="display: none"></div>

As soon as you

    <div class="alerts" up-slot>
      Meeting at 11:30 AM
    </div>


TODO: Write some documentation
  
@class up.slot
###
up.slot = (->
  
  u = up.util
  
  hasContent = ($slot) ->
    u.trim($slot.html()) != ''

  check = ($element) ->
    u.findWithSelf($element, '[up-slot]').each ->
      $slot = $(this)
      unless hasContent($slot)
        $slot.hide()

  ###*
  Use this attribute to mark up empty element containers that
  you plan to update with content in the future.

  An element with this attribute is automatically hidden
  if it has no content, and is re-shown if it is updated with
  content.

  This is useful to prevent the element from applying unwanted
  margins to the surrounding page flow.

  @method [up-slot]
  @ujs
  ###
  up.bus.on 'fragment:ready', check
  
)()

