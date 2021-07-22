/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/***
@module up.event
*/

up.migrate.renamedPackage('bus', 'event');

/***
[Emits an event](/up.emit) and returns whether no listener
has prevented the default action.

\#\#\# Example

```javascript
if (up.event.nobodyPrevents('disk:erase')) {
  Disk.erase()
})
```

@function up.event.nobodyPrevents
@param {string} eventType
@param {Object} eventProps
@return {boolean}
  whether no listener has prevented the default action
@deprecated
  Use `!up.emit(type).defaultPrevented` instead.
*/
up.event.nobodyPrevents = function(...args) {
  up.migrate.deprecated('up.event.nobodyPrevents(type)', '!up.emit(type).defaultPrevented');
  const event = up.emit(...Array.from(args || []));
  return !event.defaultPrevented;
};
