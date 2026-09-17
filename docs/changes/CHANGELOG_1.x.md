1.0.3
-----

This maintenance release addresses two issues that were introduced in version 1.0.0:

- Unpoly can now be loaded with `<script defer>`. This can be used to load your scripts without blocking the DOM parser.
- Unpoly can now be loaded with `<script type="module">`. This can be used deliver a modern JS build to modern browsers only.


1.0.1
-----

This is a maintenance release for Unpoly 1. Expect little to no additional changes for this legacy version. New features will only be added to Unpoly 2.

- `up.request()` will now send Unpoly's version number as an `X-Up-Version` request header. Since `X-Up-Target` is optional in Unpoly 2, server-side integration libraries can look for `X-Up-Version` to reliably detect a fragment update for both Unpoly 1 and 2.
- Fix a bug where the Unpoly banner would still be printed to the development console when `up.log.config.banner = false` is set. (fix by @adam12)


1.0.0
-----

For six years Unpoly has been released under a 0.x version number. To establish the maturity and stability of the project, we're releasing today's version as 1.0.0.

There are only three changes from 0.62.1:

- Fix a bug where `up.util.escapeHTML()`` would not escape single quotes.
- Unpoly will no longer wait a JavaScript execution task to boot after `DOMContentLoaded`. This may improve the stability of test suites that previously interacted with the page too soon.
- You may now disable the Unpoly banner in the development console with `up.log.config.banner = false`. (change by @hfjallemark).

This is the last release of the 0.x API line. We're tracking its code in the [`1.x-stable`](https://github.com/unpoly/unpoly/tree/1.x-stable), but expect little to no changes in the future.

The next release will be [Unpoly 2](https://triskweline.de/unpoly2-slides). It will include major (but mostly backwards compatible) renovations to its API, unlocking many use cases that were not possible with Unpoly 1.


