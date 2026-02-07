// for fragment_spec
if (typeof window.scriptTagExecuted !== 'function') {
  throw new Error(`linked_script.js saw undefined window.scriptTagExecuted(); Script may have been loaded after its spec failed. XXX`)
}
window.scriptTagExecuted()
