@partial up-watch/observed-events

@param [up-watch-event='input']
  The type of event to watch.

  See [which events to watch](/watch-options#events).

@param [up-watch-delay=0]
  The number of milliseconds to wait after a change.

  This can be used to batch multiple events within a short time span.
  See [debouncing callbacks](/watch-options#debouncing).
