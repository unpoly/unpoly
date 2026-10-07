Supporting legacy browsers
==========================

Unpoly's standard build supports all modern browsers. Older browsers get a working,
non-enhanced app through graceful degradation, and a transpiled build covers
old build tools.


## Browsers supported by default {#baseline}

Recent versions of the evergreen browsers (Chrome, Firefox, Microsoft Edge) are
supported, as are the last two major versions of Safari.
See `up.framework.isSupported()` for how Unpoly checks the current browser.

On a browser it cannot support, Unpoly does not boot and does not
[enhance](/enhancing-elements) the page. Links and forms fall back to default
browser behavior, leaving you with a classic server-side application.


## ES6 build {#es6-build}

`unpoly.js` uses ES2021 syntax that very old browsers or build tools may not support.
If you're not already working around this with a transpiler like [Babel](https://babeljs.io/),
you can use the ES6 build of Unpoly:

| Development | Production |
|---|---|
| [`unpoly.es6.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly.es6.js) | [`unpoly.es6.min.js`](https://cdn.jsdelivr.net/npm/unpoly@[[=version]]/unpoly.es6.min.js) ([[=size unpoly.es6.min.js]] gzipped) |

The ES6 build does not contain any polyfills. When a target browser is missing
an API that Unpoly uses, you need to load a polyfill yourself.


## Internet Explorer {#internet-explorer}

The last version with support for Internet Explorer 11 is [2.7](https://unpoly.com/changes/2.7.1).

@page legacy-browsers
