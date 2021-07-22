/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

up.EventListenerGroup = class EventListenerGroup extends up.Record {

  keys() {
    return [
      'elements',
      'eventTypes',
      'selector',
      'callback',
      'jQuery',
      'guard',
      'baseLayer',
      'passive',
      'once'
    ];
  }

  bind() {
    const unbindFns = [];

    this.eachListenerAttributes(function(attrs) {
      const listener = new up.EventListener(attrs);
      listener.bind();
      return unbindFns.push(() => listener.unbind());
    });

    return u.sequence(unbindFns);
  }

  eachListenerAttributes(fn) {
    return this.elements.map((element) =>
      this.eventTypes.map((eventType) =>
        fn(this.listenerAttributes(element, eventType))));
  }

  listenerAttributes(element, eventType) {
    return u.merge(this.attributes(), { element, eventType });
  }

  unbind() {
    return this.eachListenerAttributes(function(attrs) {
      let listener;
      if (listener = up.EventListener.fromElement(attrs)) {
        return listener.unbind();
      }
    });
  }

  /*
  Constructs a new up.EventListenerGroup from arguments with many different combinations:

      [[elements], eventTypes, [selector], [options], callback]

  @function up.EventListenerGroup.fromBindArgs
  @internal
  */
  static fromBindArgs(args, defaults) {
    let elements, fixTypes;
    args = u.copy(args);

    // A callback function is given in all arg variants.
    const callback = args.pop();

    // The user can pass an element (or the document, or the window) as the
    // first argument. If omitted, the listener will bind to the document.
    if (args[0].addEventListener) {
      elements = [args.shift()];
    } else if (u.isJQuery(args[0]) || (u.isList(args[0]) && args[0][0].addEventListener)) {
      elements = args.shift();
    } else {
      elements = [document];
    }

    // Event names are given in all arg variants
    let eventTypes = u.splitValues(args.shift());
    if (fixTypes = up.migrate.fixEventTypes) {
      eventTypes = fixTypes(eventTypes);
    }

    const options = u.extractOptions(args);

    // A selector is given if the user wants to delegate events.
    // It might be undefined.
    const selector = args[0];

    const attributes = u.merge({ elements, eventTypes, selector, callback }, options, defaults);
    return new (this)(attributes);
  }
};
