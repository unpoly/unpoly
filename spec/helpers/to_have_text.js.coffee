u = up.util
$ = jQuery

normalizeText = (text) ->
  # Normalize all whitespace characters to spaces
  text = text.replace(/\s+/g, ' ')
  # Remove leading and trailing whitespace
  text = text.trim()
  return text

compare = (container, expectedText, visibleOnly = false) ->
  if container instanceof up.Layer
    element = container.getContentElement()
  else
    element = up.element.get(container)

  if visibleOnly
    # https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText
    actualText = element?.innerText
  else
    actualText = element?.textContent

  if actualText
    actualText = normalizeText(actualText)

  result = {}
  result.pass = !!element

  if u.isString(expectedText)
    expectedText = normalizeText(expectedText)
    result.pass &&= (actualText == expectedText)
  else if u.isRegExp(expectedText)
    result.pass &&= (expectedText.test(actualText))

  if result.pass
    result.message = u.sprintf('Expected element %o to not have text "%s"', element, actualText)
  else
    result.message = u.sprintf('Expected element %o to have text "%s", but its text was "%s"', element, expectedText, actualText)

  return result

beforeEach ->
  jasmine.addMatchers
    toHaveText: (util, customEqualityTesters) ->
      compare: (container, expectedText) ->
        return compare(container, expectedText, false)

    toHaveVisibleText: (util, customEqualityTesters) ->
      compare: (container, expectedText) ->
        return compare(container, expectedText, true)

