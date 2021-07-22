/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.migrate.postCompile = function(elements, compiler) {
  // up.compiler() has a legacy { keep } option that will automatically
  // set [up-keep] on the elements it compiles
  let keepValue;
  if (keepValue = compiler.keep) {
    up.migrate.warn('The { keep: true } option for up.compiler() has been removed. Have the compiler set [up-keep] attribute instead.');
    const value = u.isString(keepValue) ? keepValue : '';
    return elements.map((element) =>
      element.setAttribute('up-keep', value));
  }
};

up.migrate.targetMacro = (queryAttr, fixedResultAttrs, callback) => up.macro(`[${queryAttr}]`, function(link) {
  let optionalTarget;
  const resultAttrs = u.copy(fixedResultAttrs);
  if ((optionalTarget = link.getAttribute(queryAttr))) {
    resultAttrs['up-target'] = optionalTarget;
  } else {
    resultAttrs['up-follow'] = '';
  }
  e.setMissingAttrs(link, resultAttrs);
  link.removeAttribute(queryAttr);
  return (typeof callback === 'function' ? callback() : undefined);
});
