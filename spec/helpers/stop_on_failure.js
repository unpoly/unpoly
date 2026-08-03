// Stop each spec at its first failed expectation, rather than continuing and
// piling up consequential failures (Jasmine's default). This makes reports honest:
// one failure, one stack, and a DOM snapshot from the moment of that failure — not
// a cascade from code that ran afterwards with broken state.
//
// Controlled by the runner's `stopOnFailure` config (default true; disable with
// `--stop-on-failure=false` or `STOPONFAILURE=false`). Applied here so it affects
// the browser runner too.
jasmine.getEnv().configure({ stopSpecOnExpectationFailure: specs.config.stopOnFailure })
