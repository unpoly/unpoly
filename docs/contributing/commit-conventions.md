# Commit conventions

How we write commits and what happens to them: the namespace prefix every subject carries, how
mechanical changes keep `git blame` useful, and what CI runs when you open a pull request.

## Message prefix

Every commit subject begins with the [namespace](code-organization.md#responsibilities)
it affects, in square brackets:

```
[link] Ignore clicks when user holds CTRL, Shift or Meta key
[layer] Dismiss popup when user clicks on background element
[form] Support form attribute to associate outside elements with a form ID
```

If a change touches several namespaces, name the one it is mainly about. You don't need
to list them all.

Some commits don't belong to a namespace. Make up a term that reads like one:

```
[build] Upgrade esbuild
[version] Version 3.5.0
[specs] Replace old fixtures helper
[docs] Document optimistic rendering
```


## Mechanical changes

A mechanical change, like a scripted refactoring, a rename, reformatting or moving code,
goes into its own commit, without hand edits mixed in. End its message with the trailer
`Blame-Ignore: true`, so we can list it in `.git-blame-ignore-revs` and `git blame` skips
it. `git blame -w` already ignores whitespace changes, and `git blame -C -C` follows code
that moved between files.

```
[util] Rename u.foo() to u.bar()

Blame-Ignore: true
```


## Continuous integration

CI runs the whole suite in multiple Chrome configurations: without CSP, under a nonce-only
CSP, under a strict-dynamic CSP, against the `unpoly-migrate` build, against the ES6
build, against the minified build and against the minified ES6 build. Separate jobs run
`bin/lint`, `bin/typecheck` and the tooling's own tests (`bin/self-test`).

It runs on every pull request against `master`, and on every push to `master`.
