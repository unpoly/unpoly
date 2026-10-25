# Outline fixtures

The contract for `bin/outline` (Node, this repository) and its twin
`unpoly-site/source/skills/unpoly-docs/scripts/outline.py` (Python, the agent skill).
Both must print exactly the expected output for every case here.


## How a case is encoded

Every `.txt` file is one case: the exact stdout of the tool, run **from this directory**
with bare file names as arguments. Its name says what to run:

| Expected output                          | Command                                           |
|------------------------------------------|---------------------------------------------------|
| `atx-guide.txt`                          | `outline atx-guide.md`                            |
| `depth.depth-2.txt`                      | `outline --depth=2 depth.md`                      |
| `heading-first+only-title+changelog.txt` | `outline heading-first.md only-title.md changelog.md` |

- Names joined with `+` are several files in one call, in that order.
- A `.depth-N` suffix adds `--depth=N`. Without it the default depth of 3 applies.

A `.md` file may serve several cases. To add a case, add the `.md` file, write down the
output you expect, and check that both tools print it.


## The output

```
atx-guide.md: Writing guides (33 lines)
  A guide in the contributing style: ATX headings, an intro paragraph
  over two lines, and a generated TOC block below it.

  1-12   (intro)
  13-26  ## Basics
  19-26  ### Inline `code` in headings
```

- **Header:** `path: Title (N lines)`, or `path (N lines)` without a title. N counts lines
  as `wc -l` does, plus an unterminated last line. `(1 line)` is singular.
- **Title:** an H1 (`#` or underlined with `===`) that comes before any content. Frontmatter,
  `<nav>` blocks, comments, horizontal rules and blank lines may precede it.
- **Summary:** the first run of non-blank text lines above the first heading below the title,
  verbatim, indented by two spaces, followed by one blank line. Code blocks and image lines
  (`![…](…)`, a linked image, `<img …>`) before it are passed over. No such text, no summary.
- **Range lines:** two spaces, the range `start-end` (1-based, inclusive) left-aligned in a
  column as wide as the widest range of the whole output plus two spaces, then a label.
- **Sections:** every heading except the title, down to `--depth` (H1 is level 1, so the
  default 3 lists `#` after the title, `##` and `###`). A section includes its subsections: it
  ends on the line before the next heading of the same or a higher level, or on the last line.
  Deeper headings are not listed and end nothing. The label is the heading's `#` marks (one
  per level, also for underlined headings) and its text, without a `{#anchor}` and without
  closing `#`s. Inline code and links are kept.
- **`(intro)`:** the first range line, from line 1 to the line before the first listed
  heading (or to the last line, if none is listed). It is shown only if something other than
  skipped and blank lines sits between the title (or the start of the file) and that heading.
  A deeper heading counts as content, so the intro grows to cover its section.
- Several files are separate blocks with one blank line between them.


## What is read

- **ATX headings:** one to six `#` at the start of the line, then a space or tab.
- **Underlined headings:** a text line followed by `===` (level 1) or `---` (level 2). The
  text line must not be blank, indented, a list item (`-`, `*`, `+`, `1.`, `1)`), a quote (`>`),
  contain a `|` (a table), or already be a heading. Only that one line is the heading's text.
- **Horizontal rules:** three or more `-`, `*` or `_`, optionally with spaces in between.
  Skipped.
- **Frontmatter:** `---` on line 1 up to the next `---` line. Skipped. Without a closing
  line, the first line is a horizontal rule.
- **Fenced code:** a line opening with three or more backticks or tildes, at any
  indentation. It ends at a line of only the same character, at least as many, at any
  indentation; otherwise at the end of the file. Never a heading, never the summary, but
  content for the intro. An info string with a backtick in it does not open a fence.
- **HTML comments:** a line starting with `<!--` (after any indentation) up to the line containing `-->`. Skipped
  whole, even when the closing line goes on after it.
- **TOC blocks:** `<!-- toc -->` up to `<!-- /toc -->` or `<!-- tocstop -->`. Skipped.
- **`<nav>` blocks:** a line starting with `<nav` (after any indentation) up to the line containing `</nav>`
  (often the same line, as with breadcrumbs). Skipped, together with the `#### Contents`
  heading the skill pages put inside.
