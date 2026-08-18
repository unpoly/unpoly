// Renders a captured DOM tree (see poster.js) as an indented outline using
// CSS-selector notation. Haml inspired the indentation-as-nesting; the token
// syntax is CSS selectors:
//
//   #id.class[attr="value"]      (div implied when anchored by an #id/.class)
//   div[data-key="value"]        (tag kept when nothing else anchors the line)
//   up-modal                     (non-div tags always shown)
//   plain text                   (text nodes)
//
// A DomNode is { tag, id, classes[], attrs{}, children:(DomNode|{text})[] }.

export function renderOutline(nodes) {
  let lines = []
  for (let node of nodes || []) render(node, 0, lines)
  return lines.join('\n')
}

function render(node, depth, lines) {
  if (node.text !== undefined) {
    let text = String(node.text).trim()
    if (text) lines.push(indent(depth) + text)
    return
  }
  lines.push(indent(depth) + selector(node))
  for (let child of node.children || []) render(child, depth + 1, lines)
}

function selector(node) {
  let tag = (node.tag || 'div').toLowerCase()
  let id = node.id ? `#${node.id}` : ''
  let classes = (node.classes || []).map((c) => `.${c}`).join('')
  let attrs = Object.entries(node.attrs || {})
    .filter(([key]) => key !== 'id' && key !== 'class')
    .map(([key, value]) => (value === '' || value == null) ? `[${key}]` : `[${key}="${escapeAttr(value)}"]`)
    .join('')

  // div is implied when an #id/.class anchors the line; otherwise keep the tag
  // so a line never starts with "[".
  let head = (tag === 'div' && (id || classes)) ? '' : tag
  return head + id + classes + attrs
}

function escapeAttr(value) {
  return String(value).replace(/"/g, '\\"')
}

function indent(depth) {
  return '  '.repeat(depth)
}
