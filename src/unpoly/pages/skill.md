Agent skill
===========

Unpoly's documentation is available as an agent skill for AI coding tools. Once
installed, your coding agent can look up how Unpoly works, its best practices and
exact API details, instead of guessing from what it remembers.

The skill holds every guide, the full API reference and the release notes of all
versions as Markdown files, with a search script your agent runs locally. That is
faster than fetching pages from the web, and works offline. The release notes also help
when your agent upgrades an app from an older Unpoly version.


## Install with `npx skills` {#npx-skills}

This works with all coding agents and needs [Node.js](https://nodejs.org). Run:

```bash
npx skills add --global https://unpoly.com
```

The [skills CLI](https://github.com/vercel-labs/skills) asks which agents to install
the skill for. To share the skill with your team instead, run the command in your
project's directory without `--global` and commit the skill's files. Teammates then get
it with your repository.

**The skill does not update itself.** To get the latest docs, run:

```bash
npx skills update --global
```

Optionally, [nudge your agent into using the skill](#make-your-agent-use-it) for all
Unpoly work.


## Install as a Claude Code plugin {#claude-code}

If you use Claude Code, you can instead install the skill as a plugin. Plugins can update
automatically, and you don't need Node.js:

```text
/plugin marketplace add https://unpoly.com/claude-plugins/marketplace.json
/plugin install unpoly@unpoly
```

See [Discover and install plugins](https://code.claude.com/docs/en/plugins/install) in
the Claude Code documentation for more.

**To update**, run `/plugin marketplace update unpoly`. Claude Code doesn't update plugins
from third-party marketplaces automatically, unless you turn on auto-update for the
`unpoly` marketplace in the `/plugin` menu.

Optionally, [nudge your agent into using the skill](#make-your-agent-use-it) for all
Unpoly work.

### Team setup

To offer the plugin to everyone working on your project, add the marketplace and the
plugin to the project's `.claude/settings.json`. Once a team member trusts the project
folder, Claude Code installs the plugin for them:

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
When working with Unpoly (`up-*` attributes, `up.*` functions, `up:*` events), consult the `/unpoly-docs` skill before guessing.
```


## Use without installing {#without-installing}

Every page of these docs is also available as Markdown. Click the Markdown icon next to
the page title, or append `.md` to the page's URL, e.g.
[[[=base_url]]/up.render**.md**]([[=base_url]]/up.render.md).

To give an AI chat a single page, use the copy button next to the page title. It copies
the page as Markdown, ready to paste.

To give an AI chat broad context about Unpoly, paste <https://unpoly.com/llms.txt>. It
lists all guides and API modules, with links the chat can follow.


@page skill
