# up.framework

Features to control when Unpoly boots.

By default Unpoly boots on `DOMContentLoaded`, after your own scripts have had a chance to configure it and register compilers. You rarely need this namespace. Boot manually with `up.boot()` only when you load Unpoly with `<script async>`, or when you set `[up-boot=manual]` on the `<html>` element and boot later yourself. `up.framework.isSupported()` returns whether Unpoly can boot in the current browser. On an unsupported browser Unpoly stays inactive, leaving a server-side web application without JavaScript enhancements.

@namespace up.framework

-----

# up.framework.booted

Whether Unpoly has finished booting.

Compilers may query this property to check if the initial page is being compiled
(as opposed to a subsequent fragment update).

@property up.framework.booted
@param {boolean} boolean
@experimental

-----

# up.framework.reset()

Resets Unpoly to the state when it was booted.
All custom event handlers, animations, etc. that have been registered
will be discarded.

Emits event [`up:framework:reset`](/up:framework:reset).

@function up.framework.reset
@internal

-----

# up:framework:reset

This event is [emitted](/api/up.emit) when Unpoly is [reset](/up.framework.reset) during unit tests.

@event up:framework:reset
@internal

-----

# up.boot()

Manually boots the Unpoly framework.

It is not usually necessary to call `up.boot()` yourself. When you load [Unpoly's JavaScript file](/learn/install),
Unpoly will automatically boot on [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event).
There are only two cases when you would boot manually:

- When you load Unpoly with `<script async>`
- When you explicitly ask to manually boot by setting an [`<html up-boot="manual">`](/api/up-boot-manual) attribute.

Before you manually boot, Unpoly should be configured and compilers should be registered.
Booting will cause Unpoly to [compile](/api/up.hello) the initial page.

Unpoly will refuse to boot if the current browser is [not supported](/api/up.framework.isSupported).
This leaves you with a classic server-side application on legacy browsers.

@function up.boot
@experimental
@signature

-----

# up:framework:booted

This event is emitted after Unpoly has [booted](/api/up.boot).

@learn-ref install

For most apps this event will be emitted in the same [task](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
as [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event).
All [compilers](/api/up.script) will already have run on the initial page content.

@event up:framework:booted
@param {string} event.mode
  A string indicating what caused Unpoly to boot.

  If set to `'auto'`, Unpoly was booted automatically on `DOMContentLoaded`.

  If set to `'manual'`, Unpoly was booted [manually](/api/up-boot-manual).

  @experimental
@experimental

-----

# .up-booted

This class is set on the `<html>` element after Unpoly has [booted](/api/up.boot).

@learn-ref switching-form-state#before-booting

All [compilers](/api/up.script) will already have run on the initial page content.

You can use this class to hide elements until Unpoly has processed them,
e.g. to [hide switched elements before booting](/learn/switching-form-state#before-booting):

```css
html:not(.up-booted) :is([up-show-for], [up-hide-for]) {
  display: none;
}
```

The class is not set when Unpoly [cannot boot](/api/up.framework.isSupported) or fails to load.
Elements hidden by such a rule would then stay hidden.

@selector .up-booted
@experimental

-----

# [up-boot=manual]

Prevent Unpoly from booting automatically.

@learn-ref install

By default Unpoly [automatically boots](/learn/install#initialization)
on [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event).
To prevent this, add an `[up-boot="manual"]` attribute to the `<html>` element:

```html
<html up-boot="manual"> <!-- mark: up-boot="manual" -->
  ...
</html>
```
You may then call `up.boot()` to manually boot Unpoly at a later time.

@selector [up-boot=manual]
@experimental
@signature

-----

# up.framework.isSupported()

Returns whether Unpoly can boot in the current browser.

If this returns `false` Unpoly will not automatically [boot](/api/up.boot)
and will not [compile](/learn/enhancing-elements) the initial page.
This leaves you with a server-side web application without any JavaScript enhancements.

The support check is very cursory. While it will exclude most legacy browsers
like Internet Explorer, there may be cases where `up.framework.isSupported()`
returns `true` on a browser with other support issues.
To use your own conditions for browser support, [boot manually](/api/up-boot-manual).

### Browser support

Unpoly aims to support all modern browsers.

#### Chrome, Firefox, Microsoft Edge

Unpoly supports recent versions of these [evergreen](https://stephenweiss.dev/evergreen-browsers) browsers.

#### Safari, Mobile Safari

Unpoly supports the last two major versions of Safari.

#### Internet Explorer

Internet Explorer 11 or lower is [no longer supported](https://github.com/unpoly/unpoly/discussions/340).

If you need to support Internet Explorer 11, use Unpoly 2.

@function up.framework.isSupported
@stable
@signature
