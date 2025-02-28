@partial up.off/after-element

@param {string|Function(): string} types
  The event types to unbind.

  Multiple event types may be passed as either a space-separated string (`'foo bar'`), a comma-separated string (`'foo, bar'`)
  or as an array of types (`['foo', 'bar']`).
@param {Function(event, [element], [data])} listener
  The listener function to unbind.

  You must pass a reference to the same function reference
  that was used to register the listener.
