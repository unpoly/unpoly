# Code check notes (2026-10-16)

Scope: ~776 fenced blocks in src/unpoly/pages, ~500 in JS doc comments, site-only pages (index.html.erb, skills/unpoly-docs/skill.txt.erb, examples/).

Plan: 9 parallel reviewers, one per area; each writes findings-<area>.md in this dir.
I check the site-only pages myself and spot-verify severity-1 findings before aggregating.

## Site-only pages (checked myself)
- index.html.erb: all 21 events in the event groups exist (@event grep). `<main up-poll>` derivable ('main' deriver, fragment.js:229). `<a href up-defer>` derivable via 'a[href]' (fragment.js:240). up.layer.ask({url}) exists (layer.js:818). up.submit(selector, {params}) OK (params/up.submit/request.md). Teardown claim: destructors run in beforeRemove (update_steps.js:127) before old element removed -> OK. No findings.
- skills/unpoly-docs/skill.txt.erb: only shell commands. No findings.
- examples/* (unpoly-site/examples): up-transition=move-left/right, up-layer=new, up-target=.one -> fine. No findings.
- changes/*: skipped (changelogs).
