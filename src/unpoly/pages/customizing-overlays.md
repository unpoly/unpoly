Customizing overlays
====================

Overlays ship with minimal styling. When opening an overlay, you can pick a size,
assign a CSS class, position popups and drawers, and choose open and close animations.
Beyond that, you can override Unpoly's CSS or change the overlay's elements with JavaScript.


Picking a mode {#modes}
--------------

An overlay's default look and behavior come from its [mode](/overlays#layer-modes),
which is [chosen when the overlay is opened](/opening-overlays#modes).
Every customization below applies on top of a mode, so start with the mode closest to what you need.

Defaults for all overlays live in `up.layer.config.overlay`. Each mode has its own
defaults in `up.layer.config.modal`, `up.layer.config.drawer`, `up.layer.config.popup` and `up.layer.config.cover`.


Overlay sizes {#overlay-sizes}
-------------

To give an overlay a width, set an `[up-size]` attribute on the link that opens it:

```html
<a href="/terms" up-layer="new" up-size="large">Show terms</a> <!-- mark: up-size="large" -->
```

From JavaScript, pass a `{ size }` option to `up.layer.open()`.

When no size is given, the overlay is `medium`. A size sets the width of the overlay's box element.
The default widths are:

| Mode     | `small` | `medium` | `large`  | `full` | `grow`             |
|----------|--------:|---------:|---------:|-------:|--------------------|
| `modal`  | `350px` | `650px`  | `1000px` | `100%` | grows with content |
| `popup`  | `180px` | `300px`  | `550px`  | `100%` | grows with content |
| `drawer` | `150px` | `340px`  | `600px`  | `100%` | grows with content |
| `cover`  | -       | -        | -        | `100%` | -                  |

Regardless of size, an overlay never grows wider than the screen.

To change the width of a size, override Unpoly's CSS:

```css
up-modal[size=medium] up-modal-box {
  width: 500px;
}
```


Overlay classes {#overlay-classes}
---------------

To make a variant of a mode, like a modal with a warning color, set an `[up-class]` attribute
when opening the overlay:

```html
<a href="/confirm-erase" up-method="delete" up-layer="new" up-class="warning">Erase disk</a> <!-- mark: up-class="warning" -->
```

From JavaScript, pass a `{ class }` option to `up.layer.open()`.

The class is assigned to the overlay's container element:

```html
<up-modal class="warning"> <!-- mark: class="warning" -->
  ...
</up-modal>
```

You can now style warning modals in your CSS:

```css
up-modal.warning up-modal-box {
  background-color: #fff3cd;
}
```

To give every overlay a class, configure `up.layer.config.overlay.class`.


Popup position {#popup-position}
--------------

A popup is anchored to the link or button that opened it (the `{ origin }`).
By default it opens below that element, with their left edges aligned.
To change this, set `[up-position]` and `[up-align]` attributes on the opening link:

```html
<a href="/help" up-layer="new popup" up-position="top" up-align="right">Show help</a> <!-- mark: up-position="top" up-align="right" -->
```

From JavaScript, pass `{ position, align }` options to `up.layer.open()`.

The following combinations are supported:

| `{ position }` | `{ align }` | Effect                                                  |
|----------------|-------------|---------------------------------------------------------|
| `top`          | `left`      | Popup sits above the origin. Left edges align.          |
| `top`          | `right`     | Popup sits above the origin. Right edges align.         |
| `top`          | `center`    | Popup sits above the origin. Horizontal centers align.  |
| `bottom`       | `left`      | Popup sits below the origin. Left edges align.          |
| `bottom`       | `right`     | Popup sits below the origin. Right edges align.         |
| `bottom`       | `center`    | Popup sits below the origin. Horizontal centers align.  |
| `left`         | `top`       | Popup sits left of the origin. Top edges align.         |
| `left`         | `bottom`    | Popup sits left of the origin. Bottom edges align.      |
| `left`         | `center`    | Popup sits left of the origin. Vertical centers align.  |
| `right`        | `top`       | Popup sits right of the origin. Top edges align.        |
| `right`        | `bottom`    | Popup sits right of the origin. Bottom edges align.     |
| `right`        | `center`    | Popup sits right of the origin. Vertical centers align. |

To change the default for all popups, configure `up.layer.config.popup.position` and `up.layer.config.popup.align`.


Drawer position {#drawer-position}
---------------

By default a drawer slides in from the left edge of the screen.
To open it on the right edge, set an `[up-position="right"]` attribute:

```html
<a href="/settings" up-layer="new drawer" up-position="right">Settings</a> <!-- mark: up-position="right" -->
```

From JavaScript, pass a `{ position: 'right' }` option to `up.layer.open()`.
The drawer's open and close animations follow its position.

To open all drawers on the right, configure `up.layer.config.drawer.position`.


Open and close animations {#animation}
-------------------------

Overlays fade in and out by default. Drawers slide in from their screen edge.

To use different [animations](/animation) for one overlay, set `[up-animation]` and `[up-close-animation]`
attributes on the link that opens it:

```html
<a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-bottom"> <!-- mark: up-animation="move-from-top" up-close-animation="move-to-bottom" -->
  Open details
</a>
```

From JavaScript, pass `{ animation, closeAnimation }` options to `up.layer.open()`.
Both directions can also be timed with `[up-duration]`, `[up-easing]`, `[up-close-duration]` and `[up-close-easing]`
attributes, or the matching `up.layer.open()` options.

To change the defaults for all overlays, configure `up.layer.config.overlay.openAnimation`
and `up.layer.config.overlay.closeAnimation`. Each mode can override these in its own config,
like `up.layer.config.modal.openAnimation`.

A single call to `up.layer.accept()` or `up.layer.dismiss()` can also pick
[its own close animation](/closing-overlays#close-animation).


Dismiss controls {#customizing-dismiss-controls}
----------------

By default the user can dismiss an overlay by pressing `Escape`, by clicking outside the overlay box,
or by clicking the `×` button in the top-right corner. Popups have no `×` button.

To enable only some of these controls, or to change the `×` symbol and its accessibility label,
see [customizing dismiss controls](/closing-overlays#customizing-dismiss-controls).


Styling overlays with CSS {#css}
-------------------------

Unpoly ships with some basic CSS for each overlay mode. You can override it in your own stylesheet.

### The overlay HTML structure {#html-structure}

A modal overlay is built from these elements:

```html
<up-modal size="medium">                                   <!-- container with attributes -->
  <up-modal-backdrop></up-modal-backdrop>                  <!-- semi-transparent background -->
  <up-modal-viewport>                                      <!-- scrolls the box -->
    <up-modal-box>                                         <!-- white box with padding -->
      <up-modal-content>...</up-modal-content>             <!-- parent of your fragment (unstyled) -->
      <up-modal-dismiss>×</up-modal-dismiss>               <!-- dismiss button -->
    </up-modal-box>
  </up-modal-viewport>
</up-modal>
```

Drawers have the same structure with `<up-drawer>`, `<up-drawer-box>` and so on.
Cover overlays use `<up-cover>` elements and have no backdrop.

Popups are simpler. They have no backdrop, no viewport and no dismiss button,
and the container is the box itself:

```html
<up-popup size="medium" position="bottom" align="left">
  <up-popup-content>...</up-popup-content>
</up-popup>
```

### Overriding the default styles {#overriding-styles}

Target these elements in your CSS to restyle a mode:

```css
up-modal-box {
  background-color: #eeeeee;
  padding: 20px;
}
```

Your settings for size, position and alignment are reflected as attributes on the container element,
so you can style a particular variant. The selector below only matches the box of a drawer on the right edge:

```css
up-drawer[position=right] up-drawer-box {
  border-left: 1px solid #ccc;
}
```


Customizing overlay elements {#customizing-overlay-elements}
----------------------------

The overlay structure [above](#html-structure) is fixed and cannot be changed through an option.
To add your own elements, listen to `up:layer:opened`. The event is emitted
after the overlay was inserted into the DOM, but before it is painted by the browser:

```js
up.on('up:layer:opened', function(event) {
  if (isChristmas()) {
    up.element.affix(event.layer.element, '.santa-hat', { text: 'Merry Christmas!' })
  }
})
```

Do not remove any of the existing overlay elements, or the overlay will break.


@page customizing-overlays
