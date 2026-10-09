Changelog
=========

Changes to this project are documented at <https://unpoly.com/changes>, formatted and hyperlinked.

If you're upgrading from an older Unpoly version, see [Upgrading Unpoly](https://unpoly.com/changes/upgrading). Two markers flag changes that may affect your code:

- ⚠️ marks a change that may require changes to your code. Old usage is polyfilled by [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading), so your app keeps working while you migrate. Because of the polyfill, we don't count it as a breaking change.
- ❌ marks a breaking change without a polyfill. Update your code before you upgrade. These are rare and usually come with a new major version.

The raw changelog sources live in [`docs/changes/`](https://github.com/unpoly/unpoly/tree/master/docs/changes), one file per major version.
