# new up.OptionsParser()

@constructor up.OptionsParser
@param {Object} options
  Explicit options passed by a programmatic caller. These usually override everything.

  All parsed options are assigned to this given `options` argument.
@param {Element} element
  An element from which to parse `[up-attr]` attributes.
@param {boolean} parserOptions.fail
  Whether to automatically parse `[up-fail-attr]` into `{ failAttr }` option.
@param {boolean} parserOptions.closest
  Whether to also look for `[up-attr]` matches in the descendants of `element`.
@param {Object} parserOptions.defaults
  An object of default key/values if an option can neither be found in `options`
  nor can be parsed from `element`.
@internal
