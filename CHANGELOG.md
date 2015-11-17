Changelog
=========

All notable changes to this project will be documented in this file.
This project mostly adheres to [Semantic Versioning](http://semver.org/).


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

- `up.bus.emit` is now [`up.emit`](http://upjs.io/up.emit/)
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

- Up.js can now be used with [`jQuery.noConflict()`](https://api.jquery.com/jquery.noconflict/).


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
  around. If you're using `up-bootstrap.js`, this will default to `['.navbar-fixed-top', '.navbar-fixed-bottom', '.footer']`.
- Fix a bug in `upjs-rails` where the gem would fail to `include` itself in some versions
  of Ruby and Rails.


### Breaking changes

- Interactions that would result in an URL change ("pushState") now fall back to a full page load
  if Up.js was booted from a non-GET request. [More information about the reasons for this](https://github.com/makandra/upjs/commit/d81d9007aa3bfae0fca8c55a71d180d1044acae5).

  This currently works out of the box if you're using Up.js via the `upjs-rails` Rubygem.
  If you're integrating Up.js with Bower or manually, you need to have your server app
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
- New option `up.layout.defaults('snap')` lets you define a number of pixels under which Up.js will snap to the top edge of the viewport when revealing an element
- You can now make [`up.reveal`](/up.reveal) aware of fixed navigation bars blocking the viewport by setting new options `up.layout.defaults('fixedTop')` and `up.layout.defaults('fixedBottom')`.


0.8.2
-----

### Compatible changes

- [`up.reveal`](/up.reveal) can now reveal content in modals and containers with `overflow-y: scroll`.
- Changing the default configuration of an Up.js module now raises an error if a config key is unknown.
- Links linking to `"#"` are now never marked as `.up-current`.


0.8.1
-----

### Compatible chanes

- You can now include `up-bootstrap.js` and `up-bootstrap.css` to configure Up.js to play nice with Bootstrap 3.


### Breaking changes

- Like Bootstrap, the Up.js modal will now scroll the main document viewport instead of the modal dialog box.



0.8.0
-----

### Compatible changes

- Up.js will now emit [events](http://upjs.io/up.bus) `proxy:busy` and `proxy:idle` whenever it is loading or is done loading content over HTTP.
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

- Fix what Up.js considers the current URL of a modal or popup if multiple updates change different parts of the modal or popup.
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

- Use [up.proxy](http://upjs.io/up.proxy) when submitting a form.


0.7.2
-----

### Compatible changes

- When marking links as `.up-current`, allow to additionally match on a space-separated list of URLs in an  `up-alias` attribute.


0.7.1
-----

### Compatible changes

- Bugfix: Don't consider forms with an `up-target` attribute to be a link.
