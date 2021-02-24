  ###**
  Navigation
  ==========

  When a browser user interacts with a standard hyperlink or form,
  they have certain expectations regarding scrolling, history, focus,
  request cancelation, etc. When an Unpoly feature
  *navigates* it will mimic the behavior of standard hyperlinks and forms.

  When an Unpoly feature does *not* navigate, it only renders a new fragment,
  without affecting scroll positions, browser, history, etc.

  \#\#\# Navigating features

  [Following a link](/a-up-target), [submitting a form](/form-up-target) or
  [opening an overlay](/up.layer.open) is considered navigation by default.
  You may opt *out of* navigation defaults by passing a `{ navigate: false }` option
  or setting an `[up-navigate=false]` attribute.

  Other features like [validation](/input-up-validate) or `up.render()` are *not*
  considered navigation by default. You may opt *into* navigation by passing a
  `{ navigate: true }` option or setting an `[up-navigate=true]` attribute.

  | Feature              | Navigates by default? |
  |----------------------|-----------------------|
  | `a[up-follow]`       | yes                   |
  | `up.follow()`        | yes                   |
  | `up.navigate()`      | yes                   |
  | `a[up-layer=new]`    | yes                   |
  | `up.layer.open()`    | yes                   |
  | `form[up-submit]`    | yes                   |
  | `up.submit()`        | yes                   |
  | `up.render()`        | no                    |
  | `input[up-validate]` | no                    |
  | `up.validate()`      | no                    |
  | `[up-poll]`          | no                    |


  \#\#\# Navigation defaults

  The following default options will be used when navigating:

  | Option                  | Effect                                       |
  | ----------------------- | -------------------------------------------- |
  | `{ history: 'auto' }`   | Update browser location and window title if updating a main target |
  | `{ scroll: 'auto' }`    | Reset scroll position if updating a main target |
  | `{ fallback: ':main' }` | Replace a [main target](/up.fragment.config#config.mainTargets) if response doesn't contain target |
  | `{ cache: true }`       | Cache responses for 5 minutes |
  | `{ feedback: true }`    | Set [`.up-active`](/a-up-update) on the activated link |
  | `{ focus: 'auto' }`     | Focus [autofocus] elements in the new fragment |
  | `{ solo: true }`        | Cancel existing requests |
  | `{ peel: true }`        | Close overlays when targeting a layer below |

  You can customize your navigation defaults with `up.fragment.config.navigateOptions`.

  @page navigation
  ###