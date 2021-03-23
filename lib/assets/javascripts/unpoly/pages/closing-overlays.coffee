  ###**
  Closing overlays
  ================


  Positive vs. negative close intent
  ----------------------------------

  When closing an [overlay](/up.layer), Unpoly distinguishes between two kinds close intents:

  1. **Accepting** an overlay (user picks a value, confirms with "OK", etc.), optionally with a value
  2. **Dismissing** an oeverlay (user clicks "Cancel", "X", presses `ESC`, clicks on the background)

  ![Different ways to close a modal overlay](/images/api/close-intent.png){:width=500}

  Accepting an overlay will usually continue a larger interaction in the parent layer.
  Dismissal usually means cancelation. When you're waiting for a [subinteraction](/subinteractions)
  to finish successfully you're interested layer acceptance, but not dismissal.

  When opening a layer you may pass separate `{ onAccepted }` and `{ onDismissed }` callbacks
  to handle both cases:

  ```js
  up.layer.open({
    url: '/users/new',
    onAccepted: (event) => console.log('User was created'),
    onDismissed: (event) => console.log('User creation was canceled')
  })
  ```

  Both callbacks are optional.

  In HTML you may use `[up-on-accepted]` and `[up-on-dismissed]` attributes for the same purpose:

  ```js
  <a href="/select-user"
    up-layer="new"
    up-on-accepted="console.log('User was created')"
    up-on-dismissed="console.log('User createion was canceled')">>
    ...
  </a>
  ```

  Overlay result values
  ---------------------

  Overlays in Unpoly may be closed with a *result value*.

  E.g. if the user selects a value, creates a record or confirms an action,
  we consider the overlay to be **accepted with that value**.

  You can access the acceptance value from an `{ onAccepted }` callback:

  ```js
  up.layer.open({
    url: '/select-user',
    onAccepted: (event) => console.log('Got user ', event.value)
  })
  ```

  The acceptance value may also be accessed when you're opening layers from HTML:

  ```html
  <a href="/select-user"
    up-layer="new"
    up-on-accepted="console.log('Got user ', value)">
    ...
  </a>
  ```

  Result values are useful to branch out a complex screen into a [subinteraction](/subinteraction).


  Close conditions
  ----------------

  When opening an overlay, you may define a *condition* when the overlay interaction ends.
  When the condition occurs, the overlay is automatically closed and a callback is run.

  It is recommend to use close conditions instead of explicitly closing the overlay from within the overlay content.
  By defining a close condition, the overlay content does not need to be aware that it's running
  in an overlay. The overlay interaction is decoupled from the interaction in the parent layer.


  \#\#\# Closing when a location is reached

  The following will open an overlay that closes once a URL like `/companies/123` is reached:

  ```html
  <a href="/companies/new"
    up-layer="new"
    up-accept-location="/companies/$id"
    up-on-accepted="alert('New company with ID ' + value.id)">
    New company
  </a>
  ```

  Named segments captured by the [URL pattern](/url-patterns) (`$id`) will
  become the overlay's *acceptance value*.

  The `[up-on-accepted]` callback is called with an acceptance value.

  To *dismiss* an overlay once a given location is reached, use `[up-dismiss-location]` and `[up-on-dismissed]` in the same fashion.


  \#\#\# Closing when an event is emitted

  Instead of waiting for a location to be reached,
  you may accept an overlay\
  once a given **event** is observed on the overlay:

  ```html
  <a href="/users/new"
    up-layer="new"
    up-accept-event="user:created"
    up-on-accepted="alert('Hello user #' + value.id)">
    Add a user
  </a>
  ```

  When the `user:created` event is observed within the new overlay, the event's [default action is prevented](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault) and the overlay is closed.
  The event object becomes the overlay's acceptance value.

  To *dismiss* an overlay once a given event is observerd, use the `[up-dismiss-event]` and `[up-on-dismissed]` attributes in the same fashion.

  To emit an event, use one of the following methods:

  | Method               | Description             |
  |----------------------|-------------------------|
  | `up.emit()`          | JavaScript function to emit an event on any element |
  | `up.layer.emit()`    | JavaScript function to emit an event on the [current layer](/up.layer.current) |
  | `[up-emit]`          | HTML attribute to emit an event on click |
  | `X-Up-Events`        | HTTP header sent from the server |
  | [`Element#dispatchEvent()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent) | Standard DOM API to emit an event on an element |


  Closing from the server
  ----------------------

  The server may explicitly close an overlay by sending an `X-Up-Accept-Layer` or `X-Up-Dismiss-Layer` header.
  Optionally the header may transport a value.

  When you're using the `unpoly-rails` gem, you may produce these headers with `up.layer.accept(value)` or `up.layer.dismiss(value)`.

  The server may also test if the fragment change is targeting an overlay by looking at the `X-Up-Mode` header.


  Closing from JavaScript
  -----------------------

  If for some reason you cannot use a [close condition](#close-conditions), you may
  call `up.layer.accept()` to explicitely accept a layer from JavaScript:


  ```js
  up.layer.accept()
  ```

  To accept with a value, pass it as an argument:

  ```js
  up.layer.accept({ name: 'Anna', email: 'anna@domain.tld' })
  ```

  To *dismiss* an overlay from JavaScript, use the `up.layer.dismiss()` function in the same fashion.


  Closing when an element is clicked
  ----------------------------------

  Use an `[up-accept]` or `[up-dismiss]` attribute to close the [current layer](/up.layer.current)
  when the link is clicked:

      <a href="/fallback" up-accept>...</a>

  If an overlay was closed, the `click` event's [default action is prevented](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
  and the link will not be followed. Only when this link is clicked in the
  [root layer](/up.layer.root), there is no overlay to close and the link to `/fallback` will be followed.

  To *dismiss* an overlay once an element clicked, use the `[up-dismiss]` attribute in the same fashion.


  User dismiss controls
  ---------------------

  By default the user can dismiss an overlay user by pressing `Escape`, by clicking outside the overlay box
  or by pressing an "X" icon in the top-right corner.

  You may customize the dismiss methods available to the user by passing a `{ dismissable }` option
  or `[up-dismissable]` attribute when opening an overlay.

  The option value should contain the name of one or more dismiss controls:

  | Method    | Effect                                           | Dismiss value |
  | --------- | ------------------------------------------------ | ------------- |
  | `key`     | Enables dimissing with `Escape` key              | `:key`        |
  | `outside` | Enables dismissing by clicking on the background | `:outside`    |
  | `button`  | Adds an "X" button to the layer                  | `:button`     |

  Regardless of what is configured here, an overlay may always be dismissed by
  using the `up.layer.dismiss()` method or `a[up-dismiss]` attribute.



  Close animation
  ---------------

  The overlay element's disappeared will be animated using the layer mode's [configured](/up.layer.config) `{ closeAnimation }`.

  To use a different animation, pass an `{ animation }` option to the various close methods.



  Using overlays as promises
  --------------------------

  Instead of using `up.layer.open()` and passing callbacks, you may use `up.layer.ask()`.
  `up.layer.ask()` returns a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
  for the acceptance value, which you can [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await):

  ```js
  let user = await up.layer.ask({ url: '/users/new' })
  console.log('Got user ', user)
  ```


  @page closing-overlays
  ###
