const u = up.util
const e = up.element

up.Tether = class Tether {

  constructor(options) {
    up.migrate.handleTetherOptions?.(options)
    this._anchor = options.anchor
    this._align = options.align
    this._position = options.position

    this._alignAxis = (this._position === 'top') || (this._position === 'bottom') ? 'horizontal' : 'vertical'

    this._viewport = up.viewport.get(this._anchor)
    // The document viewport is <html> on some browsers, and we cannot attach children to that.
    this.parent = this._viewport === e.root ? document.body : this._viewport

    // If the offsetParent is within the viewport (or is the viewport) we can simply
    // `position: absolute` and it will move as the viewport scrolls, without JavaScript.
    // If not however, we have no choice but to move it on every scroll event.
    this._syncOnScroll = !this._viewport.contains(this._anchor.offsetParent)
  }

  start(element) {
    this._element = element
    this._element.style.position = 'absolute'
    this._setOffset(0, 0)
    this.sync()
    this._changeEventSubscription('on')
  }

  stop() {
    this._changeEventSubscription('off')
  }

  _changeEventSubscription(fn) {
    let doScheduleSync = this._scheduleSync.bind(this)
    up[fn](window, 'resize', doScheduleSync)
    if (this._syncOnScroll) { up[fn](this._viewport, 'scroll', doScheduleSync) }
  }

  _scheduleSync() {
    clearTimeout(this.syncTimer)
    return this.syncTimer = u.task(this.sync.bind(this))
  }

  isDetached() {
    return !this.parent.isConnected || !this._anchor.isConnected
  }

  sync() {
    const elementBox = this._element.getBoundingClientRect()

    const elementMargin = {
      top:    e.styleNumber(this._element, 'margin-top'),
      right:  e.styleNumber(this._element, 'margin-right'),
      bottom: e.styleNumber(this._element, 'margin-bottom'),
      left:   e.styleNumber(this._element, 'margin-left')
    }

    const anchorBox = this._anchor.getBoundingClientRect()

    let left
    let top

    switch (this._alignAxis) {
      case 'horizontal': { // position is 'top' or 'bottom'
        switch (this._position) {
          case 'top':
            top = anchorBox.top - elementMargin.bottom - elementBox.height
            break
            // element
            // -------
            // margin
            // -------
            // anchor
          case 'bottom':
            top = anchorBox.top + anchorBox.height + elementMargin.top
            break
        }
            // anchor
            // ------
            // margin
            // ------
            // element
        switch (this._align) {
          case 'left':
            // anchored to anchor's left, grows to the right
            left = anchorBox.left + elementMargin.left
            break
            // mg | element
            // ------------
            // anchor
          case 'center':
            // anchored to anchor's horizontal center, grows equally to left/right
            left = anchorBox.left + (0.5 * (anchorBox.width - elementBox.width))
            break
            // e l e m e n t
            // -------------
            //    anchor
          case 'right':
            // anchored to anchor's right, grows to the left
            left = (anchorBox.left + anchorBox.width) - elementBox.width - elementMargin.right
            break
            // element | mg
            // ------------
            //       anchor
        }
        break
      }
      case 'vertical': { // position is 'left' or 'right'
        switch (this._align) {
          case 'top':
            // anchored to the top, grows to the bottom
            top = anchorBox.top + elementMargin.top
            break
            //  margin | anchor
            // --------|
            // element |
          case 'center':
            // anchored to anchor's vertical center, grows equally to left/right
            top = anchorBox.top + (0.5 * (anchorBox.height - elementBox.height))
            break
            //  ele |
            //  men | anchor
            //    t |
          case 'bottom':
            // anchored to the bottom, grows to the top
            top = (anchorBox.top + anchorBox.height) - elementBox.height - elementMargin.bottom
            break
            // element |
            // ------- |
            //  margin | anchor
        }
        switch (this._position) {
          case 'left':
            left = anchorBox.left - elementMargin.right - elementBox.width
            break
            // element | margin | anchor
          case 'right':
            left = anchorBox.left + anchorBox.width + elementMargin.left
            break
          // anchor | margin | element
        }
        break
      }
    }

    if (u.isDefined(left) || u.isDefined(top)) {
      this._moveTo(left, top)
    } else {
      up.fail('Invalid tether constraints: %o', this._describeConstraints())
    }
  }

  _describeConstraints() {
    return { position: this._position, align: this._align }
  }

  _moveTo(targetLeft, targetTop) {
    const elementBox = this._element.getBoundingClientRect()
    this._setOffset(
      (targetLeft - elementBox.left) + this.offsetLeft,
      (targetTop - elementBox.top) + this.offsetTop
    )
  }

  _setOffset(left, top) {
    this.offsetLeft = left
    this.offsetTop = top
    e.setStyle(this._element, { left, top }, 'px')
  }
}
