Bootstrap integration
=====================

Optional files configure Unpoly to work with [Bootstrap](https://getbootstrap.com/)'s CSS classes.
With the integration loaded, navigation feedback, form validation and overlays
use the classes and layout rules that Bootstrap expects.


## Loading the integration {#files}

Load the files matching your Bootstrap version after Unpoly's own files.
Builds for Bootstrap 3, 4 and 5 are available from a CDN:

| Development | Production |
|---|---|
| [`unpoly-bootstrap3.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap3.js) | [`unpoly-bootstrap3.min.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap3.min.js) ([[=size unpoly-bootstrap3.min.js]] gzipped) |
| [`unpoly-bootstrap3.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap3.css) | [`unpoly-bootstrap3.min.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap3.min.css) ([[=size unpoly-bootstrap3.min.css]] gzipped) |
| [`unpoly-bootstrap4.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap4.js) | [`unpoly-bootstrap4.min.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap4.min.js) ([[=size unpoly-bootstrap4.min.js]] gzipped) |
| [`unpoly-bootstrap4.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap4.css) | [`unpoly-bootstrap4.min.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap4.min.css) ([[=size unpoly-bootstrap4.min.css]] gzipped) |
| [`unpoly-bootstrap5.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap5.js) | [`unpoly-bootstrap5.min.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap5.min.js) ([[=size unpoly-bootstrap5.min.js]] gzipped) |
| [`unpoly-bootstrap5.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap5.css) | [`unpoly-bootstrap5.min.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap5.min.css) ([[=size unpoly-bootstrap5.min.css]] gzipped) |

The same files ship with Unpoly's [npm package](/install#npm):

```js
import 'unpoly/unpoly.js'
import 'unpoly/unpoly.css'
import 'unpoly/unpoly-bootstrap5.js'  // mark-line
import 'unpoly/unpoly-bootstrap5.css' // mark-line
```


## What the integration configures {#configuration}

The JavaScript file adjusts Unpoly's configuration to Bootstrap's conventions:

- [Navigation feedback](/navigation-bars) uses Bootstrap's `active` class to mark
  current links and running interactions, and `.nav` and `.navbar` elements count
  as navigational containers. See `up.status.config`.
- Fixed navbars are registered as fixed layout elements, so Unpoly can account for
  them when scrolling and positioning overlays. See `up.viewport.config`.
- Bootstrap's grid and spacing utility classes, like `.row` and `.col-*`, are ignored
  when Unpoly [derives a target selector](/target-derivation) from an element.
  See `up.fragment.config.badTargetClasses`.
- Overlays that Bootstrap renders itself, like its modals, popovers and dropdown menus,
  are registered as foreign overlays that Unpoly will not close or adopt.
  See `up.layer.config.foreignOverlaySelectors`.
- With Bootstrap 3 and 4, `.form-group` elements are used as [form groups](/up-form-group)
  when [validating forms](/validation). Bootstrap 5 has no form group class,
  so configure `up.form.config.groupSelectors` to match your own markup.

The stylesheet lets `.container` and `.container-fluid` elements fill Unpoly
[overlays](/up.layer) without Bootstrap's page padding.

@page bootstrap-integration
