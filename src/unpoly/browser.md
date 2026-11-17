# up.browser

We tunnel some browser APIs through this namespace for easier mocking in tests.

@namespace up.browser
@internal

-----

# up.browser.submitForm()

Submits the given form with a full page load.

For mocking in specs.

@function up.browser.submitForm
@internal

-----

# up.browser.ensureConfirmed()

@return {boolean}
@function up.browser.ensureConfirmed
@param {string} options.confirm
@param {boolean} options.preload
@internal
