// Serializes console.* arguments to plain strings so they can cross the
// window.__postToTerminal transport (which carries JSON-simple values only).
//
// Mirrors Unpoly's format:false logger: it resolves %-substitution and renders
// complex values (arrays, objects, DOM elements) compactly. Kept dependency-free
// (no `up`, no DOM globals) so it can be unit-tested in Node; the DOM-element
// branch is duck-typed and simply not exercised when there is no DOM.

const MAX_LENGTH = 200

// Default placeholder is '%s' (direct/joined args render unquoted, like the
// browser console); only an explicit '%o'/'%O' quotes strings.
export function serializeArg(value, placeholder = '%s') {
  if (placeholder === '%c') return '' // a CSS style directive has no textual value

  let string

  if (typeof value === 'string') {
    string = value
    // %o/%O quote strings (like the browser console); %s does not.
    if (placeholder === '%o' || placeholder === '%O') string = JSON.stringify(string)
  } else if (value === undefined) {
    string = 'undefined'
  } else if (value === null) {
    string = 'null'
  } else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    string = String(value)
  } else if (typeof value === 'function') {
    string = value.name ? `function ${value.name}` : 'function'
  } else if (isElement(value)) {
    string = openingTag(value)
  } else if (Array.isArray(value)) {
    string = `[${value.map((item) => serializeArg(item)).join(', ')}]`
  } else {
    try {
      string = JSON.stringify(value)
    } catch (error) {
      string = (error && error.name === 'TypeError') ? '(circular structure)' : String(value)
    }
    if (string === undefined) string = String(value) // e.g. JSON.stringify(Symbol)
  }

  return truncate(string)
}

const SUBSTITUTION_SOURCE = '%[sdifoOc]'
const SUBSTITUTION = new RegExp(SUBSTITUTION_SOURCE, 'g')
// Separate non-global copy: a global regex's .test() is stateful (advances lastIndex).
const HAS_SUBSTITUTION = new RegExp(SUBSTITUTION_SOURCE)

export function formatLogArgs(args) {
  if (args.length === 0) return ''
  let [first, ...rest] = args
  if (typeof first === 'string' && HAS_SUBSTITUTION.test(first)) {
    let out = first.replace(SUBSTITUTION, (placeholder) =>
      rest.length ? serializeArg(rest.shift(), placeholder) : placeholder
    )
    for (let extra of rest) out += ' ' + serializeArg(extra)
    return out
  }
  return args.map((arg) => serializeArg(arg)).join(' ')
}

function truncate(string, max = MAX_LENGTH) {
  if (typeof string === 'string' && string.length > max) {
    return string.slice(0, max) + '…'
  }
  return string
}

function isElement(value) {
  return typeof value === 'object' && value !== null &&
    value.nodeType === 1 && typeof value.cloneNode === 'function'
}

function openingTag(element) {
  try {
    let html = element.cloneNode(false).outerHTML
    let match = html.match(/<[^>]*>/)
    return match ? match[0] : String(element)
  } catch {
    return String(element)
  }
}
