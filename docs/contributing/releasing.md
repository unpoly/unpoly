# Making a new release

A guided CLI walks you through the process. Before starting, set the new version in
`package.json` and finish its changelog entry in `docs/changes/CHANGELOG_<major>.x.md` — the
tool reads the version from `package.json` and tags with it. Before a regular release, publish
a pre-release (like `3.13.0-rc1`) and upgrade at least one real app to it.

Changes that are not yet released go under an `Unreleased` heading at the top of the changelog.
On release, rename that heading to the version number. The tool stops while an `Unreleased`
heading is left.

In the changelog, start an item that may need the reader's attention with a marker:
🧩 when `unpoly-migrate.js` polyfills it and logs where the old API is used, ⚠️ when it is
not polyfilled but rare or minor, and ❌ when readers should check their code in any case.
Only intentional changes to *documented* API or behavior are breaking; bug fixes and changes
to undocumented behavior get no marker.

```
bin/release
```

It cleans and rebuilds `dist/`, shows you what is about to be published and asks for
confirmation, pushes the `v<version>` tag, and publishes to npm. A version containing `rc`, `beta`,
`pre` or `alpha` is published under the npm tag `next` instead of `latest`, so it never
reaches users who just run `npm install unpoly`.

Every bundle in the package has a placeholder declaration beside it (`unpoly.js` → `unpoly.d.ts`)
that contains only `export {}`. It lets TypeScript apps with `allowJs` import the bundle, which has
no module syntax. The build writes them; real types will replace them later.

The tool runs no specs and no type check, and its build lints only `src/`. It builds the
working tree and tags `HEAD`, so release from a clean working tree, at a pushed commit that
[CI](commit-conventions.md#continuous-integration) has passed.

The specs never run against the bundles we publish, so CI's job "Boot published bundles" builds
them like `bin/release` does and loads them in headless Chrome: each `unpoly*.js` alone, and with
each `unpoly-migrate` and `unpoly-bootstrap` bundle of the same minification. Any uncaught error,
console error, or a failed render of one fragment fails the job. It takes a few seconds, and you
can run it yourself with `bin/build && bin/boot-bundles` (which stops a running dev environment).

Afterwards it prints the manual follow-ups it cannot do for you: a matching
[`unpoly-rails`](https://github.com/unpoly/unpoly-rails) release, deploying
[`unpoly-site`](https://github.com/unpoly/unpoly-site) so unpoly.com serves the new
CHANGELOG and CDN links, and announcing the release.


## If you are an agent

Never run `bin/release` or publish to npm. When asked, you may prepare a release: the
changelog entry and the version in `package.json`.
