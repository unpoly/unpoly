<p>
  <a href="https://makandra.de/">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="media/sponsored-by-makandra.light.svg">
      <source media="(prefers-color-scheme: dark)" srcset="media/sponsored-by-makandra.dark.svg">
      <img align="right" width="27%" alt="Sponsored by makandra" src="media/sponsored-by-makandra.light.svg">
    </picture>
  </a>

  <a href="https://unpoly.com">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="media/unpoly-logo.light.svg">
      <source media="(prefers-color-scheme: dark)" srcset="media/unpoly-logo.dark.svg">
      <img width="330" alt="Unpoly 3" role="heading" aria-level="1" src="media/unpoly-logo.light.svg">
    </picture>
  </a>
</p>

<p>
  <img alt="jsDelivr hits (npm)" src="https://img.shields.io/jsdelivr/npm/hy/unpoly">
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dy/unpoly?label=npm">
  <img alt="Dependency count" src="https://badgen.net/bundlephobia/dependency-count/unpoly?label=dependencies&color=grey">
</p>


Progressive enhancement for HTML
--------------------------------

[Unpoly](https://unpoly.com) enhances your HTML with attributes to build dynamic UI on the server.

Unpoly works with any language or framework. It plays nice with existing code, and gracefully degrades without JavaScript.

This branch tracks the current major version, Unpoly **3.x**.\
If you're using Unpoly **2.x**, use the [`2.x-stable`](https://github.com/unpoly/unpoly/tree/2.x-stable) branch.\
If you're using Unpoly **1.x** or **0.x**, use the [`1.x-stable`](https://github.com/unpoly/unpoly/tree/1.x-stable) branch.


Getting started
---------------

- See [unpoly.com](https://unpoly.com) for guides and documentation.
- See [installation instructions](https://unpoly.com/install) for many different package managers and languages.
- See [discussions](https://github.com/unpoly/unpoly/discussions) for our community forum.
- See [notable changes](https://unpoly.com/changes).


Development
-----------

### Installing development dependencies

To build Unpoly you require Node.js, Webpack and other npm packages.

Install the Node version from `.nvmrc`.

To install required npm packages, run:

```
npm install
```

### Quick start

The following will build the library and start a server to run tests:

```
npm run dev
```

Allow a moment for Unpoly and tests to build in `dist/`. Changing a file will re-build automatically.

You can now run tests using one of the following methods:

- From your console, using `npm run test`
- In a browser, by accessing `http://localhost:4000` 

If you don't want to use `npm run dev` and prefer to run individual tasks instead, see below.


### Building the library

Tests don't consume the sources directly, but from a transpiled build in `dist/`.

To make fresh build for development, run:

```
npm run build-dev
```

This will build transpiled files such as:

```
dist/unpoly.js
dist/unpoly.css
dist/unpoly-migrate.js
dist/jasmine.js
dist/specs.js
```

There is also a task `npm run build` for a production build. This does not build files for testing, but also outputs minified versions.

### Watching files for changes

During development it is impractical to make a full build after every change. Instead it is recommend to watch the project:

```
npm run watch-dev
```

This will make a fresh build and then watch the project for changes to the source files. 

When a source changes, affected build files are automatically recompiled. The incremental recompilation is much faster than a full build.

### Running tests

Tests need a small background server to run:

```
npm run test-server &
```

You can now run tests using one of the following methods:

- From your console, using `npm run test`
- In a browser, by accessing `http://localhost:4000`

In addition to the unit tests, there is an optional support repo [`unpoly-manual-tests`](https://github.com/unpoly/unpoly-manual-tests). It contains a Rails app to play with Unpoly features that are hard to test well with a unit test. E.g. the visual look of overlays, or edge cases when booting Unpoly.

### Making a new release

There is a guided CLI interface to lead you through the release process. To start the process run:

```
npm run release
```



Credits
-------

- [Henning Koch](mailto:henning.koch@makandra.de) from [makandra](https://makandra.com) ([@triskweline](https://twitter.com/triskweline) on Twitter)
- [Contributors](https://github.com/unpoly/unpoly/graphs/contributors)
