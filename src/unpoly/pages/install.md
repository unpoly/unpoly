Installation
============

Unpoly consists of one JavaScript file and one CSS file that you can require in your `<head>`.
It has no dependencies and doesn't require a build tool.

Unpoly works with any server that can render HTML, or with static sites.
You do not need additional software on your backend.


## Initialization

Include Unpoly before your own JavaScripts and stylesheets:

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly.css"> <!-- mark-line -->
    <script src="https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly.js" defer></script> <!-- mark-line -->
    <link rel="stylesheet" href="your-styles.css">
    <script src="your-scripts.js" defer></script>
  </head>
  <body>
    <!-- Use Unpoly attributes in your HTML -->
    <a href="/page" up-follow>Follow me with Unpoly</a> <!-- mark: up-follow -->
  </body>
</html>
```

Unpoly initializes on [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event)
and enhances the HTML on your page. You can also boot Unpoly manually at a time of your
choice with `[up-boot=manual]`.


## Installing from npm {#npm}

Instead of loading Unpoly from a CDN, you can install it as an [npm package](https://www.npmjs.com/package/unpoly):

```
npm install unpoly --save
```

Now import Unpoly before your own JavaScripts and stylesheets:

```js
import 'unpoly/unpoly.js'  // mark-line
import 'unpoly/unpoly.css' // mark-line
import './your-scripts.js'
import './your-styles.css'
```


## JavaScript API

Most of Unpoly's functionality is provided as new attributes that you can add to any
HTML element. Unpoly also provides a JavaScript API to extend Unpoly or integrate your
custom scripts.

Unpoly's JavaScript API can be accessed through the `window.up` global, without an
explicit `import`:

```js
up.compiler('.click-to-hide', function(element) {
  let hide = () => element.style.display = 'none'
  element.addEventListener('click', hide)
})
```


## Bootstrap integration {#bootstrap}

If you're using [Bootstrap](https://getbootstrap.com/), there are some **optional** files
that configure Unpoly to use Bootstrap's CSS classes:

| Bootstrap version | JavaScript | Stylesheet |
|-------------------|------------|------------|
| Bootstrap 3 | [`unpoly-bootstrap3.js`](https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly-bootstrap3.js) | [`unpoly-bootstrap3.css`](https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly-bootstrap3.css) |
| Bootstrap 4 | [`unpoly-bootstrap4.js`](https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly-bootstrap4.js) | [`unpoly-bootstrap4.css`](https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly-bootstrap4.css) |
| Bootstrap 5 | [`unpoly-bootstrap5.js`](https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly-bootstrap5.js) | [`unpoly-bootstrap5.css`](https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly-bootstrap5.css) |

Minified versions are available under the same names with a `.min` suffix, e.g.
`unpoly-bootstrap5.min.js`.


## Browser support {#browser-support}

Recent versions of Unpoly support all modern browsers. To detect support at runtime,
see `up.framework.isSupported()`.

The last version with support for Internet Explorer 11 is [2.7](/changes/2.7.1).

### ES6 build

`unpoly.js` uses ES2020 that may not be supported by (very) old browsers or build tools.
If you're not already working around this with a transpiler like [Babel](https://babeljs.io/),
you may also use the ES6 build of Unpoly:
[`unpoly.es6.js`](https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly.es6.js)
(minified: [`unpoly.es6.min.js`](https://cdn.jsdelivr.net/npm/unpoly@%UNPOLY_VERSION%/unpoly.es6.min.js)).

The ES6 build does not contain any polyfills.


## Optional extensions

You now have everything you need to start using Unpoly. We provide a number of
**optional** extensions:

- [[server-bindings]]: Inspect or manipulate Unpoly's rendering through HTTP headers.
- [Upgrade shim](/changes/upgrading): Polyfills for deprecated Unpoly APIs.

@page install
