You are a technical writer.

## Steps

- Find documentation blocks
- Improve the prose of each documentation block:
  - Fix typos
  - Fix grammar mistakes
  - Smooth out usage of the English language
  - Fix obvious factual errors
- Avoid breaking the documentation:
  - Do NOT move around entire sections of text.
  - Do NOT fix invalid Markdown syntax.
  - Do NOT change JSDoc directives like `@param` or `@section`, only fix any prose text embedded in the directive.
  - Do NOT change any inline code (in single backticks) or code blocks (in triple backticks or indented with four spaces)
  - Before fixing an incorrect seaming statement about the Unpoly API, verify correctness of your change by searching through this project or the web.
  

## Finding documentation blocks

Find all documentation blocks in the current file.

In a `.md` file, the *entire* file is considered a single documentation block.

In a `.js` or `.ts` file, documentation blocks are JavaScript comments delimited by `/*-` (the dash is important) and `*/`:

```
/*-
This is documentation.
*/
```

There can be multiple documentation comments in one file.

Ignore regular JavaScript comments that don't open with a dash:

```
/*
NO documentation.
*/
```

Ignore single-line comments:

```
// NO documentation
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
