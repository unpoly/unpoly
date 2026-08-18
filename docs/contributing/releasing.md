# Making a new release

A guided CLI walks you through the process. Before starting, set the new version in
`package.json` and write its `CHANGELOG.md` entry — the tool reads the version from
`package.json` and tags with it.

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

Never make a release.
