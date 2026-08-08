// Runs in the BROWSER (bundled via poster.js). Serializes the fixtures container
// and any open overlays into the { tag, id, classes, attrs, children } tree that
// dom_outline.mjs renders on the Node side. The producer counterpart to that
// renderer — id/class are pulled out into their own fields, so `attrs` excludes them.

const MAX_NODES = 400

export function snapshotDom() {
  let roots = []
  let budget = { count: 0 }

  let fixtures = document.querySelector('#fixtures')
  if (fixtures) roots.push(nodeToTree(fixtures, budget))

  for (let overlay of document.querySelectorAll('up-modal, up-drawer, up-popup, up-cover')) {
    roots.push(nodeToTree(overlay, budget))
  }

  return roots
}

function nodeToTree(element, budget) {
  let attrs = {}
  for (let attr of element.attributes) {
    if (attr.name !== 'id' && attr.name !== 'class') attrs[attr.name] = attr.value
  }

  let children = []
  for (let node of element.childNodes) {
    if (budget.count > MAX_NODES) break
    if (node.nodeType === 1) {
      budget.count++
      children.push(nodeToTree(node, budget))
    } else if (node.nodeType === 3) {
      let text = node.textContent.trim()
      if (text) children.push({ text })
    }
  }

  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    classes: Array.from(element.classList),
    attrs,
    children,
  }
}
