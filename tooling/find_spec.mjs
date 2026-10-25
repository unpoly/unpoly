// Finds specs by a phrase in their describe()/it() titles, and turns a file or line into
// --spec filters. See bin/find-spec and `bin/test --file`.
//
// Everything works on the whole suite, parsed once with acorn: a spec's full name depends
// on more than the file it is written in. We start from spec/specs.js and follow every
// require() into the group it sits in, so extracted files get the path of the position
// they are required from (see spec/helpers/extend_describe.js). Groups are found wherever
// they are called — inside an `if`, a loop or a callback — and a local function that
// declares specs is expanded at every call, because that is where Jasmine registers them.
//
// The core is PURE: callers pass { path: text } for spec/specs.js and the spec files, with
// paths relative to the project root. readSources() is the one helper that touches disk.

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import * as acorn from 'acorn'

const ENTRY = 'spec/specs.js'
const GROUP = /^([fx]?describe|describeFallback)$/
const SPEC = /^[fx]?it$/

// Every block in the suite, in the order Jasmine registers it:
//   { file, line, endLine, kind, title, titles, isGroup, condition, chain, topInFile }
// `line` and `endLine` are where its describe()/it() call starts and ends.
// `titles` is the real path from the root of the suite, ending in the block's own title.
// `condition` is the source of the `if` tests around it, or null. `chain` is the
// extendDescribe() titles around it in its own file, and `topInFile` says that no group of
// its own file encloses it.
//
// Also returns the files that are loaded, and the requires that point at no file.
export function parseSuite(sources) {
  const entries = []
  const loaded = new Set()
  const missing = []

  function visitFile(file, ctx) {
    loaded.add(file)
    const text = sources[file]
    const ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module', locations: true })
    const source = (node) => text.slice(node.start, node.end)
    const shared = sharedFunctions(ast)
    const expanding = new Set()

    function visit(node, ctx) {
      if (!isNode(node)) return

      if (node.type === 'IfStatement') {
        visit(node.consequent, withCondition(ctx, source(node.test)))
        visit(node.alternate, withCondition(ctx, `!(${source(node.test)})`))
        return
      }

      // A shared function's specs register where it is called, not where it is declared.
      if (shared.has(sharedName(node))) return

      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        const name = node.callee.name

        if (GROUP.test(name) || SPEC.test(name) || name === 'extendDescribe') {
          const title = titleOf(node, source)
          const extend = name === 'extendDescribe'
          const titles = extend ? ctx.titles : [...ctx.titles, title]
          entries.push({
            file, line: node.loc.start.line, endLine: node.loc.end.line,
            kind: name, title, titles, isGroup: GROUP.test(name),
            condition: ctx.condition, chain: ctx.chain, topInFile: !ctx.inFileGroup,
          })
          const body = node.arguments.find((arg) => /Function/.test(arg.type))
          if (body && !SPEC.test(name)) {
            visit(body.body, extend
              ? { ...ctx, chain: [...ctx.chain, title] }
              : { ...ctx, titles, inFileGroup: true })
          }
          return
        }

        if (name === 'require') {
          const required = requiredSpec(file, node)
          if (required && required in sources) visitFile(required, { ...ctx, chain: [], inFileGroup: false })
          else if (required) missing.push({ file, line: node.loc.start.line, required })
          return
        }

        if (shared.has(name) && !expanding.has(name)) {
          expanding.add(name)
          visit(shared.get(name).body, ctx)
          expanding.delete(name)
        }
      }

      eachChild(node, (child) => visit(child, ctx))
    }

    visit(ast, ctx)
  }

  visitFile(ENTRY, { titles: [], chain: [], condition: null, inFileGroup: false })
  loaded.delete(ENTRY)
  return { entries, loaded, missing }
}

const isNode = (value) => typeof value?.type === 'string'

function eachChild(node, fn) {
  for (const key in node) {
    const child = node[key]
    if (Array.isArray(child)) child.filter(isNode).forEach(fn)
    else if (isNode(child)) fn(child)
  }
}

// Local functions that declare specs, by name: `function sharedExamples() { it(...) }` or
// `const sharedExamples = () => { ... }`.
function sharedFunctions(ast) {
  const found = new Map()
  const visit = (node) => {
    const name = sharedName(node)
    const fn = node.type === 'VariableDeclarator' ? node.init : node
    if (name && declaresSpecs(fn.body)) found.set(name, fn)
    eachChild(node, visit)
  }
  visit(ast)
  return found
}

function sharedName(node) {
  if (node.type === 'FunctionDeclaration') return node.id?.name
  if (node.type === 'VariableDeclarator' && /FunctionExpression$/.test(node.init?.type)) return node.id.name
}

function declaresSpecs(node) {
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' &&
      (GROUP.test(node.callee.name) || SPEC.test(node.callee.name))) return true
  let found = false
  eachChild(node, (child) => { found ||= declaresSpecs(child) })
  return found
}

// The title as Jasmine will see it. A template literal keeps its ${…} source, since the
// value is only known at runtime. describeFallback() names its group like the helper does
// (spec/helpers/browser_switches.js).
function titleOf(call, source) {
  const [first] = call.arguments
  if (call.callee.name === 'describeFallback') {
    const caps = first.type === 'ArrayExpression' ? first.elements : [first]
    return `(in a browser without ${caps.map((cap) => cap.value ?? source(cap)).join(', ')})`
  }
  if (first?.type === 'Literal') return String(first.value)
  if (first?.type === 'TemplateLiteral') return source(first).slice(1, -1)
  return first ? source(first) : ''
}

