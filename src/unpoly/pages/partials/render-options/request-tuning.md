@partial render-options/request-tuning

@param {boolean} [options.abortable=true]
  Whether the request may be aborted by other requests [targeting](/targeting-fragments)
  the same fragments or layer.

  See [Preventing a request from being aborted](/aborting-requests#preventing).

@param {boolean} [options.background=false]
  Whether this request will load in the background.

  Background requests deprioritized over foreground requests.
  Background requests also won't emit `up:network:late` events and won't trigger
  the [progress bar](/progress-bar).

@param {number|boolean} [options.lateDelay]
  The number of milliseconds after which this request can cause
  an `up:network:late` event and show the [progress bar](/progress-bar).

  To prevent the event and progress bar, pass `{ lateDelay: false }`.

  Defaults to `up.network.config.lateDelay`.

  @experimental

@param {number} [options.timeout]
  The number of milliseconds after which this request fails with a timeout.

  Defaults to `up.network.config.timeout`.
