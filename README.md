[Unpoly 2](https://unpoly.com)
==============================

Unobtrusive JavaScript framework for server-side applications
-------------------------------------------------------------

[Unpoly](https://unpoly.com) enables fast and flexible frontends with minimal changes to your server-side code.

This branch tracks the current major version, Unpoly 2.x. If you're looking for the code of Unpoly 0.x or 1.x, use the [`1.x-stable`](https://github.com/unpoly/unpoly/tree/1.x-stable) branch.


Getting started
---------------

- See [unpoly.com](https://unpoly.com) for guides and documentation.
- See [installation instructions](https://unpoly.com/install) for many different package managers and languages.
- See [notable changes](https://unpoly.com/changes).


Development
-----------

### Installing development dependencies

To build Unpoly you require Node.js, Webpack and other npm packages.

Install the Node version from `.nvmrc`.

To install Webpack and other required npm packages, run:

```
npm install
```

### Building the library

Tests don't consume the sources directly, but from a transpiled build in `dist/`.

To make fresh build, run:

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

This will make a fresh build and then watch the project for changes to the source files. When a source changes, affected build files are automatically recompiled. The incremental recompilation is much faster than a full build.

### Running tests

Tests run using a browser-based [Jasmine](https://jasmine.github.io/) runner.

To start a web server serving the Jasmine runner:

```
npm run test
```

This will open a server on <http://localhost:3000> and opens that URL with your default browser.

In addition to the unit tests, there is an optional support repo [`unpoly-manual-tests`](https://github.com/unpoly/unpoly-manual-tests). It contains a Rails app to play with Unpoly features that are hard to test well with a unit test. E.g. the visual look of overlays, or edge cases when booting Unpoly.

### Making a new release

You can use this repository to publish a new version of the `unpoly` npm package.

The release process currently requires Ruby. To install these dependencies:

- Install the Ruby version from `.ruby-version`
- Run `bundle install`

There is a guided CLI interface to lead you through the release process. To start the process run:

```
bundle exec rake release:process
```



Credits
-------

- [Henning Koch](mailto:henning.koch@makandra.de) from [makandra](https://makandra.com) ([@triskweline](https://twitter.com/triskweline) on Twitter)
- [Contributors](https://github.com/unpoly/unpoly/graphs/contributors)
