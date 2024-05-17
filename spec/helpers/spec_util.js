const u = up.util
const e = up.element
const $ = jQuery

up.specUtil = (function() {

  /***
   Returns whether the given element has been detached from the DOM
   (or whether it was never attached).

   @function up.util.isDetached
   @internal
   */
  function isDetached(element) {
    element = e.get(element)
    return !element.isConnected
  }

  function isAttached(element) {
    return !isDetached(element)
  }

  function isVisible(element){
    return $(element).is(':visible')
  }

  function isHidden(element) {
    return $(element).is(':hidden')
  }

  function findElementContainingText(selector, text) {
    const elements = document.querySelectorAll(selector)
    return u.find(elements, element => element.innerText.includes(text))
  }

  function promiseTimer(ms) {
    let timeout = undefined
    const promise = new Promise((resolve, reject) => timeout = u.timer(ms, resolve))
    promise.cancel = () => clearTimeout(timeout)
    return promise
  }

  function rootHasReducedWidthFromScrollbar() {
    return up.viewport.rootScrollbarWidth() > 0
  }

  /*-
  Returns the element that controls the `overflow-y` behavior for the
  [document viewport](/up.viewport.root()).

  @function up.specUtil.rootOverflowElement
  @internal
  */
  function rootOverflowElement() {
    const { body } = document
    const html = document.documentElement

    const element = u.find([html, body], wasChosenAsOverflowingElement)
    return element || up.viewport.root
  }

  /*-
  Returns whether the given element was chosen as the overflowing
  element by the developer.

  We have no control whether developers set the property on <body> or
  <html>. The developer also won't know what is going to be the
  [scrolling element](/up.viewport.root) on the user's browser.

  @function wasChosenAsOverflowingElement
  @internal
  */
  function wasChosenAsOverflowingElement(element) {
    const overflowY = e.style(element, 'overflow-y')
    return overflowY === 'auto' || overflowY === 'scroll'
  }

  return {
    isDetached,
    isAttached,
    isVisible,
    isHidden,
    promiseTimer,
    findElementContainingText,
    rootHasReducedWidthFromScrollbar,
    rootOverflowElement,
  }
})()
