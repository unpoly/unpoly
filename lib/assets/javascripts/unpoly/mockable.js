/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
up.mockable = function(originalFn) {
  let spy = null;
  const obj = function() {
    return (spy || originalFn).apply(null, arguments);
  };
  obj.mock = () => spy = jasmine.createSpy('mockable', originalFn);
  document.addEventListener('up:framework:reset', () => spy = null);
  return obj;
};
