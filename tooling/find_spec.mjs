// Finds specs by a phrase in their describe()/it() titles. PURE: the caller reads the
// files, this parses and formats. See bin/find-spec.
//
// Titles are parsed by indentation rather than by braces, which is enough because every
// one of them is written on a single line. extendDescribe() counts as a group: it names
// the path an extracted spec file belongs to (see docs/contributing/testing.md).

const TITLE = /^(\s*)(extendDescribe|[fx]?describe|[fx]?it)\(\s*(['"`])(.*?)\3/

const ANSI = {
  path: (s) => `\x1b[36m${s}\x1b[0m`,      // cyan: file:line
  ancestry: (s) => `\x1b[2m${s}\x1b[0m`,   // dim: the groups above the match
  match: (s) => `\x1b[1;33m${s}\x1b[0m`,   // bold yellow: the phrase itself
}

// Returns [{ file, line, titles, isGroup }], where titles is the full path to the match
// Every group and spec declared in one file, in source order, each with the full path of
// titles leading to it. This is the one parse; everything else here filters or selects
// from it.
export function parseTitles(text) {
  const entries = []
  const stack = []

  text.split('\n').forEach((line, index) => {
    const parsed = TITLE.exec(line)
    if (!parsed) return

    const [, indent, kind, , title] = parsed
    const isGroup = kind !== 'it' && kind !== 'fit' && kind !== 'xit'

    while (stack.length && stack[stack.length - 1].indent >= indent.length) stack.pop()
    const titles = [...stack.map((entry) => entry.title), title]
    if (isGroup) stack.push({ indent: indent.length, title })

    entries.push({ line: index + 1, kind, title, titles, isGroup })
  })

  return entries
}

// including its own title. Matching is case-insensitive on the title alone, so a phrase
// never matches spec code.
export function findSpecs(sources, phrase) {
  const needle = phrase.toLowerCase()
  const matches = []

  for (let { file, text } of sources) {
    for (let { line, titles, isGroup } of parseTitles(text)) {
      if (titles[titles.length - 1].toLowerCase().includes(needle)) {
        matches.push({ file, line, titles, isGroup })
      }
    }
  }

  return matches
}

// The --spec filters that run a file, or just the block declared at `line`. Returns a list
// of full names, or null when the file declares nothing / no block starts at that line —
// the caller has the path and can say so usefully.
//
// A plain describe() yields its own full name, which is that file's own scope. An
// extendDescribe() is different: it names a group that *other* files also contribute to,
// so its own name would run the whole module. We return the names of the real blocks
// underneath it instead — the part this file actually declares. Their full names are
// unique to the file, since two files cannot declare the same path.
export function specFiltersFor(text, line = null) {
  const entries = parseTitles(text)
  if (!entries.length) return null

  const index = line === null ? 0 : entries.findIndex((e) => e.line === line)
  if (index < 0) return null

  const entry = entries[index]
  if (entry.kind !== 'extendDescribe') return [entry.titles.join(' ')]

  return ownBlocksBelow(entries, index)
}

// The shallowest blocks below entries[index] that are not themselves extendDescribe(),
// as full names. Descends through nested extendDescribe() calls, and stops descending
// once a block is collected — its children are already covered by its name.
function ownBlocksBelow(entries, index) {
  const parent = entries[index].titles
  const isBelow = (titles) => titles.length > parent.length &&
    parent.every((title, depth) => titles[depth] === title)

  const names = []
  for (let entry of entries.slice(index + 1)) {
    if (!isBelow(entry.titles)) break
    if (entry.kind === 'extendDescribe') continue
    const name = entry.titles.join(' ')
    if (!names.some((collected) => name.startsWith(collected + ' ') || name === collected)) {
      names.push(name)
    }
  }
  return names.length ? names : null
}

// One line per match: `file:line "full describe path"`. The path is space-joined, which
// makes it exactly the full name Jasmine matches, so it can be pasted straight into
// --spec; the quotes mark where it starts and ends. Ancestry stays dim and the matched
// phrase bold, which is what separates the levels now that there is no separator.
export function formatMatches(matches, { phrase, color = false } = {}) {
  const paint = color ? ANSI : { path: (s) => s, ancestry: (s) => s, match: (s) => s }

  // Locations are padded to the widest one so every path starts in the same column, which
  // is what makes a long result list scannable. Measured before painting, since the ANSI
  // codes would otherwise count towards the width.
  const width = Math.max(0, ...matches.map(({ file, line }) => `${file}:${line}`.length))

  return matches.map(({ file, line, titles }) => {
    const own = titles[titles.length - 1]
    const ancestry = titles.slice(0, -1)
    const location = `${file}:${line}`
    const at = paint.path(location) + ' '.repeat(width - location.length)
    const above = ancestry.length ? paint.ancestry(ancestry.join(' ') + ' ') : ''
    return `${at} "${above}${highlight(own, phrase, paint)}"`
  })
}

function highlight(title, phrase, paint) {
  const at = title.toLowerCase().indexOf(phrase.toLowerCase())
  if (at === -1) return title
  return title.slice(0, at) + paint.match(title.slice(at, at + phrase.length)) + title.slice(at + phrase.length)
}
