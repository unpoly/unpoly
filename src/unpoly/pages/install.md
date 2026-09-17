Installation
============

Unpoly consists of one JavaScript file and one CSS file
that you can require in your `<head>`.
It has no dependencies and doesn't require a build tool.

Unpoly works with any server that can render HTML, or with static sites.
You do not need additional software on your backend.


## Initialization {#initialization}

Include Unpoly before your own JavaScripts and stylesheets:

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly.css"> <!-- mark-line -->
    <script src="https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly.js" defer></script> <!-- mark-line -->
    <link rel="stylesheet" href="your-styles.css" />
    <script src="your-scripts.js" defer></script>
  </head>
  <body>
    <!-- Use Unpoly attributes in your HTML -->
    <a href="/page" up-follow>Follow me with Unpoly<a> <!-- mark: up-follow -->
  </body>
</html>
```

Unpoly initializes on [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event)
and enhances the HTML on your page. You can also [boot Unpoly manually](/up-boot-manual) at a time of your choice.


## Installing from npm {#npm}

Instead of loading Unpoly from a CDN, you can install it as an [npm package](https://www.npmjs.com/package/unpoly):

```nohighlight
npm install unpoly[[=npm_tag]] --save
```

Now import Unpoly before your own JavaScripts and stylesheets:

```js
import 'unpoly/unpoly.js'  // mark-line
import 'unpoly/unpoly.css' // mark-line
import './your-scripts.js'
import './your-styles.css'
```


## JavaScript API {#javascript-api}

Most of Unpoly's functionality is provided as new attributes
that you can add to any HTML element.
Unpoly also provides a JavaScript API to extend Unpoly or [integrate your custom scripts](/up.script).

Unpoly's JavaScript API can be accessed through the `window.up` global, without an explicit `import`:

```js
up.compiler('.click-to-hide', function(element) {
  let hide = () => element.style.display = 'none'
  element.addEventListener('click', hide)
})
```


## Optional extensions {#extensions}

You now have everything you need to start using Unpoly!

We provide a number of **optional** extensions:

- [Optional server bindings](/server-bindings): Inspect or manipulate Unpoly's rendering through HTTP headers
- [Legacy browsers support](#browser-support): Support for ancient browsers and build tools
- [Bootstrap integration](#bootstrap): Configure Unpoly to use Bootstrap classes
- [Upgrade shim](https://unpoly.com/changes/upgrading): Polyfills for deprecated Unpoly APIs


## Bootstrap integration {#bootstrap}

If you're using [Bootstrap](https://getbootstrap.com/), there are some **optional** files that configure
Unpoly to use Bootstrap's CSS classes:

| Development | Production |
|---|---|
| [`unpoly-bootstrap3.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap3.js) | [`unpoly-bootstrap3.min.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap3.min.js) ([[=size unpoly-bootstrap3.min.js]] gzipped) |
| [`unpoly-bootstrap3.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap3.css) | [`unpoly-bootstrap3.min.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap3.min.css) ([[=size unpoly-bootstrap3.min.css]] gzipped) |
| [`unpoly-bootstrap4.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap4.js) | [`unpoly-bootstrap4.min.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap4.min.js) ([[=size unpoly-bootstrap4.min.js]] gzipped) |
| [`unpoly-bootstrap4.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap4.css) | [`unpoly-bootstrap4.min.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap4.min.css) ([[=size unpoly-bootstrap4.min.css]] gzipped) |
| [`unpoly-bootstrap5.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap5.js) | [`unpoly-bootstrap5.min.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap5.min.js) ([[=size unpoly-bootstrap5.min.js]] gzipped) |
| [`unpoly-bootstrap5.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap5.css) | [`unpoly-bootstrap5.min.css`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly-bootstrap5.min.css) ([[=size unpoly-bootstrap5.min.css]] gzipped) |


## Browser support {#browser-support}

Recent versions of Unpoly support [all modern browsers](/up.framework.isSupported).

The last version with support for Internet Explorer 11 is [2.7](https://unpoly.com/changes/2.7.1).

### ES6 build {#es6-build}

`unpoly.js` uses ES2020 that may not supported by (very) old browsers or build tools.
If you're not already working around this with a transpiler like [Babel](https://babeljs.io/),
you may also use the ES6 build of Unpoly:

| Development | Production |
|---|---|
| [`unpoly.es6.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly.es6.js) | [`unpoly.es6.min.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly.es6.min.js) ([[=size unpoly.es6.min.js]] gzipped) |

The ES6 build does not contain any polyfills.

@page install
