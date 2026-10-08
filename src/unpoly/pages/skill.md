Agent skill
===========

Unpoly's documentation is available as an agent skill for AI coding tools. Once
installed, your coding agent can look up how Unpoly works, its best practices and
exact API details, instead of guessing from what it remembers.

The skill holds every guide, the full API reference and the release notes of Unpoly
[[=version]] as Markdown files, with a search script your agent runs locally. That is
faster than fetching pages from the web, and works offline.


## Install with `npx skills` {#npx-skills}

This works with Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI and most other
coding agents. In your project, run:

```bash
npx skills add https://unpoly.com
```

The [skills CLI](https://github.com/vercel-labs/skills) asks which agents to install
the skill for. To install it for all your projects instead, add `-g`.

The skill does not update itself. To get the docs of a newer Unpoly version, run:

```bash
npx skills update
```

Optionally, [nudge your agent into using the skill](#make-your-agent-use-it) for all
Unpoly work.


## Install as a Claude Code plugin {#claude-code}

In Claude Code you can also install the skill as a plugin from Unpoly's marketplace:

```text
/plugin marketplace add https://unpoly.com/claude-plugins/marketplace.json
/plugin install unpoly@unpoly
```

See [Discover and install plugins](https://code.claude.com/docs/en/plugins/install) in
the Claude Code documentation for more.

To update, run `/plugin marketplace update unpoly`. Claude Code doesn't update plugins
from third-party marketplaces automatically, unless you turn on auto-update for the
`unpoly` marketplace in the `/plugin` menu.

Optionally, [nudge your agent into using the skill](#make-your-agent-use-it) for all
Unpoly work.

### Team setup

To offer the plugin to everyone working on your project, add the marketplace to the
project's `.claude/settings.json`. Claude Code then asks each team member to install it
when they trust the project folder:

```json
{
  "extraKnownMarketplaces": {
    "unpoly": {
      "source": {
        "source": "url",
        "url": "https://unpoly.com/claude-plugins/marketplace.json"
      }
    }
  },
  "enabledPlugins": {
    "unpoly@unpoly": true
  }
}
```


## Make your agent use it {#make-your-agent-use-it}

Agents don't always reach for a skill on their own. Add this line to your project's
`AGENTS.md` or `CLAUDE.md`, so your agent consults the docs whenever it works with
Unpoly:

```markdown
When working with Unpoly (`up-*` attributes, `up.*` functions, `up:*` events), consult the unpoly-docs skill before guessing.
```


## Use without installing {#without-installing}

Every page of these docs is also available as Markdown. Append `.md` to its URL, e.g.
<https://unpoly.com/up.render.md>. Agents that ask for Markdown get it at the page's own
URL.

In a plain AI chat, paste <https://unpoly.com/llms.txt>. It lists all guides and API
modules, with links the chat can follow.


@page skill
