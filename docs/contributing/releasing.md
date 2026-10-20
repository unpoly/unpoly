# Making a new release

A guided CLI walks you through the process. Before starting, set the new version in
`package.json` and write its changelog entry in `docs/changes/CHANGELOG_<major>.x.md` — the
tool reads the version from `package.json` and tags with it. Before a regular release, publish
a pre-release (like `3.13.0-rc1`) and upgrade at least one real app to it.

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

Afterwards it prints the manual follow-ups it cannot do for you: a matching
[`unpoly-rails`](https://github.com/unpoly/unpoly-rails) release, deploying
[`unpoly-site`](https://github.com/unpoly/unpoly-site) so unpoly.com serves the new
CHANGELOG and CDN links, and announcing the release.


## If you are an agent

Never run `bin/release` or publish to npm. When asked, you may prepare a release: the
changelog entry and the version in `package.json`.
