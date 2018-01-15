Changelog
=========

Changes to this project will be documented in this file.

This project mostly adheres to [Semantic Versioning](http://semver.org/).



0.51.1
------

### Fragment updates

- Fix a bug where Unpoly would crash when replacing a fragment with a `<script>` tag with a later sibling element.



0.51.0
------

### Fragment updates

- `<script>` tags that were inserted by a fragment update are no longer executed. They are still executed during the initial page load. If you need a fragment update to call JavaScript code, call it from a compiler ([Google Analytics example](https://makandracards.com/makandra/41488-using-google-analytics-with-unpoly)).
- The configuration option `up.dom.config.runInlineScripts` has been removed without replacement.
- The configuration option `up.dom.config.runLinkedScripts` has been removed without replacement.
- Fix a bug where the contents of `<noscript>` tags were parsed into DOM elements (instead of a single verbatim text node). This was confusing libraries that work with `<noscript>` tags, such as [lazysizes](https://github.com/aFarkas/lazysizes).
- Work around a [bug in IE11 and Edge](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12453464/) where `<noscript>` tags that were inserted by a fragment update could not be found with jQuery or `document.querySelectorAll()`.



0.50.2
------

### Fragment updates

- Updating fragments is now much faster when no [`[up-keep]`](/up-keep) elements are involved.

### Scrolling

- [`up.reveal()`](/up.reveal) no longer crashes when called with a CSS selector or non-jQuery element.
- [`up.reveal()`](/up.reveal) now returns a rejected promise when no viewport could be found for the given element.

### Links

- [`[up-expand]`](/up-expand) now ignores clicks on [form fields](/up.form.config#config.fields). This is useful e.g. when `up-expand`ing a table row that contains both links and form fields.

### Network

- [`a[up-preload]`](/a-up-preload) will no longer preload a link when the user holds the Shift, Ctrl or Meta key while hovering.


0.50.1
------

### General

- Boolean HTML attributes are now also considered `true` if their values equal the attribute name, e.g. `up-keep="up-keep"` ([#36](https://github.com/unpoly/unpoly/issues/36))

### AJAX

- [`up.request()`](/up.request) now sends an `X-Requested-With: XMLHttpRequest` headers. This header is used by many server-side frameworks to detect an AJAX request. ([#42](https://github.com/unpoly/unpoly/issues/42))


0.50.0
------

This is a major update with some breaking changes. Expect a few more updates like this as we move closer to our 1.0 release in 2018.

### General

- jQuery 3 is now supported in addition to jQuery 1.9+ and jQuery 2.
- Unpoly now uses [native Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) instead of jQuery deferreds.
- You can now help improve Unpoly's documentation by clicking an *Edit this page* link on any [unpoly.com](https://unpoly.com/) subpage (like [`a[up-target]`](/a-up-target)).

### Browser support

- To enable support for Internet Explorer 11 you need to install a Polyfill for `Promise`. We recommend [ES6-promise](https://github.com/stefanpenner/es6-promise) (2.4 KB gzipped).
- Fix a bug where Unpoly would not boot on Safari 9 and 10 if the initial page was loaded with a `POST` method.

### AJAX

- Unpoly now uses [native XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) instead of `jQuery.ajax()`. If you have been hacking into Unpoly's networking through `jQuery.ajaxPrefilter()`, you must now use the [`up:proxy:load`](/up:proxy:load) event.
- [`up.ajax()`](/up.ajax) has been deprecated since its signature is incompatible with native promises. Please use [`up.request()`](/up.request) instead, whose promise fulfills with an [`up.Response`](/up.Response) object.
- The `up:proxy:received` event has been renamed to [`up:proxy:loaded`](/up:proxy:loaded).
- The [`up:proxy:load`](/up:proxy:load) event properties have changed. You can now access request properties through a key `{ request }`, e.g. `event.request.url`.
- The [`up:proxy:load`](/up:proxy:load) event can now be prevented to prevent a request from being sent to the network.
-  The [`up:proxy:load`](/up:proxy:load) event now allows listeners to change request headers by manipulating the `event.request.headers` object.
- A new event [`up:proxy:fatal`](/up:proxy:fatal) will be [emitted](/up.emit) when an [AJAX request](/up.request) encounters fatal error like a timeout or loss of network connectivity.

### Links

- Links with unsafe HTTP methods like `POST` are no longer marked as [`.up-current`](/a.up-current), even if their `[href]` matches the current URL.
- New experimental function [`up.link.isSafe()`](/up.link.isSafe). It returns whether the given link has a [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1) HTTP method like `GET`.

### Fragment updates

- When a selector was not found in the response, the error notification now offers a link to show the unexpected response.
- The event [`up:fragment:destroy`](/up:fragment:destroy) can no longer be prevented.

### History

- Clicking a link with an [`[up-restore-scroll]`](/a-up-target#up-restore-scroll) attribute will no longer crash if no previous scroll position for given URL is known ([#25](https://github.com/unpoly/unpoly/issues/25))
- Fix a bug where going back in history would sometimes not call destructors ([#24](https://github.com/unpoly/unpoly/issues/24))

### Forms

- [`up.observe()`](/up.observe) no longer sends multiple callbacks when a previous callback was slow to respond.

### Tooltips

- Fix a bug where tooltips would sometimes stay open when many tooltips are opened and closed concurrently.

### Server protocol

- When the server [signals a redirect with a `X-Up-Location` header](/up.protocol#redirect-detection), sending a `X-Up-Method` header is now optional. If it is missing, `GET` is assumed.
- Unpoly will often update a different selector in case the request fails. This second selector is now sent to the server as a `X-Up-Fail-Target` header.
- You can now [configure how CSRF tokens are sent your server-side framework](/up.protocol.config).
- CSRF tokens are no longer sent for cross-domain requests.

### Animation

- `up.motion.none()` has been removed without replacement. Just pass `false` or the string `'none'` to indicate a animation or transition which has no visual effects and completes instantly.
- [`up.motion.finish()`](/up.motion.finish) is now async. It returns a promise that fulfills when all animations are finished.
- [`up.motion.finish()`](/up.motion.finish) now also finishes animations in ancestors of the given element.

### Modals

- [`up.follow()`](/up.follow) will now open a modal if the given link has an [`[up-modal]`](/a-up-modal) attribute
- [`a[up-modal]`](/a-up-modal) links can now have an `[up-fail-target]` attribute to indicate which selector to replace for an non-200 response
- Fix a bug where preloading an up-modal link would create an invisible .up-modal container in the DOM.

### Popups

- [`up.follow()`](/up.follow) will now open a popup if the given link has [`[up-popup]`](/a-up-popup) attribute
- up-popup links can now have an up-fail-target attribute to indicate which selector to replace for an non-200 response
- Fix a bug where preloading an up-popup link would create an invisible .up-popup container in the DOM.
- [`up.popup.attach()`](/up.popup.attach) now throws an error if neither `{ url }` nor `{ html }` options are given.

### Events

- When async functions emit an event and that event is prevented, the async function now rejects with an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error).
- When async functions are called wth `{ confirm: true }` and the user denies confirmation, the async function now rejects with an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error).

### Utility functions

- [`up.util.setTimer()`](/up.util.setTimer) is now always async, even when called with a delay of `0` (zero). The function is now stable.
- `up.util.isHash()` has been removed without replacement. In your code you can replace `up.util.isHash(x)` with `up.util.isObject(x) && !up.util.isFunction(x)`.
- `up.util.resolvedDeferred()` has been removed without replacement. Use `Promise.resolve()` instead.
- `up.util.resolvedPromise()` has been removed without replacement. Use `Promise.resolve(`) instead.
- `up.util.rejectedPromise()` has been removed without replacement. Use `Promise.reject()` instead.
- `up.util.unresolvableDeferred()` has been removed without replacement. Use `new Promise(function() {})` instead.
- `up.motion.when()` has been removed without replacement. Use `Promise.all()` instead.
- [`up.util.isString()`](/up.util.isString) now also returns true for `String` instances (in addition to string literals)
- [`up.util.isNumber()`](/up.util.isNumber()) now also returns true for `Number` instances (in addition to number literals)

### Ruby on Rails bindings

- New method `up.fail_target` available in controllers, helpers and views. It returns the selector targeted for a failed response.
- New method `up.fail_target?(target)` available in controllers, helpers and views. It returns whether the given selector is targeted for a failed response.
- New method `up.any_target?(target)` available in controllers, helpers and views. It returns whether the given selector is targeted for a either a successful or failed response.



0.37.0
------

### Compatible changes

- Fix a bug where [replacing](/up.replace) the `<body>` element would not trigger [destructor functions](/up.compiler#cleaning-up-after-yourself) in the old `<body>`.
- Fix a bug where [`[up-layer]`](/up-layer) attributes or `{ layer }` options were ignored.
- [`a[up-target]`](/a-up-target) and [`form[up-target]`] get a new modifying attribute `[up-fail-layer]`.
  Use it to set the layer to update if the server sends a non-200 status code. Valid values are `auto`, `page`, `modal` and `popup`.
- JavaScript functions like [`up.replace()`](/up.replace) or [`up.submit()`](/up.submit) now have a `{ failLayer }` option.


0.36.2
------

### Compatible changes

- [Validating forms](https://unpoly.com/input-up-validate) will no longer change the scroll position.


0.36.1
------

### Compatible changes

- [npm package](/install/npm) now expresses Unpoly's dependency on `jquery`.
- [Modals](/up.modal) no longer close when clicking an element that exists outside the modal's DOM hierarchy.
- Fix a bug on IE11 where modals would immediately close after opening if the opening link had an [`[up-instant]`](/a-up-instant) attribute and the destination page was already cached.


0.36.0
------

### Compatible changes

- The [`[up-observe]`](/up-observe) attribute can now be set on a `<form>` to run a function if any
  contained input field changes.
- Fix a bug where [`[up-autosubmit]`](/form-up-autosubmit) didn't honor an `[up-delay]` attribute if
  used on a form.
- When [submitting a form](/form-up-target), the `name` and `value` of the submit button is now included with the form parameters.
- [Going back in history](/up.history) after a [fragment update](/up.link) now always restores elements the page layer, never a selector in [modals](/up.modal) or [popups](/up.popup).
- [Going back in history](/up.history) now always closes a [modal](/up.modal) or [popup](/up.popup).
- Switch to [unpkg](https://unpkg.com) as our [CDN](/install/cdn).


0.35.2
------

### Compatible changes

- `unpoly-rails` now supports Rails 5


0.35.1
------

### Compatible changes

- Fix a bug where an Unpoly app would crash when embedded as an `<iframe>` if the user blocks third-party cookies and site data
- Fix a bug where the `up` global wasn't registered on `window` when using Webpack


0.35.0
------

### Compatible changes

- Remove a use of global `$` that prevented Unpoly from being used with with [`jQuery.noConflict()`](https://api.jquery.com/jquery.noconflict/).
- Fix a bug where replacing the `<body>` element would lose the body class and other attributes
- Fix a bug where Unpoly would set the document title to a `<title>` tag of an inline SVG image.


### Incompatible changes

- Drop support for IE 9, which hasn't been supported on any platform since January 2016.
- Drop support for IE 10, which hasn't been supported since January 2016 on any platform except
  Windows Vista, and Vista is end-of-life in April 2017.


0.34.2
------

### Compatible changes

- The scroll positions of two [viewports](/up-viewport) with the same selector is now restored correctly when going back in history.
- Fix a bug where new modals and popups would sometime flash at full opacity before starting their opening animation.


0.34.1
------

### Compatible changes

- Elements with [`up-show-for`](/up-show-for) and [`up-hide-for`](/up-hide-for) attributes
  can now be inserted dynamically after its controlling [`up-switch`](/input-up-switch) field has been
  compiled.
- Unpoly no longer strips a trailing slash in the current URL during startup


0.34.0
------

### Compatible changes

- During the initial page load Unpoly now [reveals](/up.reveal) an element matching the
  `#hash` in the current URL.

  Other than the default behavior found in browsers, `up.revealHash` works with
  [multiple viewports](/up-viewport) and honors [fixed elements](/up-fixed-top) obstructing the user's
  view of the viewport.
- New experimental function [`up.layout.revealHash()`](/up.layout.revealHash).
- The optional server protocol is now [documented](/up.protocol).
  The protocol is already implemented by the [`unpoly-rails`](https://rubygems.org/gems/unpoly-rails) Ruby gem.
- New experimental property [`up.protocol.config`](/up.protocol.config).
- [`up.browser.isSupported()`](/up.browser.isSupported) has been promoted from experimental to stable API


### Breaking changes

- `up.proxy.config.wrapMethodParam` is now [`up.protocol.config.methodParam`](/up.protocol.config#config.methodParam).
- The event [`up:history:restored`](/up:history:restored) is no longer emitted when a history state
  was not created by Unpoly.


0.33.0
------

### Compatible changes

- When a fragment updates cannot find the requested element, you can now define a fallback selector to use instead.

  A `{ fallback }` option has been added to all Javascript functions that update fragments, like [`up.replace()`](/up.replace).

  Also an `[up-fallback]` attribute has been added to all CSS selectors that update fragments, like for [`a[up-target]`](/a-up-target).

  You can also define fallbacks globally using the [`up.dom.config`](/up.dom.config) property.
- Unpoly no longer crashes when a request fails due to a timeout or network problem. In such cases, async functions (like [`up.replace()`](/up.replace)) will leave the page unchanged and  reject the returned promise.
- Functions that make a request (like [`up.replace()`](/up.replace) or like [`up.ajax()`](/up.ajax)) now accept a new option `{ timeout }`.
- [Modals](/up.modal) no longer create an `.up-modal` element when the server returns a non-200 status and the `{ failTarget }` is replaced instead
- [Popups](/up.popup) no longer create an `.up-popup` element when the server returns a non-200 status and the `{ failTarget }` is replaced instead
- Improve performance when updating fragments without transitions
- When updating the `body` element with a transition, that transition is now silently ignored instead of throwing an error.
- [`up.util.resolvedPromise()`](/up.util.resolvedPromise) now accepts arguments which will become the resolution values.
- [`up.util.resolvedDeferred()`](/up.util.resolvedDeferred) now accepts arguments which will become the resolution values.
- New utility method [`up.util.rejectedPromise()`](/up.util.rejectedPromise).
- [`up.first()`](/up.first) has new option `{ origin }`. You can use it provide a second element or selector that can be referenced as `&` in the first selector:

      $input = $('input.email');
      up.first('.field:has(&)', $input); // returns the .field containing $input
- Fix a bug where the document title wasn't restored when the user uses the back button
- When [revealing a page fragment](/up.reveal), Unpoly will include the element's top and bottom margin in the area that should be revealed.


### Breaking changes

- [`up.replace()`](/up.replace) now returns a rejected promise if the server returns a non-200 status code.
- `up.util.merge()` has been replaced by [`up.util.assign()`](/up.util.assign), which no longer makes exceptions for `null` and `undefined` property values. This behaves like [`Object.assign`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
- The `up.flow` module has been renamed to [`up.dom`](/up.dom).
- The `up.navigation` module has been renamed to [`up.feedback`](/up.feedback).
- Functions that measure position, dimensions or margin now return floats instead of rounded integers.


0.32.0
------

### Compatible changes

- Fix a bug where morphing an [`[up-keep]`](/up-keep) element with a destructor would throw an error.
- Fix a bug where an [`[up-keep]`](/up-keep) element would lose its jQuery event handlers when it was kept.
- Fix a bug where [`up.log.disable()`](/up.log.disable) did not persist through page reloads.
- Fix a bug where [`up.reveal()`](/up.reveal) would scroll too far if the viewport has a `padding-top`.
- Fix a bug where [`up.reveal()`](/up.reveal) would not scroll to an element at the bottom edge of the visible area
  if [`up.layout.config.snap`](/up.layout.config) is set.
- Several features have been promoted from experimental API to stable API:
  - [`[up-drawer]`](/a-up-drawer)
  - [`up.syntax.data()`](/up.syntax.data)
  - [`up.extract()`](/up.extract)
- When [targeting](/up-target) an URL with a #hash, the viewport will now scroll to the first row of an element
  with that ID, rather than scrolling as little as possible.


### Breaking changes

- [Modals](/up.modal) can no longer grow wider than the screen
- The spacing around a modal dialog is longer implemented as a `margin` of `.up-modal-dialog`.
  It is now a padding of `.up-modal-viewport`. This makes it easier to set the `width` or `max-width` of the dialog box.

  If your project has custom Unpoly styles, you should grep your CSS files for changes to the `margin`
  of `.up-modal-dialog` and set it as a `padding` on `.up-modal-viewport[flavor=default]` instead.


0.31.2
------

### Compatible changes

- Unpoly can now be installed as an npm module called `unpoly`.


0.31.0
------

### Compatible changes

- Drawers are now a built-in modal flavor! Use the [`[up-drawer]`](/a-up-drawer) attribute to open page fragements
  in a modal drawer that slides in from the edge of the screen.


### Breaking changes

- The [`up.modal.flavor()`](/up.modal.flavor) function was deprecated. Set values on the
  [`up.modal.flavors`](/up.modal.flavors) property instead.


0.30.1
------

### Compatible changes

- Fix [`up.observe()`](/up.observe) not honoring `{ delay }` option
- Fix [`[up-observe]`](/up-observe) not honoring `[up-delay]` modifier
- Fix many issues with concurrency and slow server responses for [`up.observe()`](/up.observe) and [`[up-observe]`](/up-observe)



0.30.0
------

### Breaking changes

- If you are using Unpoly's Boostrap integration, you now need to include `unpoly-bootstrap3.js` *after* you include the Bootstrap CSS.
- Fix some issues when using Unpoly together with Bootstrap modals.



0.29.0
------

### Compatible changes

- [`up.popup.attach()`](/up.popup.attach) now has a `{ html }` option. This allows you to extract popup contents
  from a HTML string without making a network request.
- [`up.tooltip.attach()`](/up.tooltip.attach) now has a `{ text }` option which automatically escapes the given string.
- Fix a bug on Firefox where the page width would jump by the scrollbar width when opening a modal.
- Fix a bug where modals would close when following a link to a cached destination.

### Breaking changes

- Events handled by Unpoly selectors will no longer bubble up the DOM.


0.28.1
------

### Compatible changes

- [`up.tooltip.attach()`](/up.tooltip.attach) now has a `{ text }` option which automatically escapes the given string.
- Fix a bug where Unpoly would hang when parsing a page with a `<head>` but without a `<title>`


0.28.0
------

### Compatible changes

- The error notification is now easier to read and can be closed.
- When a target selector was not found in the response, the error notification now offers a link to re-request the response for inspection.
- [Compilers](/up.compiler) can now return an array of functions that will *all* be called when the element is destroyed.
- [`up.observe()`](/up.observe) now works on checkboxes and radio buttons.
- [`up.observe()`](/up.observe) can now be called with multiple form fields, or any container that contains form fields.
- When opening a [modal](/up.modal) you can now pass an option `{ closable: false }` or set an `up-closable='false'` attribute
  This lets you disable the default methods to close a modal (close button, clicking on the backdrop, pressing ESC).
  You can also configure this globally by setting [`up.modal.config.closable`](/up.modal.config).
- Fix a bug where [`up.observe(form, options)`](/up.observe) would not respect options.
- Fix a bug where [`up.autosubmit(form)`](/up.autosubmit) was not published.
- Fix a bug where falling back to non-AJAX page loads on old browsers would not work

### Breaking changes

- `up.error()` has been renamed to [`up.fail()`](/up.fail) in order to prevent confusion with [`up.log.error()`](/up.log.error).


0.27.3
------

### Compatible changes

- [Popups](/up.popup) and [modals](/up.modal) will no longer try to restore a covered document title
  and URL if they were opened without pushing a history entry.
- When fragments are [replaced](/up.replace) without pushing a new history entry,
  the document title will no longer be changed by default.


### Breaking changes

- The `{ url }` option for [`up.destroy()`](/up.destroy) has been renamed to `{ history }` to be more
  in line with [`up.replace()`](/up.replace).


0.27.2
------

### Compatible changes

- Fix a bug where the back button would not work if the document contained carriage returns (`\r`).
- Fix a bug where auto-closed modals and popups would overwrite a changed
  browser location with their cached "covered URL"


### Breaking changes

- Links with [`up-target`](/up.target) now prefer to update elements within their own layer (page, modal, or popup).
  Only when the target element doesn't exist within the link's layer, Unpoly will look through all layers
  from top to bottom.



0.27.1
------

### Compatible changes

- Fix a bug where absolutely positioned elements would be offset incorrectly during transitions
- Fix a bug where inserted elements were not revealed within their viewport
- When [validating](/input-up-validate) a form with transitions, transitions are no longer applied


### Breaking changes

- When [replacing](/up.replace) multiple page fragments at once, only the first fragment is revealed within its viewport


0.27.0
------

### Compatible changes

- Calling [`up.log.enable()`](/up.log.enable) will now keep logging enabled for the remainder of this
  browser session (and persist through page reloads).
- Added experimental events to observe history changes: [`up:history:push`](/up:history:push) (preventable), [`up:history:pushed`](/up:history:pushed) and [`up:history:restored`](/up:history:restored)
- Fix a bug where prepending or appending multiple elements with `:before` / `:after` pseudo-classes
  would not work correctly in tables.
- Fix a bug where calling [`up.animate()`](/up.animate) with `{ duration: 0 }` would return a promise
  that never resolved.
- A click on the page body now closes the popup on `mousedown` instead of `click`.
  This fixes the case where an `[up-instant]` link removes its parent and thus a `click` event never bubbles up to the body.
- When opening a modal, elements behind the dialog can now be moved correctly when scrollbars have custom styles on `::-webkit-scrollbar`.
  To take advantage of this, make sure to also style scrollbars on elements with an [`[up-viewport]`](/up-viewport) attribute.
- Fix a bug where [`up.tooltip.config`](/up.tooltip.config) was not publicly acccessible.
- Fix a bug where [`up.tooltip.isOpen()`](/up.tooltip.isOpen) was not publicly acccessible.
- New [tooltip configuration options](/up.tooltip.config): `config.openDuration`, `config.closeDuration`, `config.openEasing`, `config.closeEasing`
- Opening/closing many tooltips concurrently now behaves deterministically.
- Opening/closing many popups concurrently now behaves deterministically.
- Opening/closing many modals concurrently now behaves deterministically.
- IE9 fixes: Polyfill `window.console` and several properties (`log`, `debug`, `info`, `warn`, `error`, `group`, `groupCollapsed`, `groupEnd`)


### Breaking changes

- Tooltips now open and close much quicker.
- Popups now open and close much quicker.
- [`.up-current`](/a.up-current) now considers two URLs different if they have different query strings.



0.26.2
------

### Compatible changes

- Popups anchored to fixed elements are now positioned correctly if the document is scrolled
- Tooltips can now be anchored to fixed elements
- [`up-modal`](/a-up-modal) and [`up-popup`](/a-up-popup) now support an `up-method` modifier.



0.26.1
------

### Breaking changes

- When inserting a page fragment with a `<script src="...">` tag, the linked JavaScript is no longer loaded and executed. Inline scripts will still be executed. You can configure this behavior using the new [`up.flow.config`](/up.flow.config) property.



0.26.0
------

### Compatible changes

- [Popups](/up.popup) no longer scroll with the document if they are attached to an element with `position: fixed`
- [Tooltips](/up.tooltip) no longer flicker if an [`[up-tooltip]`](/up-tooltip) elements has children
- [Tooltips](/up.tooltip) no longer flicker if the user moves the mouse too close to the tooltip triangle
- Before [compiling](/up.compile) the body, Unpoly now explicitly waits until user-provided compiles have been registered and the DOM is ready.
- Debugging messages in the developer console are now disabled by default. Call [`up.log.enable()`](/up.log.enable) to get them back.
- New configuration options in [`up.log.config`](/up.log.config): `up.log.config.enabled`, `up.log.config.collapse` and
  `up.log.config.prefix`.
- Improve formatting of error messages.
- New experimental utility function [`up.util.escapeHtml()`](/up.util.escapeHtml).
- If an error is thrown before the document is ready, Unpoly now waits until the document is ready before showing the red error box.



0.25.2
------

### Compatible changes

- Fix a bug where [submitting a form](/form-up-target) with file uploads would throw an error `"Cannot convert FormData into a query string"`



0.25.1
------

### Compatible changes

- Fix a bug where [`up.ajax()`](/up.ajax) would incorrectly re-use form responses even if the form data differed
- Fix a bug with the [`up-observe`](/up-observe) UJS attribute throwing an error when used
- Fix a bug where if multiple compilers with [destructors](/up.compiler#cleaning-up-after-yourself)
  are applied to the same element and the element is removed, only the last destructor was called.


0.25.0
------

### Compatible changes

- New modal default [`up.modal.config.sticky`](/up.modal.config)
- New experimental function [`up.modal.flavor()`](/up.modal.flavor) to register modal variants (like drawers).
- Fix a bug where [compilers](/up.compiler) and [macros](/up.macro) with higher priorities were executed last (instead of first like it says in the docs).
- Fix a bug that would occur if two compiled elements, that were nested within each other, would raise an error if the outer element was destroyed and both compilers have destructor functions.
- Fix a bug where replacing the `body` tag would raise an error if any element in the old `<body>` had a destructor function.
- The promise returned by [`up.replace()`](/up.replace) now waits for transitions to complete before resolving
- Fix a bug where an error would be shown when opening a modal while another modal was still loading
- Fix a bug where two popups would be shown when opening a popup while another popup was still loading
- New options for [up.popup.config](/up.popup.config):
  - `up.popup.config.openDuration`
  - `up.popup.config.closeDuration`
  - `up.popup.config.openEasing`
  - `up.popup.config.closeEasing`
- Modals now longer addsa right padding to the `<body>` if the document has no vertical scroll bars
- Animations now wait until the browser signals completion of the CSS transition. Previously
  animations were canceled after its duration, which might or might not have matched to the actual
  last animation frame.

### Breaking changes

- When opening a modal while another modal is open, the first modal will be closed (with animation) before the second modal opens (with animation)
- When opening a popup while another popup is open, the first popup will be closed (with animation) before the second popup opens (with animation)
- User-defined macros are now always run *before* built-in macros.
  This way you can set [`a[up-dash]`](/a-up-dash) and [`[up-expand]`](/up-expand) from your own macros.


0.24.1
------

### Compatible changes

- Fix a bug that would stop transitions from working.


0.24.0
------

### Compatible changes

- New function [`up.modal.extract()`](/up.modal.extract) to open a modal from an
  existing HTML string.
- [`up.ajax()`](/up.ajax) now also accepts the URL as a first string argument.
- [Expanded](/up.expand) links to modals or popups now get a pointer cursor via CSS
- New options for [up.modal.config](/up.modal.config):
  - `up.modal.config.openDuration`
  - `up.modal.config.closeDuration`
  - `up.modal.config.openEasing`
  - `up.modal.config.closeEasing`
  - `up.modal.config.backdropOpenAnimation`
  - `up.modal.config.backdropCloseAnimation`
  - Also see the breaking changes regarding modal structure below.
- Calling [`up.motion.finish()`](/up.motion.finish) without arguments will now
  complete all animations and transitions on the screen.
- Fix a bug where [`up.motion.finish()`](/up.motion.finish) would not cancel CSS transitions that were still in progress.
- Fix a bug where [`up-active`](/a.up-active) classes where not removed from links when the destination
  was already [preloaded](/up.preload).


### Breaking changes

- Animations when opening or closing a [modal](/up.modal) now only affect the viewport around the dialog.
  The backdrop is animated separately. This allows animations like "zoom in", which would look strange if
  the backdrop would zoom in together with the dialog.
- The modal's HTML structure has been changed to include a `.up-modal-backdrop` element:

  ```
  <div class="up-modal">
  <div class="up-modal-backdrop">
  <div class="up-modal-viewport">
    <div class="up-modal-dialog">
      <div class="up-modal-content">
        ...
      </div>
      <div class="up-modal-close" up-close>X</div>
    </div>
  </div>
  </div>
  ```

- The `z-index` properties for modal elements have been [changed](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/unpoly/modal.css.sass).
  They might change again in the future.
- The modal will now take over the document's scrollbars after the open animation has finished.
  In earlier versions the modal took over as soon as the animation had started.
- Calling [`up.motion.finish()`](/up.motion.finish) with an element will now also
  complete animations/transitions on children of the given element.


0.23.1
------

### Compatible changes

- [Animations](/up.motion) `move-to-*` and `move-from-*` now use CSS transforms instead of manipulating the
  bounding box margins.
- Fix [`up.util.trim()`](/up.util.trim) not working properly.
- [`up.morph()`](/up.morph) no longer throws an error if called without an `options` object
- Custom transitions can now call [`up.morph()`](/up.morph) to refer to other transitions
- Fix a bug where following a link to a [preloaded](/a-up-preload) destination would keep the
  link marked with a [up-active](/a.up-active) class forever.


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
  had an [`up-dash`](/a-up-dash) attribute without a value and also an `up-target` attribute.
- Fix a bug where a link would be followed multiple times if the link's
  click area was expanded using [`[up-expand]`](/up-expand) and if the
  link also had an [`up-dash`](/a-up-dash) attribute.
- [`up.destroy()`](/up.destroy) now returns a resolved deferred if the given selector or jQuery collection does not exist


0.22.0
------

### Compatible changes

- Fix a bug where using the `up-confirm` attribute would result in an infinite loop
- Unpoly no longer displays confirmation dialogs when [preloading](/a-up-preload) a link that
  has both [`up-preload`](/a-up-preload) and `up-confirm` attributes.


### Breaking changes

- `up.proxy.idle()` is now [`up.proxy.isIdle()`](/up.proxy.isIdle)
- `up.proxy.busy()` is now [`up.proxy.isBusy()`](/up.proxy.isBusy)
- Event `up:proxy:busy` is now [`up:proxy:slow`](/up:proxy:slow)
- Event `up:proxy:idle` is now [`up:proxy:idle`](/up:proxy:recover)


0.21.0
------

### Compatible changes

- New function `up.macro()`. This registers a [compiler](/up.compiler) that is run before all other compilers.
- [`up.compiler()`](/up.compiler) has a new options `{ priority }`. Compilers with higher priorities are run first.
- Fix a bug where trying to apply another transition on an element could throw a *Maximum call stack exceeded*
    error if the element was already transitioning.

### Breaking changes

- `up-toggle` has been renamed to `up-switch`


0.20.0
------

- The project has been renamed to *Unpoly*.
- All functions remain in the `up` namespace, so e.g. `up.replace()` is still called `up.replace()`.
- All UJS functionality remains unchanged, so e.g. `up-target` is still called `up-target`.
- The Bower package has been renamed to `unpoly`.
- The Ruby gem for the Rails bindings has been renamed to `unpoly-rails`.
- The new JavaScript and stylesheet assets are:
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
- `up.proxy.ajax()` is now available as [`up.ajax()`](/up.ajax).
- `up.ajax()` can now handle nested objects as `{ data }` option (used to pass form parameters).

### Breaking changes

- `up.implant()` has been renamed to [`up.extract()`](/up.extract).


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
- New function [`up.off()`](/up.off). This unregisters an event listener previously bound with [`up.on()`](/up.on).
- If a container contains more than one link, you can now set the value of the [`up-expand`](/up-expand)
  attribute to a CSS selector to define which link should be expanded.
- You can now configure a list of safe HTTP methods in [`up.proxy.config.safeMethods`](/up.proxy.config).
  The proxy cache will only cache safe requests and will clear the entire
  cache after a unsafe request.
- Loading modals and popups will now open if there is a fragment update between the modal/popup's
  request and response.
- [`up.follow()`](/up.follow) and [`up.replace()`](/up.replace) now have an option `{ failTarget }`.
  Use it to define the selector to replace if the server responds with a non-200 status code.
- [`[up-target]`](/a-up-target) and [`up-follow`](/a-up-follow) now have a modifying attribute `up-fail-target`.
  Use it to define the selector to replace if the server responds with a non-200 status code.
- New utility method [`up.util.reject()`](/up.util.reject)
- New utility method [`up.util.only()`](/up.util.only)
- New utility method [`up.util.except()`](/up.util.except)
- Fix a bug where modals could no longer be opened on some browsers
- When preventing an event emitted by an async function, that function now rejects its promise.
- Async functions that encounter an error now prefer to reject promises with an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object (instead of a string with the error message)

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
- [`a[up-instant]`](/a-up-instant) now works with modals and popups
- [`[up-expand]`](/up-expand) now works with modals and popups

### Breaking changes

- When [`up.observe()`](/up.observe) is used with a delay of zero, the callback is invoked instantly (instead of
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
- [`up.popup.attach()`](/up.popup.attach) now throws a helpful error when trying to attach a popup to a non-existing element
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

- New function [`up.autosubmit()`](/up.autosubmit) and selector [`[up-autosubmit]`](/form-up-autosubmit) to
  observe a form or field and submit the form when a value changes.
- [`up.observe()`](/up.observe) and [`[up-observe]`](/up-observe) can now be applied
  to `<form>` tags. The callback is run when any field in the form changes.
- New function [`up.browser.canPushState()`](/up.browser.canPushState) to detect
  if the browser supports `history.pushState`.
- New function [`up.browser.canCssTransition()`](/up.browser.canCssTransition) to
  detect if the browser supports animation with CSS transitions.
- New function [`up.browser.canInputEvent()`](/up.browser.canInputEvent) to
  detect if the browser supports the `input` event.
- Allow to [configure a default delay](/up.form.config) for [`up.observe()`](/up.observe).
- [Popups](/up.popup) now have events [`up:popup:open`](/up:popup:open),
  [`up:popup:opened`](/up:popup:opened), [`up:popup:close`](/up:popup:close)
  and [`up:popup:closed`](/up:popup:closed).
- The destructor returned by [`up.observe()`](/up.observe) now properly unregisters
  event listeners.

### Breaking changes

- [`up.observe()`](/up.observe) now takes the callback function as a last argument.
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
  using the [`[up-validate]`](/input-up-validate) selector.
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

- `up.bus.emit()` is now [`up.emit()`](/up.emit)
- When `up.first()` finds no match, return `undefined` instead of `null`.


0.12.1
------

### Compatible changes

- `up.on()` now returns a function that unbinds the events when called
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
- Renamed `up.ready()` to `up.hello()`. This will emit an `up:event:inserted` event for the given element,
  causing it to be compiled etc.
- `up.popup.open()` has been renamed to `up.popup.attach()`.
- `up.modal.open()` has been split into two methods `up.modal.visit(url)` and `up.modal.follow($link)`.
- `up.tooltip.open()` has been renamed to `up.tooltip.attach()`.
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
- Expose `up.error()` as public API. This prints an error message to the error console and throws a new `Error` with that message.
- Fix a million bugs related to compatibility with IE9 and IE10


0.11.0
------

### Compatible changes

- Rework the scrolling implementation so we don't need to scroll elements to the top before replacing them.
- `up.ajax()` now only caches responses with a status code of `200 OK`
- When a link with an `[up-close]` attribute is clicked, the link's default action will only be prevented
  if the link was actually within a modal or popup.
- When revealing an element, Up will now compute the correct element position if there are
  additional positioning contexts between the viewport and the element
- New option "top" for `up.reveal()`: Whether to scroll the viewport so that the first element row aligns with
  the top edge of the viewport. Without this option, `up.reveal()` scrolls as little as possible.
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
  direct calls of [`up.replace()`](/up.replace) no longer do.
  This behavior can be activated using the `{ reveal: true }` option.

### Compatible changes

- Options to control scrolling and cache use for
  [`up.submit()`](/up.submit),
  [`up.follow()`](/up.follow),
  [`up.visit()`](/up.visit),
  [`form[up-target]`](/form-up-target) and
  [`a[up-target]`](/a-up-target).


0.10.1
------

### Breaking changes

- [`up.reveal()`](/up.reveal) now only reveals the first 150 pixels of an element.


0.10.0
-------

### Compatible changes

- Viewport scroll positions are saved when the URL changes and restored when the user hits the back/forward button
- Allow to link to the previous page using [`[up-back]`](/a-up-back)
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
- You can now make [`up.reveal()`](/up.reveal) aware of fixed navigation bars blocking the viewport by setting new options `up.layout.defaults('fixedTop')` and `up.layout.defaults('fixedBottom')`.


0.8.2
-----

### Compatible changes

- [`up.reveal()`](/up.reveal) can now reveal content in modals and containers with `overflow-y: scroll`.
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

- Unpoly will now emit [events](/up.bus) `proxy:busy` and `proxy:idle` whenever it is loading or is done loading content over HTTP.
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

- Use [up.proxy](/up.proxy) when submitting a form.


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

- Rename method `up.awaken()` to `up.compiler()`


0.6.2
-----

### Compatible changes

- Option to have a custom HTTP method for `up.follow()`
- No longer preloads links with unsafe HTTP methods


