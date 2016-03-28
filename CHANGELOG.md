Changelog
=========

All notable changes to this project will be documented in this file.
This project mostly adheres to [Semantic Versioning](http://semver.org/).


Unreleased
----------

### Compatible changes


### Breaking changes


0.23.0
------

### Compatible changes

- Unpoly forms can now [submit](/up.submit) file uploads via AJAX.
- You can now position [tooltips](/up-tooltip) on the left or right side of an element.


### Breaking changes

- Tooltips have a darker background color.
- The tooltip CSS has been changed to be easier to override.


0.22.1
------

### Compatible changes

- Fix a bug where the document title wasn't restored when using the back
  and forward buttons
- Fix a bug where links would be followed multiple times if the link
  had an [`up-dash`](/up-dash) attribute without a value and also an `up-target` attribute.
- Fix a bug where a link would be followed multiple times if the link's
  click area was expanded using [`[up-expand]`](/up-expand) and if the
  link also had an [`up-dash`](/up-dash) attribute.


0.22.0
------

### Compatible changes

- Fix a bug where using the `up-confirm` attribute would result in an infinite loop
- Unpoly no longer displays confirmation dialogs when [preloading](/up-preload) a link that
  has both [`up-preload`](/up-preload) and `up-confirm` attributes.


### Breaking changes

- `up.proxy.idle()` is now [`up.proxy.isIdle()`](/up.proxy.isIdle)
- `up.proxy.busy()` is now [`up.proxy.isBusy()`](/up.proxy.isBusy)
- Event `up:proxy:busy` is now [`up:proxy:slow`](/up:proxy:slow)
- Event `up:proxy:idle` is now [`up:proxy:idle`](/up:proxy:recover)


0.21.0
------

### Compatible changes

- New function `up.macro`. This registers a [compiler](/up.compiler) that is run before all other compilers.
- [`up.compiler`](/up.compiler) has a new options `{ priority }`. Compilers with higher priorities are run first.
- Fix a bug where trying to apply another transition on an element could throw a *Maximum call stack exceeded*
    error if the element was already transitioning.

### Breaking changes

- `up-toggle` has been renamed to `up-switch`


0.20.0
------

- The project has been renamed to *Unpoly*.
- All functions remain in the `up` namespace, so e.g. `up.replace` is still called `up.replace`.
- All UJS functionality remains unchanged, so e.g. `up-target` is still called `up-target`.
- The Bower package has been renamed to `unpoly`.
- The Ruby gem for the Rails bindings has been renamed to `unpoly-rails`.
- The new Javascript and stylesheet assets are:
  - [`unpoly.js`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly.js)
  - [`unpoly.min.js`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly.min.js)
  - [`unpoly.css`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly.css)
  - [`unpoly.min.css`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly.min.css)
- If you're using the Bootstrap integration the new assets are:
  - [`unpoly-bootstrap3.js`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly-bootstrap3.js)
  - [`unpoly-bootstrap3.min.js`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly-bootstrap3.min.js)
  - [`unpoly-bootstrap3.css`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly-bootstrap3.css)
  - [`unpoly-bootstrap3.min.css`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly-bootstrap3.min.css)


0.19.0
------

### Compatible changes

- Elements can now be persisted during page updates using the [`up-keep`](/up-keep) attribute.
- `up.proxy.ajax` is now available as [`up.ajax`](/up.ajax).
- `up.ajax` can now handle nested objects as `{ data }` option (used to pass form parameters).

### Breaking changes

- `up.implant` has been renamed to [`up.extract`](/up.extract).


0.18.1
------

### Compatible changes

- The logging output to the developer console is now much quieter and more useful


0.18.0
------

### Compatible changes

- New UJS attribute [`[up-toggle]`](/up-toggle) to show or hide part of a form if certain options are selected or boxes are checked.
- Links can now have an optional `up-confirm` attribute. This opens a confirmation dialog with the given message
  before the link is followed or the modal/popup is opened.
- New function [`up.off`](/up.off). This unregisters an event listener previously bound with [`up.on`](/up.on).
- If a container contains more than one link, you can now set the value of the [`up-expand`](/up-expand)
  attribute to a CSS selector to define which link should be expanded.
- You can now configure a list of idempotent HTTP methods in [`up.proxy.config.safeMethods`](/up.proxy.config).
  The proxy cache will only cache idempotent requests and will clear the entire
  cache after a non-idempotent request.
- Loading modals and popups will now open if there is a fragment update between the modal/popup's
  request and response.
- [`up.follow`](/up.follow) and [`up.replace`](/up.replace) now have an option `{ failTarget }`.
  Use it to define the selector to replace if the server responds with a non-200 status code.
- [`[up-target]`](/up-target) and [`up-follow`](/up.replace) now have a modifying attribute `up-fail-target`.
  Use it to define the selector to replace if the server responds with a non-200 status code.
- New utility method [`up.util.reject`](/up.util.reject)
- New utility method [`up.util.only`](/up.util.only)
- New utility method [`up.util.except`](/up.util.except)
- Fix a bug where modals could no longer be opened on some browsers

### Breaking changes

- By default Unpoly now converts `PUT`, `PATCH` and `DELETE` requests to `POST` requests
  that carry their original method in a form parameter named `_method`.
  This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

  Web frameworks like Ruby on Rails or Sinatra are aware of the `_method` parameter and use
  its value as the method for routing.

  You can configure this behavior in [`up.proxy.config.wrapMethods`](/up.proxy.config)
  and [`up.proxy.config.wrapMethodParam`](/up.proxy.config).
- The requested selector is now sent to the server as a request header `X-Up-Target`
  (this used to be `X-Up-Selector`). If you are using `unpoly-rails`, you can access it
  through `up.target` (this used to be `up.selector`).


0.17.0
------

### Compatible changes

- When used with the [Ruby on Rails unobtrusive scripting adapter](https://github.com/rails/jquery-ujs) (`rails_ujs.js`),
  now prevents duplicate form submission when Unpoly attributes are mixed with `data-method` attributes.
- [`[up-instant]`](/up-instant) now works with modals and popups
- [`[up-expand]`](/up-expand) now works with modals and popups

### Breaking changes

- When [`up.observe`](/up.observe) is used with a delay of zero, the callback is invoked instantly (instead of
  being invoked in the next animation frame).


0.16.0
------

### Compatible changes

- You can now configure [`up.proxy.config.maxRequests`](/up.proxy.config) to limit
  the maximum number of concurrent requests. Additional
  requests are queued. This currently ignores preloading requests.

  You might find it useful to set this to `1` in full-stack integration
  tests (e.g. Selenium).
- Allow to disable animations globally with `up.motion.enabled = false`.
  This can be useful in full-stack integration tests like a Selenium test suite.
- New function [`up.motion.isEnabled`](/up.motion.isEnabled) to check if animations will be performed.
- [`up.popup.attach`](/up.popup.attach) now throws a helpful error when trying to attach a popup to a non-existing element
- New option [`up.modal.config.history`](/up.modal.config) to configure if modals change the browser URL (defaults to `true`)
- New option [`up.popup.config.history`](/up.popup.config) to configure if popup change the browser URL (defaults to `false`).
- Fix CSS for popups with a position of `"bottom-left"`.

### Breaking changes

- Popups and modals used to close automatically whenever an element behind the overlay was replaced.
  This behavior is still in effect, but only if the replacement was triggered by a link or element from
  within the popup or modal.
- Popups and modals no longer raise an error if their (hidden) overlay was closed before the
  response was received.
- Popups and modals are now compiled before they are animated.


0.15.1
------

### Compatible changes

- Fix an error where `up.form.config` was not published. This caused `unpoly-bootstrap3.js` to throw an error.


0.15.0
------

### Compatible changes

- New function [`up.autosubmit`](/up.autosubmit) and selector [`[up-autosubmit]`](/up-autosubmit) to
  observe a form or field and submit the form when a value changes.
- [`up.observe`](/up.observe) and [`[up-observe]`](/up-observe) can now be applied
  to `<form>` tags. The callback is run when any field in the form changes.
- New function [`up.browser.canPushState`](/up.browser.canPushState) to detect
  if the browser supports `history.pushState`.
- New function [`up.browser.canCssTransition`](/up.browser.canCssTransition) to
  detect if the browser supports animation with CSS transitions.
- New function [`up.browser.canInputEvent`](/up.browser.canInputEvent) to
  detect if the browser supports the `input` event.
- Allow to [configure a default delay](/up.form.config) for [`up.observe`](/up.observe).
- [Popups](/up.popup) now have events [`up:popup:open`](/up:popup:open),
  [`up:popup:opened`](/up:popup:opened), [`up:popup:close`](/up:popup:close)
  and [`up:popup:closed`](/up:popup:closed).
- The destructor returned by [`up.observe`](/up.observe) now properly unregisters
  event listeners.

### Breaking changes

- [`up.observe`](/up.observe) now takes the callback function as a last argument.
  The callback can now longer be passed as a `.change` option.


0.14.0
------

### Compatible changes

- Published the [up.util](/up.util) module.
  This might save you from loading something like [Underscore.js](http://underscorejs.org/).


0.13.0
------

### Compatible changes

- Support for server-side live validation of forms
  using the [`[up-validate]`](/up-validate) selector.
- Support for [non-standard CSS selectors from jQuery](https://api.jquery.com/category/selectors/),
  such as [`:has`](http://api.jquery.com/has-selector/) or [`:visible`](http://api.jquery.com/visible-selector/).
- Allow to refer to the current element as `&` in target selectors. This is useful
  to reference containers that contain the triggering element, e.g.
  `<a href="/path" up-target=".container:has(&)">`
- Improve automatic generation of selectors for elements when no
  explicit selector is given.
- Forms with `file` inputs will now cause forms to fall back to a standard submission without AJAX.
  In a future release we will be able to submit file inputs via AJAX.
- The [request cache](/up.proxy) now reuses responses for `body` and `html` when asked for other selectors.
- Server responses can now change the document title by including an `X-Up-Title` header.


0.12.5
------

### Compatible changes

- `a[up-target]` and `up.follow` now scroll to a #hash in the link's destination URL
- When up.replace cannot make a change in old browsers, return an unresolved promise instead of a resolved promise.


0.12.4
------

### Compatible changes

- When [morphing](/up.morph), prevent flickering caused by long repaint frames
- When [morphing](/up.morph) don't un-highlight current navigation sections in the element that is being destroyed. This makes for a smoother transition.
- Fix a bug where compositing wasn't forced properly during an animation


0.12.3
------

Refactored internals. No API changes.


0.12.2
------

### Compatible changes

- When marking links as `.up-current`, also consider the URL behind a current modal or popup to
  be the "current" URL.


### Breaking changes

- `up.bus.emit` is now [`up.emit`](http://unpoly.com/up.emit/)
- When `up.first` finds no match, return `undefined` instead of `null`.


0.12.1
------

### Compatible changes

- `up.on` now returns a function that unbinds the events when called
- Fixed a bug where restoring previous scroll positions was not worked
  in situations where the same operation would also reveal the replaced element.
- Various bugfixes


0.12.0
------

### Compatible changes

- Unpoly can now be used with [`jQuery.noConflict()`](https://api.jquery.com/jquery.noconflict/).


### Breaking changes

- Remove `up.slot`, which was poorly implemented, untested, and not much better than the `:empty` pseudo-selector
  which has great browser support
- Replaced the `up.bus.on(...)` event registry with vanilla DOM events bound to `document`. Also renamed
  events in the process.

  Instead of the old ...

      up.bus.on('fragment:ready', function($fragment) {
        ...
      };

  ... you now need to write ...

      $(document).on('up:fragment:inserted', function(event) {
        var $fragment = $(this);
        ...
      };

  ... or shorter:

      up.on('up:fragment:inserted', function(event, $fragment) {
         ...
      };
- Renamed `up.ready` to `up.hello`. This will emit an `up:event:inserted` event for the given element,
  causing it to be compiled etc.
- `up.popup.open` has been renamed to `up.popup.attach`.
- `up.modal.open` has been split into two methods `up.modal.visit(url)` and `up.modal.follow($link)`.
- `up.tooltip.open` has been renamed to `up.tooltip.attach`.
- Tooltips now escape HTML by default; To use HTML content, use an `[up-tooltip-html]` attribute instead.
- Module configurations are now simple properties like `up.layout.config` instead of methods like `up.layout.defaults(...)`.

  Instead of the old ...

      up.layout.defaults({ snap: 100 });

  ... you now need to write:

      up.layout.config.snap = 100;


0.11.1
------

### Compatible changes

- Fix a bug where browsers without CSS animation support would crash after an animation call
- Expose `up.error` as public API. This prints an error message to the error console and throws a new `Error` with that message.
- Fix a million bugs related to compatibility with IE9 and IE10


0.11.0
------

### Compatible changes

- Rework the scrolling implementation so we don't need to scroll elements to the top before replacing them.
- `up.ajax` now only caches responses with a status code of `200 OK`
- When a link with an `[up-close]` attribute is clicked, the link's default action will only be prevented
  if the link was actually within a modal or popup.
- When revealing an element, Up will now compute the correct element position if there are
  additional positioning contexts between the viewport and the element
- New option "top" for `up.reveal`: Whether to scroll the viewport so that the first element row aligns with
  the top edge of the viewport. Without this option, `up.reveal` scrolls as little as possible.
- Allow to animate scrolling when the `document` is the viewport.
- New `up.layout` setting `fixedRight` that contains selectors for elements that are anchored to
  the right edge of the screen. When opening a modal, these elements will be prevented from jumping
  around. If you're using `unpoly-bootstrap3.js`, this will default to `['.navbar-fixed-top', '.navbar-fixed-bottom', '.footer']`.
- Fix a bug in `unpoly-rails` where the gem would fail to `include` itself in some versions
  of Ruby and Rails.


### Breaking changes

- Interactions that would result in an URL change ("pushState") now fall back to a full page load
  if Unpoly was booted from a non-GET request. [More information about the reasons for this](https://github.com/unpoly/unpoly/commit/d81d9007aa3bfae0fca8c55a71d180d1044acae5).

  This currently works out of the box if you're using Unpoly via the `unpoly-rails` Rubygem.
  If you're integrating Unpoly with Bower or manually, you need to have your server app
  set an `_up_request_method` cookie with the current request method on every request.


0.10.5
------

### Compatible changes

- Fix a bug where the proxy would remain busy forever if a response failed.


0.10.4
------

### Compatible changes

- Fix a bug where hovering multiple times over the same [up-preload] link would
  not trigger a new request after the cache expired


0.10.3
------

### Compatible changes

- The default viewport is now `document` instead of the `<body>` element.


0.10.2
------

### Breaking changes

- While following links and submitting forms will still reveal elements by default,
  direct calls of [`up.replace`](/up.replace) no longer do.
  This behavior can be activated using the `{ reveal: true }` option.

### Compatible changes

- Options to control scrolling and cache use for
  [`up.submit`](/up.submit),
  [`up.follow`](/up.follow),
  [`up.visit`](/up.visit),
  [`form[up-target]`](/form-up-target) and
  [`a[up-target]`](/a-up-target).


0.10.1
------

### Breaking changes

- [`up.reveal`](/up.reveal) now only reveals the first 150 pixels of an element.


0.10.0
-------

### Compatible changes

- Viewport scroll positions are saved when the URL changes and restored when the user hits the back/forward button
- Allow to link to the previous page using [`[up-back]`](/up-back)
- Allow to restore previous scroll state using [`[up-restore-scroll]`](/a-up-target)
- Instead of saying `<tag up-something="true">` you can now simply say `<tag up-something>`.
- Create this Changelog.

### Breaking changes

- The option `options.scroll` and attribute `up-scroll` have been removed. Instead you can use the
  boolean option `options.reveal` or `up-reveal` to indicate whether an element should be revealed
  within the viewport before replacement.
- The string `up.history.defaults('popTarget')` is now an array of selectors `up.history.defaults('popTargets')`


0.9.1
-----

### Compatible changes

- Change transition implementation so child elements with collapsing margins don't reposition within the animated element


0.9.0
-----

### Compatible changes

- Elements are now being [revealed](/up.reveal) within their viewport before they are updated
- Elements that are prepended or appended using `:before` or `:after` pseudo-selectors are now scrolled into view after insertion.
- New option `up.layout.defaults('snap')` lets you define a number of pixels under which Unpoly will snap to the top edge of the viewport when revealing an element
- You can now make [`up.reveal`](/up.reveal) aware of fixed navigation bars blocking the viewport by setting new options `up.layout.defaults('fixedTop')` and `up.layout.defaults('fixedBottom')`.


0.8.2
-----

### Compatible changes

- [`up.reveal`](/up.reveal) can now reveal content in modals and containers with `overflow-y: scroll`.
- Changing the default configuration of an Unpoly module now raises an error if a config key is unknown.
- Links linking to `"#"` are now never marked as `.up-current`.


0.8.1
-----

### Compatible chanes

- You can now include `unpoly-bootstrap3.js` and `unpoly-bootstrap3.css` to configure Unpoly to play nice with Bootstrap 3.


### Breaking changes

- Like Bootstrap, the Unpoly modal will now scroll the main document viewport instead of the modal dialog box.



0.8.0
-----

### Compatible changes

- Unpoly will now emit [events](http://unpoly.com/up.bus) `proxy:busy` and `proxy:idle` whenever it is loading or is done loading content over HTTP.
- Add an option `up.proxy.defaults('busyDelay')` to delay the `proxy:busy` event in order to prevent flickering of loading spinners.


0.7.8
------

### Compatible changes

- Now longer throws an error if the current location does not match an `up-alias` wildcard (bugfix).


0.7.7
-----

### Compatible changes

- Allow `up-alias` to match URLs by prefix (`up-alias="prefix*"`).


0.7.6
-----

### Compatible changes

- Fix what Unpoly considers the current URL of a modal or popup if multiple updates change different parts of the modal or popup.
- Don't replace elements within a container that matches `.up-destroying` or `.up-ghost` (which are cloned elements for animation purposes).


0.7.5
-----

### Compatible changes

- Make sure that an expanded link will be considered a link by adding an `up-follow` attribute if it doesn't already have an `up-target` attribute.


0.7.4
-----

### Compatible changes

- Correctly position tooltips when the user has scrolled the main document viewports.
- Allow popups within modal dialogs.


0.7.3
-----

### Compatible changes

- Use [up.proxy](http://unpoly.com/up.proxy) when submitting a form.


0.7.2
-----

### Compatible changes

- When marking links as `.up-current`, allow to additionally match on a space-separated list of URLs in an  `up-alias` attribute.


0.7.1
-----

### Compatible changes

- Bugfix: Don't consider forms with an `up-target` attribute to be a link.


0.7.0
-----

### Compatible changes

- New selector [`[up-expand]`](/up-expand) to enlarge click areas


0.6.5
-----

### Compatible changes

- Animation options for `up.tooltip.open`
- Consider the left mouse button clicked when `event.button` is undefined (as happens with `.click()``)

### Breaking changes

- Rename option `.origin` to `.position` in `up.popup` and `up.tooltip`


0.6.4
-----

### Compatible changes

- Don't follow links while CTRL, Meta or Shift keys are pressed


0.6.3
-----

### Compatible changes

- Show backtraces for Unpoly errors

### Breaking changes

- Rename method `up.awaken` to `up.compiler`


0.6.2
-----

### Compatible changes

- Option to have a custom HTTP method for `up.follow`
- No longer preloads links with unsafe HTTP methods


