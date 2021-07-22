/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

//#
// Store implementation backed by window.sessionStorage
// ====================================================
//
// This improves plain sessionStorage access in several ways:
//
// - Falls back to in-memory storage if window.sessionStorage is not available (see below).
// - Allows to store other types of values than just strings.
// - Allows to store structured values.
// - Allows to invalidate existing data by incrementing a version number on the server.
//
// On sessionStorage availability
// ------------------------------
//
// All supported browsers have sessionStorage, but the property is `null`
// in private browsing mode in Safari and the default Android webkit browser.
// See https://makandracards.com/makandra/32865-sessionstorage-per-window-browser-storage
//
// Also Chrome explodes upon access of window.sessionStorage when
// user blocks third-party cookies and site data and this page is embedded
// as an <iframe>. See https://bugs.chromium.org/p/chromium/issues/detail?id=357625
//
up.store.Session = class Session extends up.store.Memory {

  constructor(rootKey) {
    this.set = this.set.bind(this);
    this.remove = this.remove.bind(this);
    super();
    this.rootKey = rootKey;
    this.loadFromSessionStorage();
  }

  clear() {
    super.clear();
    return this.saveToSessionStorage();
  }

  set(key, value) {
    super.set(key, value);
    return this.saveToSessionStorage();
  }

  remove(key) {
    super.remove(key);
    return this.saveToSessionStorage();
  }

  loadFromSessionStorage() {
    try {
      let raw;
      if (raw = typeof sessionStorage !== 'undefined' && sessionStorage !== null ? sessionStorage.getItem(this.rootKey) : undefined) {
        this.data = JSON.parse(raw);
      }
    } catch (error) {}
      // window.sessionStorage not supported (see class comment)
      // or JSON syntax error. We start with a blank object instead.

    return this.data || (this.data = {});
  }

  saveToSessionStorage() {
    const json = JSON.stringify(this.data);
    try {
      return (typeof sessionStorage !== 'undefined' && sessionStorage !== null ? sessionStorage.setItem(this.rootKey, json) : undefined);
    } catch (error) {}
  }
};
      // window.sessionStorage not supported (see class comment).
      // We do nothing and only keep data in-memory.
