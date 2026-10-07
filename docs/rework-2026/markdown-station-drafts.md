# Markdown station — drafts awaiting review

Prose for places this station does not land itself (decisions 17A+, 26A, 27). Each draft
says where it goes. Wording is open for Henning's review; the content track lands the
install section at ship time.


## 1. Install page section (26A)

Goes into `src/unpoly/pages/install.md`, after "Installing from npm" and before "Optional
extensions". Owner: content track.

~~~~markdown
## Docs for coding agents {#agents}

Coding agents work better with Unpoly when they read its documentation instead of
guessing. Install the docs as an agent skill in your project:

```bash
npx skills add https://unpoly.com
```

The skill holds every guide and API page of Unpoly [[=version]] as Markdown files, with a
search script your agent can run. It works with Claude Code, Codex, Cursor, Copilot,
Gemini CLI and about 80 other agents.

Then tell your agent when to use it. Add this line to your project's `AGENTS.md` or
`CLAUDE.md`:

```markdown
When working with Unpoly (`up-*` attributes, `up.*` functions, `up:*` events), consult the unpoly-docs skill before guessing.
```

<details>
<summary>Other ways to give your agent the docs</summary>

**Claude Code plugin.** Instead of `npx skills`, you can install the skill from Unpoly's
plugin marketplace:

```text
/plugin marketplace add https://unpoly.com/claude-plugins/marketplace.json
/plugin install unpoly@unpoly
```

**Markdown on unpoly.com.** Every page of these docs is also available as Markdown: append
`.md` to its URL, e.g. <https://unpoly.com/up.render.md>. Start with
<https://unpoly.com/llms.txt>, which lists all guides and API modules. Agents that ask for
Markdown get it at the page's own URL.

</details>
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
version of the same lead.


## 3. README section (27)

Goes into `README.md` of the unpoly repo, as a new section after "Getting started":

```markdown
Docs for coding agents
----------------------

- Install Unpoly's documentation as an agent skill: `npx skills add https://unpoly.com`.
- Every page on unpoly.com is also available as Markdown: append `.md` to its URL.
  [llms.txt](https://unpoly.com/llms.txt) lists them all.
- See [Docs for coding agents](https://unpoly.com/install#agents) for the Claude Code plugin and the
  line to add to your `AGENTS.md`.
```


## 4. CHANGELOG entry (27)

Goes into `docs/changes/CHANGELOG_3.x.md`, under "Unreleased":

```markdown
### Docs for coding agents

Unpoly's documentation is now available to coding agents and LLMs:

- Every page on unpoly.com is also available as Markdown. Append `.md` to its URL, e.g. [`/up.render.md`](https://unpoly.com/up.render.md). Agents that ask for `text/markdown` get it at the page's own URL.
- [`/llms.txt`](https://unpoly.com/llms.txt) lists all guides and API modules.
- An agent skill bundles all pages with a search script. Install it with `npx skills add https://unpoly.com`, or as a Claude Code plugin. See [Docs for coding agents](/install#agents).
```
