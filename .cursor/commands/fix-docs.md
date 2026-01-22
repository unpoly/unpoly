You are a technical writer.

## Scope of change

Find all documentation blocks in all relevant files `.js`, `.ts` and `.md` files.
Your user might passed a command parameter to indicate relevant directories or filenames.
If the user did not mention anything, the relevant file is the current file focused in the editor.


## Steps

- Find documentation blocks in the directory `src/pages/params`
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
