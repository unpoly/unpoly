# Your first change to Unpoly

> **TODO:** This guide is still an outline. The notes below describe its intended
> scope, not finished prose.

An end-to-end walkthrough of one typical change, e.g. adding a new modifying
attribute to `[up-follow]`. Shows only the happy path, with minimal explanation.

Design constraint for whoever writes this: **the walkthrough is a spine of links,
not a tutorial.** Each step is one imperative sentence plus a link to the guide that
owns the details. The only thing this document owns is the *order* of the steps —
everything else is explained once, elsewhere. Concrete invariants (`bin/dev`,
`spec/unpoly/link_spec.js`, `bin/test --spec="up.link"`) may be repeated inline,
because a walkthrough that says "set up your dev environment" instead of naming the
command is worse than useless.

Intended sequence:

- Start the dev environment
- Decide which main module owns the change
- Implement the attribute
- Write a spec
- Run the filtered spec
- Add a doc comment
- Commit
