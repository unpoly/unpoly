// Keeps class names (up.Request.name === 'Request') through esbuild and Terser, at a small cost.
//
// esbuild loses class names in three ways when it bundles:
//
// - It turns `export class Foo` into `var Foo = class { … }`. The class is anonymous and only
//   infers its name from the variable, which Terser then mangles.
// - It renames a class whose name would shadow a global the bundle uses elsewhere, so
//   `class Error extends window.Error` becomes `class Error3`.
// - When it lowers static members for ES2015, `up.Foo = class Foo { static … }` becomes
//   `(_a = class { … }, _a.x = …, _a)`.
//
// Its `keepNames` option fixes all three with `__name(target, "Foo")` calls, but it emits one for
// every function too: +10 % gzip for unpoly.min.js. Function names don't matter to us (Terser
// mangles them anyway), and most classes can carry their own name. So before Terser runs, we go
// through esbuild's __name() calls:
//
// - A call that names a function goes.
// - A call that names a class whose own name is already the right one goes. Terser keeps the
//   class's name (`keep_classnames`).
// - A call that names an anonymous class goes, and the class gets the name in its source:
//   `class {` becomes `class Foo {`. Unless the class mentions `Foo` itself, which might mean an
//   outer `Foo` that the new name would shadow.
// - Every other call stays, like the one for `class Error3`.
//
// We overwrite removed code with spaces instead of cutting it out, so every line and column of
// the bundle stays where it was. Only the inserted names move code, within their line, and we move
// the source map's mappings on that line with them.

import * as acorn from 'acorn'

// Resolves with the trimmed `js`, and `map` updated to match (or null without a map).
export function dropNeedlessNames(js, map = null) {
  let ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script' })
  let calls = []
  walk(ast, [], (node, ancestors) => {
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === '__name') {
      calls.push({ node, ancestors: [...ancestors] })
    }
  })

  // UTF-16 code units, like acorn's offsets.
  let chars = js.split('')
  let blank = (from, to) => {
    for (let i = from; i < to; i++) {
      if (chars[i] !== '\n') chars[i] = ' '
    }
  }
  let insertions = []
  // Whether we can give `klass` the `name` it should have, by keeping or inserting its own.
  let nameClass = (klass, name) => {
    if (klass?.id) return klass.id.name === name
    if (klass?.type !== 'ClassExpression' || !isPlainName(name) || mentions(klass, name)) return false
    insertions.push({ offset: klass.start + 'class'.length, text: ` ${name}` })
    return true
  }

  for (let { node, ancestors } of calls) {
    let [target, nameLiteral] = node.arguments
    let name = nameLiteral?.value
    let parent = ancestors.at(-1)
    let grandparent = ancestors.at(-2)

    if (target.type === 'FunctionExpression' || target.type === 'ArrowFunctionExpression') {
      // __name(function() { … }, "foo") → function() { … }
      blank(node.start, target.start)
      blank(target.end, node.end)
    } else if (target.type === 'Identifier' && parent.type === 'ExpressionStatement' && declaresFunction(grandparent, target.name)) {
      // function foo() { … } __name(foo, "foo");
      blank(parent.start, parent.end)
    } else if (target.type === 'ThisExpression') {
      // class Foo { static { __name(this, "Foo"); } … }
      let klass = ancestors.findLast((ancestor) => ancestor.type === 'ClassExpression' || ancestor.type === 'ClassDeclaration')
      if (parent.type === 'ExpressionStatement' && grandparent?.type === 'StaticBlock' && grandparent.body.length === 1 && nameClass(klass, name)) {
        blank(grandparent.start, grandparent.end)
      }
    } else if (target.type === 'Identifier' && parent.type === 'SequenceExpression') {
      // (_a = class { … }, __name(_a, "Foo"), _a), from lowering for ES2015. Also blank the
      // comma after the call, which is never last: the sequence ends with `_a`.
      let index = parent.expressions.indexOf(node)
      let klass = parent.expressions.slice(0, index).findLast((expression) =>
        expression.type === 'AssignmentExpression' && expression.left.type === 'Identifier' && expression.left.name === target.name)?.right
      let next = parent.expressions[index + 1]
      if (next && nameClass(klass, name)) {
        blank(node.start, next.start)
      }
    }
  }

  if (map) map = shiftMappings(map, js, insertions)
  for (let { offset, text } of insertions.sort((a, b) => b.offset - a.offset)) {
    chars.splice(offset, 0, text)
  }
  return { js: chars.join(''), map }
}

