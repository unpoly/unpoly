// Marks the position where a describe() group used to live, before it grew large enough
// to be extracted into a spec file of its own:
//
//     describe('up.render()', function() {
//
//       describe('compilation', function() { ... })
//
//       describeElsewhere('with { url } option')
//
//       describe('with { response } option', function() { ... })
//
//     })
//
// The marker keeps the original reading order of a feature's groups, and greps as
// `describeElsewhere` for a complete map of every extraction in the suite.
//
// We reference the group by its title, never by a file name. A renamed spec file still
// declares the same title, so a file name could only rot cosmetically -- while a deleted
// or renamed group makes the title disappear, which is what we check for.
//
// The check is on the *full* name, including every ancestor describe(). Sub-group titles
// are not unique across the suite (129 of 1166 titles repeat), and a developer should not
// have to invent a globally unique one. We learn our own ancestry from the marker spec's
// fullName, which log_current_spec.js maintains through Jasmine's public reporter API.
//
// See docs/contributing/testing.md.

const MARKER_PREFIX = 'describes elsewhere: '

// The full name of every suite in the tree. Suites carry a children array; specs don't,
// which is how we tell them apart. Specs are excluded deliberately: a marker must resolve
// to a describe() group, never to an it().
function suiteFullNames(suite = jasmine.getEnv().topSuite(), into = new Set()) {
  for (let child of suite.children || []) {
    if (!Array.isArray(child.children)) continue
    into.add(child.getFullName())
    suiteFullNames(child, into)
  }
  return into
}

window.describeElsewhere = function(title) {
  it(MARKER_PREFIX + title, function() {
    // Our own full name is the ancestry we were declared in, plus our description.
    // Dropping the description leaves the path the extracted group must live under.
    const ownDescription = MARKER_PREFIX + title
    const ownFullName = jasmine.currentSpec.fullName
    const ancestry = ownFullName.slice(0, ownFullName.length - ownDescription.length).trim()
    const expected = ancestry ? `${ancestry} ${title}` : title

    const loadedNames = suiteFullNames()

    // On failure, say whether the title turned up under some other ancestry. That
    // distinguishes "the group was deleted" from "the group was moved or renested".
    let hint = ''
    if (!loadedNames.has(expected)) {
      const elsewhere = [...loadedNames].filter((name) => name === title || name.endsWith(` ${title}`))
      hint = elsewhere.length
        ? ` A group with that title exists at: ${elsewhere.join(' | ')}.`
        : ' No group with that title exists in any spec file.'
    }

    expect(loadedNames.has(expected))
      .withContext(`describeElsewhere('${title}') expected a describe() group named "${expected}".${hint}`)
      .toBe(true)
  })
}
