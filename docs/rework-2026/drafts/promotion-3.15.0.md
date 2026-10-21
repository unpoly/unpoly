# Promotion for Unpoly 3.15.0

Drafts for launch day (decision R5: release notes intro, GitHub Discussion, tweets).
Henning posts them. Before posting, regenerate the Discussion body if the release notes changed.


## 1. Release notes intro

Done: it is the first three paragraphs of the 3.15.0 section in `docs/changes/CHANGELOG_3.x.md`.


## 2. GitHub Discussion

- Category: **Announcements**
- Title: **Unpoly 3.15.0 released**
- Body: `docs/rework-2026/drafts/discussion-3.15.0.md`

The body is the 3.15.0 section of the CHANGELOG, converted for GitHub: links point to
`https://unpoly.com/...`, the `// mark:` and `<!-- mark: -->` comments are removed from
code blocks (they only render on unpoly.com), and `> [note]` became `> [!NOTE]`.
It was generated from the `3.15.0-rc1` section on 2026-10-18. On launch day, rename the
heading to `3.15.0` and regenerate it the same way if the notes changed.


## 3. Tweets

All links point to pages of the new site, which exist once it is deployed.
Post the announcement first, then the others as replies or over the following days.

**Announcement**

> Unpoly 3.15 is out. It comes with a rewritten documentation site, made for humans and for coding agents, and support for custom form fields built as web components.
>
> Release notes: https://unpoly.com/changes/3.15.0

**Why this release**

> A lot has changed since our last release: many of us now write code together with AI agents. We believe hypermedia-driven apps fit this well. Less code, fewer dependencies and fewer moving parts make an app easier to understand and change, for humans and agents alike.

**The new docs**

> The new unpoly.com has a Learn area you can read like a book: a ten-minute Getting started guide, then 13 chapters from links and forms to backend integration. Every API page links to the guide that explains its topic.
>
> https://unpoly.com/learn

**The agent skill**

> Your coding agent can now read the same docs as you. The Unpoly skill gives it every guide, the full API reference and the release notes of all versions, with a search that works offline:
>
> npx skills add --global https://unpoly.com
>
> https://unpoly.com/learn/skill

**Markdown for agents**

> Every page on unpoly.com is also available as Markdown. Append .md to its URL, or ask for text/markdown in the Accept header. /llms.txt lists all guides and API modules.

**Custom form fields**

> Custom controls like date pickers can now take part in Unpoly forms like a native <input>. Unpoly builds request params with the browser's own form-data algorithm, so form-associated custom elements are submitted, watched and validated.
>
> https://unpoly.com/learn/custom-form-fields

**Unsaved changes**

> A new guide shows a small compiler that asks before the user loses changes in a form, on the page and in overlays.
>
> https://unpoly.com/learn/unsaved-changes

**Contributing**

> Want to contribute to Unpoly, or let your agent do it? A new contributor guide walks you through a first change, our test tooling and how the rendering core works. AGENTS.md points agents to it.
>
> https://github.com/unpoly/unpoly/blob/master/CONTRIBUTING.md
