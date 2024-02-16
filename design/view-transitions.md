Benefits
--------

- We could lose up.viewport.absolutize()
- We could lose .up-destroying
  - We no longer need to ignore destroying elements in up.fragment methods
- We could move the default animations from .js to .css


Drawbacks
---------

- A breaking change as our current transition signature (fn(oldEl, newEl, options)) is incompatible with the way view transitions are set up
- We cannot have concurrent view transitions, as the screenshot covers the viewport.
  - This is not an issue for large navigations.
  - This is an issue for fine-grained fragment updates.
- We should probably no longer offer up.animate() and up.morph() functions, to discourage transitions outside of navigations
- Exit animations are possible, but awkward
  - https://chriscoyier.net/2023/10/30/exit-animations/
  - https://developer.chrome.com/docs/web-platform/view-transitions#custom_entry_and_exit_transitions
- Not yet supported by Firefox and Safari: https://caniuse.com/view-transitions


Design notes
------------

- It's unclear whether we also want to use this
- For more advanced view transitions users want to run code before a view transition runs
  - E.g. to set the { viewTransitionName } property of participating elements
  - Or to do the entire animation in JavaScript
  - Would this be a new registry up.viewTransition(name, setupFn(updateFn))?
  - Would this be a new event up:fragment:transition?
- Maybe we could implement this with an { onUpdate({ updateFn, renderOptions }) } callback that can wrap around Unpoly's element replacement
  - Users could use this to integrate their own rendering strategy, e.g. to integrate morphing
  - Users could set up their view transitions there
  - This would kind of be a replacement for UpdateSteps
    - However this also does stuff like [up-keep] handling, focus, scrolling
    - We would need to entangle this as much as possible, so ideally only the element updates remain
  - Is there a case for users wanting to do their own fragment matching and preprocessing?
    - This would have a much larger API impact
