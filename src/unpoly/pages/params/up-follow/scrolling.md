@partial up-follow/scrolling

@param [up-scroll='auto']
  How to scroll after the new fragment was rendered.

  See [Scrolling](/learn/scrolling) for a list of allowed values.

@param [up-fail-scroll='auto']
  How to scroll after the new fragment was rendered from a failed response.

  See [Rendering failed responses differently](/learn/failed-responses#fail-options).

@param [up-scroll-map]
  A [relaxed JSON](/api/relaxed-json) object mapping fragment selectors to a [scrolling option](/learn/scrolling).

  When a scroll map is given, the [`[up-scroll]`](#up-scroll) attribute is ignored.
  
  See [Scrolling multiple viewports](/learn/scrolling#multiple-viewports) for examples.

@param [up-scroll-behavior='instant']
  Whether to [animate the scroll motion](/learn/scroll-tuning#animating-the-scroll-motion).

@param [up-reveal-snap]
  When to [snap to the top](/learn/scroll-tuning#snapping-to-the-screen-edge)
  when scrolling to an element near the top edge of the viewport's scroll buffer.

@param [up-reveal-top]
  When to [move a revealed element to the top](/learn/scroll-tuning#moving-revealed-elements-to-the-top)
  when scrolling to an element.

@param [up-reveal-padding]
  How much [space to leave to the closest viewport edge](/learn/scroll-tuning#revealing-with-padding)
  when scrolling to an element.

@param [up-reveal-max]
  How many pixel lines of a [tall element to reveal](/learn/scroll-tuning#revealing-large-elements) when scrolling to an element.

@param [up-save-scroll='true']
  Whether to [save scroll positions](/api/up.viewport.saveScroll) before updating the fragment.

  Saved scroll positions can later be restored with [`[up-scroll=restore]`](/learn/scrolling#restore).
