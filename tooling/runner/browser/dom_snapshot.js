// Runs in the BROWSER (bundled via poster.js). Serializes <body> into the
// { tag, id, classes, attrs, children } tree that dom_outline.mjs renders on the Node
// side. The producer counterpart to that renderer — id/class are pulled out into their
// own fields, so `attrs` excludes them.
//
// We capture <body> itself rather than just #fixtures, because a spec may attach
// elements anywhere (see registerFixture()), Unpoly writes state onto <body> (e.g.
// .up-scrollbar-away), and body-level elements like overlays would otherwise need a
// hand-maintained allowlist that silently rots.
//
// Jasmine's own reporter is the one thing worth excluding: it renders every spec result
// and runs to thousands of nodes, which would bury the actual page state.

const MAX_NODES = 600
const EXCLUDE_SELECTOR = '.jasmine_html-reporter'

export function snapshotDom() {
  let body = document.body
  if (!body) return []

  // <body> itself counts against the budget, like every node we capture.
  let budget = { remaining: MAX_NODES - 1, clipped: false }
  let roots = [nodeToTree(body, budget)]

  if (budget.clipped) {
    roots.push({ text: `… snapshot clipped at ${MAX_NODES} nodes (MAX_NODES in tooling/runner/browser/dom_snapshot.js) …` })
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
    // Excluded subtrees cost no budget, so skip them before checking it.
    if (node.nodeType === 1 && node.matches(EXCLUDE_SELECTOR)) continue

    let isElement = node.nodeType === 1
    let text = node.nodeType === 3 ? node.textContent.trim() : ''
    if (!isElement && !text) continue

    if (budget.remaining <= 0) {
      budget.clipped = true
      break
    }
    budget.remaining--

    children.push(isElement ? nodeToTree(node, budget) : { text })
  }

  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    classes: Array.from(element.classList),
    attrs,
    children,
  }
}
