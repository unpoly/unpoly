// A deprecated alias has the type of the function that replaces it.
declare module '../unpoly.js' {
  interface Up {
    element: CoreApi['element'] & {
      first: CoreApi['element']['get']
      createFromHtml: CoreApi['element']['createFromHTML']
      remove(element: Element): void
      matches(element: Element, selector: string): boolean
      closest(element: Element, selector: string): Element | null
      replace(oldElement: Element, newElement: Node): void
      all(selector: string): NodeListOf<Element>
      all(parent: ParentNode, selector: string): NodeListOf<Element>
      toggleClass(element: Element, className: string, newPresent?: boolean): void
      toSelector: CoreApi['fragment']['toTarget']
      isAttached(element: Node): boolean
      isDetached(element: Node): boolean
    }
  }
}

up.element.first = function(...args: any[]) {
  up.migrate.deprecated('up.element.first()', 'up.element.get()')
  return (up.element.get as any)(...args)
}

up.element.createFromHtml = function(...args) {
  up.migrate.deprecated('up.element.createFromHtml()', 'up.element.createFromHTML()')
  return up.element.createFromHTML(...args)
}

up.element.remove = function(element) {
  up.migrate.deprecated('up.element.remove()', 'Element#remove()')
  return element.remove()
}

up.element.matches = function(element, selector) {
  up.migrate.deprecated('up.element.matches()', 'Element#matches()')
  return element.matches(selector)
}

up.element.closest = function(element, selector) {
  up.migrate.deprecated('up.element.closest()', 'Element#closest()')
  return element.closest(selector)
}

up.element.replace = function(oldElement, newElement) {
  up.migrate.deprecated('up.element.replace()', 'Element#replaceWith()')
  return oldElement.replaceWith(newElement)
}

// The parameters are any, since TypeScript doesn't type a function expression from overloads.
up.element.all = function(...args: any[]) {
  up.migrate.deprecated('up.element.all()', 'Document#querySelectorAll() or Element#querySelectorAll()')
  const selector = args.pop()
  const root = args[0] || document
  return root.querySelectorAll(selector)
}

up.element.toggleClass = function(element, klass, newPresent) {
  up.migrate.deprecated('up.element.toggleClass()', 'element.classList.toggle()')
  const list = element.classList
  if (newPresent == null) { newPresent = !list.contains(klass) }
  if (newPresent) {
    return list.add(klass)
  } else {
    return list.remove(klass)
  }
}

up.element.toSelector = function(...args) {
  up.migrate.deprecated('up.element.toSelector()', 'up.fragment.toTarget()')
  return up.fragment.toTarget(...args)
}

up.element.isAttached = function(element) {
  up.migrate.deprecated('up.element.isAttached()', 'element.isConnected')
  return document.contains(element)
}

up.element.isDetached = function(element) {
  up.migrate.deprecated('up.element.isDetached()', '!element.isConnected')
  return !up.element.isAttached(element)
}

