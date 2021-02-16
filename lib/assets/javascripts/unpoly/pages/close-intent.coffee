  ###**
  Positive vs. negative close intent
  ==================================

  When closing an [overlay](/up.layer), Unpoly distinguishes between two kinds close intents:

  1. **Accepting** an overlay (user picks a value, confirms with "OK", etc.), optionally with a value
  2. **Dismissing** an oeverlay (user clicks "Cancel", "X", presses `ESC`, clicks on the background)

  ![Different ways to close a modal overlay](/images/api/close-intent.png)

  ## Closing overlays

  | Method                                                 | Description             |
  |--------------------------------------------------------|-------------------------|
  | [Defining a close condition](/close-conditions)        | The recommended way.    |
  | `[up-accept]`                                          | HTML attribute          |
  | `[up-dismiss]`                                         | HTML attribute          |
  | `up.layer.accept()`                                    | JavaScript function     |
  | `up.layer.dismiss()`                                   | JavaScript function     |
  | `X-Up-Accept-Layer`                                    | HTTP header sent from the server |
  | `X-Up-Dismiss-Layer`                                   | HTTP header sent from the server |

  ## Acceptance means next step, dismissal means cancelation

  When you're waiting for a sub-interaction to finish successfully,
  you're probably interested in layer acceptance, but not dismissal.

  When opening a layer you may pass separate `{ onAccepted }` and `{ onDismissed }`  callbacks:

  ```js
  up.layer.open({
    url: '/users/new',
    onAccepted: (event) => console.log("New user is " + event.value),
    onDismissed: (event) => console.log("User creation was canceled")
  })
  ```

  \#\#\# Overlays as promises

  It's useful to think of overlays as [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
  which may either be **fulfilled (accepted)** or **rejected (dismissed)**.

  Instead of using `up.layer.open()` and passing callbacks, you may use `up.layer.ask()`.
  `up.layer.ask()` returns a promise for the acceptance value, which you can `await`:

  ```js
  let user = await up.layer.ask({ url: '/users/new' })
  console.log("New user is " + user)
  ```

  @page close-intent
  ###
