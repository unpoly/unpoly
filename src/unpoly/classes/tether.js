const u = up.util
const e = up.element

up.Tether = class Tether {

  constructor(options) {
    up.migrate.handleTetherOptions?.(options)
    this.anchor = options.anchor
    this.align = options.align
    this.position = options.position

    this.alignAxis = (this.position === 'top') || (this.position === 'bottom') ? 'horizontal' : 'vertical'

    this.viewport = up.viewport.get(this.anchor)
    // The document viewport is <html> on some browsers, and we cannot attach children to that.
    this.parent = this.viewport === e.root ? document.body : this.viewport

    // If the offsetParent is within the viewport (or is the viewport) we can simply
    // `position: absolute` and it will move as the viewport scrolls, without JavaScript.
    // If not however, we have no choice but to move it on every scroll event.
    this.syncOnScroll = !this.viewport.contains(this.anchor.offsetParent)
  }

  start(element) {
    this.element = element
    this.element.style.position = 'absolute'
    this.setOffset(0, 0)
    this.sync()
    this.changeEventSubscription('on')
  }

  stop() {
    this.changeEventSubscription('off')
  }

  changeEventSubscription(fn) {
    let doScheduleSync = this.scheduleSync.bind(this)
    up[fn](window, 'resize', doScheduleSync)
    if (this.syncOnScroll) { up[fn](this.viewport, 'scroll', doScheduleSync) }
  }

  scheduleSync() {
    clearTimeout(this.syncTimer)
    return this.syncTimer = u.task(this.sync.bind(this))
  }

  isDetached() {
    return !this.parent.isConnected || !this.anchor.isConnected
  }

  sync() {
    const elementBox = this.element.getBoundingClientRect()

    const elementMargin = {
      top:    e.styleNumber(this.element, 'marginTop'),
      right:  e.styleNumber(this.element, 'marginRight'),
      bottom: e.styleNumber(this.element, 'marginBottom'),
      left:   e.styleNumber(this.element, 'marginLeft')
    }

    const anchorBox = this.anchor.getBoundingClientRect()

    let left
    let top

    switch (this.alignAxis) {
      case 'horizontal': { // position is 'top' or 'bottom'
        switch (this.position) {
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
        switch (this.align) {
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
        switch (this.align) {
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
        switch (this.position) {
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
      this.moveTo(left, top)
    } else {
      up.fail('Invalid tether constraints: %o', this.describeConstraints())
    }
  }

  describeConstraints() {
    return { position: this.position, align: this.align }
  }

  moveTo(targetLeft, targetTop) {
    const elementBox = this.element.getBoundingClientRect()
    this.setOffset(
      (targetLeft - elementBox.left) + this.offsetLeft,
      (targetTop - elementBox.top) + this.offsetTop
    )
  }

  setOffset(left, top) {
    this.offsetLeft = left
    this.offsetTop = top
    e.setStyle(this.element, { left, top })
  }
}
