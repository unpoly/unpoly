# Commit conventions

Never commit anything in `dist/` or `tmp/` — both are generated and gitignored.

Agents should ask their human before committing, pushing or opening a pull request.

> **TODO:** This guide is still an outline. The notes below are the intended scope,
> not finished prose.

- Main Module in square brackets
  - Don't need to list it all
  - E.g. `[link] Ignore clicks when user holds CTRL, Shift or Meta key`
  - E.g. `[layer] Dismiss popup when user clicks on background element`
  - E.g. `[form] Support form attribute to associate outside elements with a form ID`
- Sometimes there isn't a module, then we make up a term
  - E.g. `[build] Upgrade Webpack`
  - E.g. `[version] Bump version to 3.5.0`
  - E.g. `[specs] Replace old fixtures helper`
- CI runs for PRs
