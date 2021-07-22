/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

/***
@module up.migrate
*/
up.migrate = (function() {

  const config = new up.Config(() => ({
    logLevel: 'warn'
  }));

  const renamedProperty = function(object, oldKey, newKey) {
    const warning = () => warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object);
    return Object.defineProperty(object, oldKey, {
      get() {
        warning();
        return this[newKey];
      },
      set(newValue) {
        warning();
        return this[newKey] = newValue;
      }
    }
    );
  };

//  removedProperty = (object, key) ->
//    failure = -> up.fail('Deprecated: Property { %s } is no longer supported (found in %o)', key, object)
//    Object.defineProperty object, key,
//      get: failure
//      set: failure

  const fixKey = function(object, oldKey, newKey) {
    if (u.isDefined(object[oldKey])) {
      warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object);
      return u.renameKey(object, oldKey, newKey);
    }
  };

  // Maps old event type to new event type
  const renamedEvents = {};

  const renamedEvent = (oldType, newType) => renamedEvents[oldType] = newType;

  const fixEventType = function(eventType) {
    let newEventType;
    if (newEventType = renamedEvents[eventType]) {
      warn(`Event ${eventType} has been renamed to ${newEventType}`);
      return newEventType;
    } else {
      return eventType;
    }
  };

  const fixEventTypes = eventTypes => // Remove duplicates as e.g. up:history:pushed and up:history:replaced
  // both map to up:location:changed.
  u.uniq(u.map(eventTypes, fixEventType));

  const renamedPackage = (oldName, newName) => Object.defineProperty(up, oldName, { get() {
    warn(`up.${oldName} has been renamed to up.${newName}`);
    return up[newName];
  }
});

  const warnedMessages = {};

  var warn = function(message, ...args) {
    const formattedMessage = u.sprintf(message, ...Array.from(args));
    if (!warnedMessages[formattedMessage]) {
      warnedMessages[formattedMessage] = true;
      return up.log[config.logLevel]('unpoly-migrate', message, ...Array.from(args));
    }
  };

  const deprecated = (deprecatedExpression, replacementExpression) => warn(`${deprecatedExpression} has been deprecated. Use ${replacementExpression} instead.`);

  // Returns a resolved promise that prints a warning when #then() is called.
  const formerlyAsync = function(label) {
    const promise = Promise.resolve();
    const oldThen = promise.then;
    promise.then = function() {
      warn(`${label} is now a sync function`);
      return oldThen.apply(this, arguments);
    };
    return promise;
  };

  const reset = () => config.reset();

  up.on('up:framework:reset', reset);

  return {
    deprecated,
    renamedPackage,
    renamedProperty,
    formerlyAsync,
  //  removedProperty: removedProperty
    renamedEvent,
    fixEventTypes,
    fixKey,
    warn,
    loaded: true,
    config
  };
})();

