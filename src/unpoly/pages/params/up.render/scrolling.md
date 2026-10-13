@partial up.render/scrolling

@param {boolean|string|number|Element|Function} [options.scroll]
  How to scroll after the new fragment was rendered.

  See [scrolling](/learn/scrolling) for a list of allowed values.

  When [updating multiple fragments](/learn/targeting-fragments#multiple), this option
  will only be applied to the *first* fragment. To scroll other fragments, use [`{ scrollMap }`](#options.scrollMap).

@param {boolean|string|number|Element|Function} [options.failScroll]
  How to scroll after the new fragment was rendered from a failed response.

  See [Rendering failed responses differently](/learn/failed-responses#fail-options).

@param {Object} [options.scrollMap]
  An object mapping fragment selectors to a [scrolling option](/learn/scrolling).

  When a scroll map is given, the [`{ scroll }`](#options.scroll) option is ignored.

  See [Scrolling multiple viewports](/learn/scrolling#multiple-viewports) for examples.


@param {string} [options.scrollBehavior='instant']
  Whether to [animate the scroll motion](/learn/scroll-tuning#animating-the-scroll-motion).

@param {number} [options.revealSnap]
  When to [snap to the top](/learn/scroll-tuning#snapping-to-the-screen-edge)
  when scrolling to an element near the top edge of the viewport's scroll buffer.

@param {boolean} [options.revealTop]
  When to [move a revealed element to the top](/learn/scroll-tuning#moving-revealed-elements-to-the-top)
  when scrolling to an element.

@param {number} [options.revealPadding]
  How much [space to leave to the closest viewport edge](/learn/scroll-tuning#revealing-with-padding)
  when scrolling to an element.

@param {number|Function} [options.revealMax]
  How many pixel lines of a [tall element to reveal](/learn/scroll-tuning#revealing-large-elements) when scrolling to an element.

@param {boolean} [options.saveScroll=true]
  Whether to [save scroll positions](/api/up.viewport.saveScroll) before updating the fragment.

  Saved scroll positions can later be restored with [`{ scroll: 'restore' }`](/learn/scrolling#restore).
