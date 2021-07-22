/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
if (!up.store) { up.store = {}; }

const u = up.util;

up.store.Memory = class Memory {

  constructor() {
    this.clear();
  }

  clear() {
    return this.data = {};
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    return this.data[key] = value;
  }

  remove(key) {
    return delete this.data[key];
  }

  keys() {
    return Object.keys(this.data);
  }

  size() {
    return this.keys().length;
  }

  values() {
    return u.values(this.data);
  }
};