// require('./x_spec') or require('./unpoly/x_spec.js'), resolved relative to the requiring
// file. Anything that isn't a spec file (styles, helpers via require.context) is not ours.
function requiredSpec(file, call) {
  const [arg] = call.arguments
  if (arg?.type !== 'Literal' || !/_spec(\.js)?$/.test(arg.value)) return null
  const resolved = path.posix.join(path.posix.dirname(file), arg.value)
  return resolved.endsWith('.js') ? resolved : `${resolved}.js`
}

function withCondition(ctx, test) {
  return { ...ctx, condition: ctx.condition ? `${ctx.condition} && ${test}` : test }
}

// Every block whose own title contains the phrase (never spec code), case-insensitive.
// extendDescribe() titles are documentation, not part of any full name, so they never match.
export function findSpecs(suite, phrase) {
  const needle = phrase.toLowerCase()
  return suite.entries.filter((entry) =>
    entry.kind !== 'extendDescribe' && entry.title.toLowerCase().includes(needle))
}

// The --spec filters that run a file, or just the block declared at `line`, as
// [{ name, condition }]. Returns null when the file declares nothing there — the caller has
// the path and can say so usefully.
//
// A file runs as its outermost blocks. For a module's own file that is the module, which
// includes its extracted files; for an extracted file it is just what the file declares,
// since naming the group it extends would run the whole module. Pointing at an
// extendDescribe() line runs what the file declares, too. A block that is expanded at
// several calls yields one filter per call.
export function specFiltersFor(suite, file, line = null) {
  const own = suite.entries.filter((entry) => entry.file === file)
  const declared = own.filter((entry) => entry.line === line)
  const targets = line === null || declared.some((entry) => entry.kind === 'extendDescribe')
    ? own.filter((entry) => entry.kind !== 'extendDescribe' && entry.topInFile)
    : declared

  if (!targets.length) return null

  const filters = new Map()
  for (const { titles, condition } of targets) {
    const name = staticPrefix(titles).join(' ')
    if (!filters.has(name)) filters.set(name, { name, condition })
  }
  return [...filters.values()]
}

// Splits a --file value into the path and the line it points at (or null). Takes
// `path`, `path:line` and the `path:line-endLine` that bin/find-spec prints; the end of
// a range is ignored, since the start line already names the block.
export function parseLocation(location) {
  const [, file, line] = /^(.*?)(?::(\d+)(?:-\d+)?)?$/.exec(location)
  return { file, line: line ? Number(line) : null }
}

// A title with ${…} can't be matched verbatim, so a filter stops at the last fixed title
// above it. The runner echoes what it derived.
function staticPrefix(titles) {
  const dynamic = titles.findIndex((title) => title.includes('${'))
  return dynamic === -1 ? titles : titles.slice(0, dynamic)
}

// The first real blocks of a file whose extendDescribe() chain does not name the path they
// are actually required into. extendDescribe() titles are documentation only, so nothing
// else would notice a stale one. This also catches a module file required from inside a
// group (empty chain, non-empty path) and an extracted file loaded at the root.
export function staleChains(suite) {
  return suite.entries.filter((entry) => {
    if (entry.kind === 'extendDescribe' || !entry.topInFile) return false
    const parent = entry.titles.slice(0, -1)
    return entry.chain.join('\n') !== parent.join('\n')
  })
}

// One line per match: `file:line-endLine "full describe path"`. The range lets a reader
// open just that block, and --file takes it as it is. The path is space-joined, which
// makes it exactly the full name Jasmine matches, so it can be pasted straight into
// --spec; the quotes mark where it starts and ends. A block that only runs under a
// condition says so after the quotes. Ancestry stays dim and the matched phrase bold, which
// is what separates the levels now that there is no separator.
export function formatMatches(matches, { phrase, color = false } = {}) {
  const paint = color ? ANSI : { path: (s) => s, ancestry: (s) => s, match: (s) => s }

  // Locations are padded to the widest one so every path starts in the same column, which
  // is what makes a long result list scannable. Measured before painting, since the ANSI
  // codes would otherwise count towards the width.
  const locationOf = ({ file, line, endLine }) => `${file}:${line}-${endLine}`
  const width = Math.max(0, ...matches.map((match) => locationOf(match).length))

  return matches.map((match) => {
    const { titles, condition } = match
    const own = titles[titles.length - 1]
    const ancestry = titles.slice(0, -1)
    const location = locationOf(match)
    const at = paint.path(location) + ' '.repeat(width - location.length)
    const above = ancestry.length ? paint.ancestry(ancestry.join(' ') + ' ') : ''
    const only = condition ? paint.ancestry(`  (if ${condition})`) : ''
    return `${at} "${above}${highlight(own, phrase, paint)}"${only}`
  })
}

const ANSI = {
  path: (s) => `\x1b[36m${s}\x1b[0m`,      // cyan: file:line-endLine
  ancestry: (s) => `\x1b[2m${s}\x1b[0m`,   // dim: the groups above the match
  match: (s) => `\x1b[1;33m${s}\x1b[0m`,   // bold yellow: the phrase itself
}

function highlight(title, phrase, paint) {
  const at = title.toLowerCase().indexOf(phrase.toLowerCase())
  if (at === -1) return title
  return title.slice(0, at) + paint.match(title.slice(at, at + phrase.length)) + title.slice(at + phrase.length)
}

// spec/specs.js and every *_spec.js file under spec/unpoly/, keyed by their path from the root.
export function readSources(projectRoot) {
  const sources = { [ENTRY]: readFileSync(path.join(projectRoot, ENTRY), 'utf8') }
  for (const file of specFiles(path.join(projectRoot, 'spec/unpoly'))) {
    sources[path.relative(projectRoot, file).split(path.sep).join('/')] = readFileSync(file, 'utf8')
  }
  return sources
}

function specFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return specFiles(full)
    return entry.name.endsWith('_spec.js') ? [full] : []
  })
}
