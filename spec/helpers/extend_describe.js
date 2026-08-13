// Names the describe() groups that a extracted spec file is nested in.
//
// When a group grows large enough to need a spec file of its own, that file spells out the
// path it belongs to, so a reader (or an agent) sees the full nesting without opening the
// file it was extracted from:
//
//     // fragment_render_url_spec.js
//     extendDescribe('up.fragment', function() {
//       extendDescribe('JavaScript functions', function() {
//         extendDescribe('up.render()', function() {
//
//           describe('with { url } option', function() { ... })
//
//         })
//       })
//     })
//
// The file it was extracted from requires it at the position the group used to occupy:
//
//     // fragment_spec.js
//     describe('up.render()', function() {
//
//       require('./fragment_render_url_spec')
//
//     })
//
// So extendDescribe() must *not* declare a suite: by the time the require() runs, we are
// already inside describe('up.render()'), and nesting again would double the path. It
// only invokes its callback, and its title is documentation.
//
// Because an extracted file declares nothing on its own, it must not be loaded outside a
// require() from its original position -- its specs would land at the root of the suite,
// with a truncated full name and no error. This is why spec/specs.js requires every spec
// file explicitly rather than globbing the folder, and why a self-test checks that list.
//
// See docs/contributing/testing.md.

window.extendDescribe = function(_title, fn) {
  fn()
}
