@partial up.element.createFromSelector/all

@section Element
  @param {string} selector
    The CSS selector from which to create an element.
  
  @param {Object} [attrs]
    An object of attributes to set on the created element.
  
  @param {string} [attrs.text]
    The [text content](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) of the created element.
  
@param {string|Element|List<Node>} [attrs.content]
  The [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) of the created element.

  You may also pass an element or a list of nodes to append.
@param {Object|string} [attrs.style]
  An object of CSS properties that will be set as the inline style
  of the created element. The given object must use kebab-case keys.

  You may also pass a string with semicolon-separated styles.

@return {Element}
  The created element.
