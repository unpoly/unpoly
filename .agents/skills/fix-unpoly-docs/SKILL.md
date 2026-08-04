---
name: fix-unpoly-docs
description: Copy-edit the Unpoly documentation embedded in this repository — the `/*-` doc comments in `src/unpoly/**/*.js` and the guide pages under `src/unpoly/pages/` — fixing typos, grammar, awkward English and obvious factual errors without touching structure, JSDoc directives, links or code. Use when asked to proofread, revise or fix the wording of Unpoly's API reference or guides. This is not a general-purpose documentation writing skill.
---

# Revising Unpoly's embedded documentation

Unpoly's reference documentation lives inside this repository, not in a separate docs
site: it is written as specially marked comments in the library source, plus a set of
guide pages in Markdown. The rendered documentation at unpoly.com is generated from
these files.

Your task is to copy-edit that prose — typos, grammar, clumsy English, obvious factual
errors — while leaving the surrounding source code, the document structure and the
JSDoc-style markup exactly as they are. The documentation is published, cross-linked
and parsed by a generator, so a rewrite that reads better but moves sections around or
edits a directive is a regression, not an improvement.

## Scope of change

Work only on files the user named — they may pass directories or filenames as a
parameter. If they named nothing, ask which files or directories to revise rather than
sweeping the whole library; `src/unpoly/` and `src/unpoly/pages/` together hold far
more documentation than fits into one useful review.

## Steps

- Improve the prose of each documentation block:
  - Fix typos
  - Fix grammar mistakes
  - Smooth out usage of the English language
  - Fix obvious factual errors
- Avoid breaking the documentation:
  - Do NOT move around entire sections of text.
  - Do NOT fix invalid Markdown syntax.
  - Do NOT change the level of headings (e.g. `##` vs. `###`)
  - Do NOT change JSDoc directives like `@param` or `@section`, only fix any prose text embedded in the directive.
  - Do NOT change the href URLs of Markdown links.
  - Before fixing an incorrect seaming statement about the Unpoly API, verify correctness of your change by searching through this project or the web.
- Avoid breaking the code:
  - In `.js` and `.ts` files, source code and documentation comments are not mixed.
  - Do not change source code out of documentation comments.
- Take special care with embedded code blocks:
  - The Markdown contains inline code (in single backticks) or code blocks (in triple backticks or indented with four spaces).
  - Only change the contained code if you see obvious syntax errors.
  - Add missing language annotation to code blocks when you clearly recognize the language.
- Our Markdown renderer uses soft line breaks. You don't need to combine multiple lines into a single line to avoid a line break.
- Hard breaks can be enforced explicitely by ending a line in a backslash (`\`). Do not remove any existing backslashes at the end of lines, as they are intentionally inserted to enforce a line break.

## Finding documentation blocks

In a `.md` file, the *entire* file is considered a single documentation block.

In a `.js` or `.ts` file, documentation blocks are JavaScript comments delimited by `/*-` (the dash is important) and `*/`:

```
/*-
This is documentation.
*/
```

There can be multiple documentation comments in one file.

DO NOT CHANGE regular JavaScript comments that don't open with a dash:

```
/*
NO documentation. Do not change.
*/
```

Ignore single-line comments:

```
// NO documentation. Do not change.
```

## Documentation block syntax

Documentation blocks are written in a Markdown superset.
The Markdown also contains JSDoc-style markup like this:

/*-
This function says *hello* to the given name.

@function greet
@param {string} name
    The name of the person to greet
@return {undefined}
    Returns nothing.
*/

The JSDoc-style markup is only based on JSDoc (in particular the `@` prefixed directives), but it is a superset of JSDoc.
Only fix prose text describing functions, parameters or return values. Do not fix JSDoc directives that you don't recognize.
