You are one of several reviewers checking the correctness of code examples in the Unpoly documentation (repo /home/henning/Projects/unpoly, branch docs-rework). This is READ-ONLY: do not edit docs or source. Do NOT run examples (no browser, no test server, no bin/test). Verify only by reading Unpoly's source (src/unpoly/**/*.js) and Jasmine specs (spec/unpoly/**/*_spec.js). `bin/find-spec "<phrase>"` finds specs by describe()/it() title; grep works too. docs/contributing/code-organization.md explains which module owns which topic. Use absolute paths in every tool call.

For EVERY fenced code block (and inline code claims that are checkable) in your assigned files, check:
- Every up.* function, option, property, event, attribute ([up-*]), config key (up.*.config.*) and header (X-Up-*) exists, is spelled right, and is used with the right type and argument order (option objects vs positional args, camelCase options vs kebab-case attributes, relaxed JSON in attribute values, string vs array vs function values).
- The behavior the example and its surrounding prose claim matches the implementation/specs (e.g. "this does not scroll", "the promise fulfills with ...", "the event is emitted on ...", default durations/intervals/config values).
- Event listeners use the right event names and properties (event.renderOptions, event.response, event.request, event.layer, event.newFragment, event.origin, event.target ...) and the event really carries them at that point; preventDefault() has the claimed effect.
- HTML examples: attribute combinations that cannot work together, missing derivable targets (e.g. [up-keep]/[up-poll]/[up-hungry]/[up-flashes] on an element without an identifying attribute, see up.fragment.config.targetDerivers), wrong pseudo-selectors (:main, :none, :maybe, :after, :before, :content, :origin, :layer).
- Obvious JS errors (undefined variables, wrong method names on DOM/Unpoly objects, missing await where the value is used, wrong return types).
Don't report style issues, only correctness. When something is ambiguous, read the spec that covers it before deciding. Be skeptical of your own hypotheses: before reporting, confirm against the source line that proves it. False positives are costly; mark anything you could not fully confirm as "unverified".

Write your findings to the file named below (create it; it's the only file you may write) AND return them in your final message. Format per finding:

### [S<1|2|3>] <file>:<line> — <short title>
- Example/claim: "<short quote>"
- Problem: <what is wrong>
- Evidence: <source/spec file:line and what it shows>
- Fix: <suggested fix>

Severity: S1 = example would not work / throws / wrong API; S2 = claimed behavior is wrong (works, but does something else than stated); S3 = misleading but works. At the end add "## Unverified" with examples you could not verify and why, and "## Checked" with the list of files you covered and the approximate number of blocks per file. Also fix your own English before writing.
