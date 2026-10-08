# Markdown station — drafts awaiting review

Prose for places this station does not land itself (decisions 17A+, 26A, 27). Each draft
says where it goes. Wording is open for Henning's review; the content track lands the
install section at ship time.


## 1. Install page section (26A, shrunk by 35)

Goes into `src/unpoly/pages/install.md`, after "Installing from npm" and before "Optional
extensions". Owner: content track. Everything else the round-1 draft had (the Claude
Code plugin, the `AGENTS.md` line, `.md` URLs and `llms.txt`) now lives on `/skill`.

~~~~markdown
## Docs for coding agents {#agents}

Coding agents work better with Unpoly when they read its documentation instead of
guessing. Install the docs as an agent skill in your project:

```bash
npx skills add https://unpoly.com
```

The [skill page](/skill) has other install methods and ways to use the docs from a plain chat.
~~~~


## 2. Root index lead (17A+)

Lives in `unpoly-site/source/root_index.txt.erb` (served as `/index.md` and `/llms.txt`).
Landed with this wording; calibrate there:

> Unpoly is the missing application layer for HTML. Links and forms update fragments of
> the page instead of loading a new one, so everything around them keeps its state:
> scroll positions, focus, half-typed input. The application stays on the server, in any
> language or framework, and responds with plain HTML.
>
> These are the docs of Unpoly 3.x.y: guides to learn from, and the API reference to
> look things up in. Every page is also available as Markdown: append `.md` to its URL.

SKILL.md (`unpoly-site/source/skills/unpoly-docs/skill.txt.erb`) opens with a shorter
version of the same lead. Round 2 (38) added two preamble paragraphs after the
fragment-link convention, and dropped the lead's own "append `.md`" sentence, which the
first of them now says.


## 3. README section (27)

Goes into `README.md` of the unpoly repo, as a new section after "Getting started":

```markdown
Docs for coding agents
----------------------

- Install Unpoly's documentation as an agent skill: `npx skills add https://unpoly.com`.
- Every page on unpoly.com is also available as Markdown: append `.md` to its URL.
  [llms.txt](https://unpoly.com/llms.txt) lists them all.
- See the [skill page](https://unpoly.com/skill) for the Claude Code plugin and the line to add
  to your `AGENTS.md`.
```


## 4. CHANGELOG entry (27)

Goes into `docs/changes/CHANGELOG_3.x.md`, under "Unreleased":

```markdown
### Docs for coding agents

Unpoly's documentation is now available to coding agents and LLMs:

- Every page on unpoly.com is also available as Markdown. Append `.md` to its URL, e.g. [`/up.render.md`](https://unpoly.com/up.render.md). Agents that ask for `text/markdown` get it at the page's own URL.
- [`/llms.txt`](https://unpoly.com/llms.txt) lists all guides and API modules.
- An agent skill bundles all pages with a search script. Install it with `npx skills add https://unpoly.com`, or as a Claude Code plugin. See the [skill page](/skill).
```
