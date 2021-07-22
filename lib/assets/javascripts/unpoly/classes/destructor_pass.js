/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.DestructorPass = class DestructorPass {

  constructor(fragment, options) {
    this.fragment = fragment;
    this.options = options;
    this.errors = [];
  }

  run() {
    for (let cleanable of this.selectCleanables()) {
      var destructors;
      if (destructors = u.pluckKey(cleanable, 'upDestructors')) {
        for (let destructor of destructors) {
          this.applyDestructorFunction(destructor, cleanable);
        }
      }
      cleanable.classList.remove('up-can-clean');
    }

    if (this.errors.length) {
      throw up.error.failed('Errors while destroying', { errors: this.errors });
    }
  }

  selectCleanables() {
    const selectOptions = u.merge(this.options,
      {destroying: true}); // fragment functions usually ignore elements that are being destroyed

    return up.fragment.subtree(this.fragment, '.up-can-clean', selectOptions);
  }

  applyDestructorFunction(destructor, element) {
    try {
      return destructor();
    } catch (error) {
      this.errors.push(error);
      up.log.error('up.destroy()', 'While destroying %o: %o', element, error);
      return up.error.emitGlobal(error);
    }
  }
};
