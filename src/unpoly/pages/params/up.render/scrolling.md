@partial up.render/scrolling

@param {boolean|string|Element|Function} [options.scroll]
  How to scroll after the new fragment was rendered.

  See [scrolling](/scrolling) for a list of allowed values.

@param {string} [options.scrollBehavior='instant']
  Whether to [animate the scroll motion](/scroll-tuning#animating-the-scroll-motion)
  when [prepending or appending](/targeting-fragments#appending-or-prepending) content.

@param {number} [options.revealSnap]
  When to [snap to the top](/scroll-tuning#snapping-to-the-screen-edge)
  when scrolling to an element near the top edge of the viewport's scroll buffer.

@param {number} [options.revealTop]
  When to [move a revealed element to the top](/scroll-tuning#moving-revealed-elements-to-the-top)
  when scrolling to an element.

@param {string} [options.revealPadding]
  How much [space to leave to the closest viewport edge](/scroll-tuning#revealing-with-padding)
  when scrolling to an element.

@param {string} [options.revealMax]
  How many pixel lines of [high element to reveal](/scroll-tuning#revealing-with-padding) when scrolling to an element.

@param {boolean} [options.saveScroll=true]
  Whether to [save scroll positions](/up.viewport.saveScroll) before updating the fragment.

  Saved scroll positions can later be restored with [`{ scroll: 'restore' }`](/scrolling#restoring-scroll-positions).
