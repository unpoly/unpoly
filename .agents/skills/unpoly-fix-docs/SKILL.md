---
name: unpoly-fix-docs
description: Copy-edit the Unpoly documentation embedded in this repository — the `/*-` doc comments in `src/unpoly/**/*.js` and the guide pages under `src/unpoly/pages/` — fixing typos, grammar, awkward English and obvious factual errors without touching structure, JSDoc directives, links or code. Use when asked to proofread, revise or fix the wording of Unpoly's API reference or guides. This is not a general-purpose documentation writing skill.
---

# Revising Unpoly's embedded documentation

You are copy-editing prose that is already published, cross-linked and parsed by a
generator. A revision that reads better but moves sections, rewrites a directive or
breaks a link is a regression, not an improvement.

## Read the guide first

[`docs/contributing/documentation.md`](../../../docs/contributing/documentation.md) is
the reference for how this documentation is written. Read it before your first edit —
it is what tells you whether something you want to "fix" is actually correct. It
covers, among other things:

- **Where documentation lives** — that `/*-` opens a doc comment while `/*` and `//` are
  internal comments you must leave alone, and that a whole `.md` file is one block.
- **Anatomy of a doc comment** and **Documenting parameters** — the directive set, which
  is a superset of JSDoc and larger than you will guess.
- **Writing prose** — the house conventions for referring to features (`up.render()` with
  parens, `[up-target]` in brackets, `.up-current` with a dot).
- **Rely on autolinking** — why bare backticks are already links, so a "missing" link is
  usually intentional.
- **Line breaks**, **Admonitions** and **Marking up code blocks** — syntax that looks like
  a typo until you know it isn't (`> [tip]`, `// mark-line`, a trailing `\`).

Everything below is specific to copy-editing. It does not repeat the guide.

## Scope

Work only on the files the user named; they may pass filenames or directories as a
parameter. If they named nothing, ask which files to revise rather than sweeping the
library — `src/unpoly/` and `src/unpoly/pages/` together hold far more documentation
than one useful review can cover.

## What to fix

- Typos and grammar mistakes.
- Clumsy or unidiomatic English.
- Obvious factual errors — but **verify before you correct**. A statement about Unpoly's
  behavior that looks wrong is often right, so confirm it against the source or the
  specs first. Changing correct documentation to incorrect documentation is the worst
  outcome available to you.
- Prose *inside* a directive, such as the description under an `@param`.
- A missing language annotation on a fenced code block, when you clearly recognize the
  language.

## What to leave alone

- **Structure.** Don't move sections, don't reorder them, don't change heading levels.
- **Directives themselves.** Fix the prose under `@param`, never the `@param` line. Leave
  any directive you don't recognize entirely alone.
- **Link targets.** Edit link text if it's wrong; never the URL.
- **Markdown that looks broken.** Don't "repair" invalid-looking syntax — the renderer
  accepts constructs a standard parser doesn't, and the guide's syntax sections explain
  several of them. Leave trailing backslashes and don't rewrap paragraphs.
- **Code.** Don't touch source code outside doc comments. Inside a code block, change
  something only for an obvious syntax error — not to modernize or restyle it.