// Whether a block (or the program) declares `name` as a function right in its body.
function declaresFunction(block, name) {
  return block?.body?.some?.((statement) => statement.type === 'FunctionDeclaration' && statement.id?.name === name)
}

// Whether `name` can be a class's name. Class bodies are strict, so this also rules out `let`,
// `static` and the other names that are only reserved in strict mode.
function isPlainName(name) {
  if (typeof name !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(name)) return false
  try {
    acorn.parse(`(class ${name} {})`, { ecmaVersion: 'latest' })
    return true
  } catch {
    return false
  }
}

// Whether any identifier in `node` is `name`. Property names and strings don't count.
function mentions(node, name) {
  let found = false
  walk(node, [], (child, ancestors) => {
    if (child.type !== 'Identifier' || child.name !== name) return
    let parent = ancestors.at(-1)
    let isPropertyName = !parent.computed && (
      (parent.type === 'MemberExpression' && parent.property === child) ||
      (['Property', 'MethodDefinition', 'PropertyDefinition'].includes(parent.type) && parent.key === child)
    )
    if (!isPropertyName) found = true
  })
  return found
}

// Moves the generated columns of a source map to the right where `insertions` add text, so
// mappings after an inserted name still point at the code they described.
function shiftMappings(map, js, insertions) {
  if (!insertions.length) return map
  let lineStarts = [0]
  for (let i = 0; i < js.length; i++) {
    if (js[i] === '\n') lineStarts.push(i + 1)
  }
  let byLine = new Map()
  for (let { offset, text } of insertions) {
    let line = upperBound(lineStarts, offset) - 1
    let list = byLine.get(line) || []
    list.push({ column: offset - lineStarts[line], length: text.length })
    byLine.set(line, list)
  }

  let parsed = JSON.parse(map)
  let lines = parsed.mappings.split(';')
  for (let [line, lineInsertions] of byLine) {
    if (!lines[line]) continue
    let column = 0
    let shiftedColumn = 0
    lines[line] = lines[line].split(',').map((segment) => {
      // Only a segment's first field is the generated column, as a delta to the previous segment
      // on the same line. The other fields are deltas across lines, and stay as they are.
      let { value, rest } = decodeFirstVLQ(segment)
      column += value
      let shift = lineInsertions.filter((insertion) => insertion.column <= column).reduce((sum, insertion) => sum + insertion.length, 0)
      let delta = column + shift - shiftedColumn
      shiftedColumn = column + shift
      return encodeVLQ(delta) + rest
    }).join(',')
  }
  parsed.mappings = lines.join(';')
  return JSON.stringify(parsed)
}

function upperBound(sorted, value) {
  let low = 0, high = sorted.length
  while (low < high) {
    let middle = (low + high) >> 1
    if (sorted[middle] <= value) low = middle + 1
    else high = middle
  }
  return low
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function decodeFirstVLQ(segment) {
  let result = 0, shift = 0, index = 0, digit
  do {
    digit = BASE64.indexOf(segment[index++])
    result += (digit & 31) << shift
    shift += 5
  } while (digit & 32)
  let value = result & 1 ? -(result >> 1) : result >> 1
  return { value, rest: segment.slice(index) }
}

function encodeVLQ(value) {
  let vlq = value < 0 ? (-value << 1) | 1 : value << 1
  let encoded = ''
  do {
    let digit = vlq & 31
    vlq >>>= 5
    if (vlq > 0) digit |= 32
    encoded += BASE64[digit]
  } while (vlq > 0)
  return encoded
}

function walk(node, ancestors, visit) {
  visit(node, ancestors)
  ancestors.push(node)
  for (let key in node) {
    let child = node[key]
    if (Array.isArray(child)) {
      for (let item of child) {
        if (item && typeof item.type === 'string') walk(item, ancestors, visit)
      }
    } else if (child && typeof child.type === 'string') {
      walk(child, ancestors, visit)
    }
  }
  ancestors.pop()
}
