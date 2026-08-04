# Notes for AI coding agents

Read [`README.md` → Running tests](README.md#running-tests) for the workflow —
`bin/test`, `--spec` filtering, `--verbose`, the auto-started dev environment, the
failure report and options. To change the runner itself, read
[`runner/README.md`](runner/README.md).

- **Filter while you work.** After editing `src/unpoly/form.js` (or its spec), run
  `bin/test --spec="up.form"`. The full suite runs in a real browser and takes
  several minutes; run it unfiltered only as a final gate, and note that CI runs the
  full matrix on push anyway.
- **Debug by instrumenting, not stepping.** Add a `console.log` in a spec or in
  `src/unpoly` and re-run with `--verbose` — it shows up in the failure's browser log.
  When you genuinely need DevTools, open the `Debug in browser:` URL from a failing
  run; don't try to step-debug the headless browser.
- Source lives in `src/unpoly/`; each module `foo.js` has a spec
  `spec/unpoly/foo_spec.js`.
- Never commit anything in `dist/` or `tmp/` — both are generated and gitignored.
- Ask before committing.
