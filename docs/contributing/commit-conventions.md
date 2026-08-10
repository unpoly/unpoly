# Commit conventions

## Message prefix

Every commit subject begins with the [main module](code-organization.md#responsibilities)
it affects, in square brackets:

```
[link] Ignore clicks when user holds CTRL, Shift or Meta key
[layer] Dismiss popup when user clicks on background element
[form] Support form attribute to associate outside elements with a form ID
```

If a change touches several modules, name the one it is mainly about. You don't need
to list them all.

Some commits don't belong to a module. Make up a term that reads like one:

```
[build] Upgrade Webpack
[version] Version 3.5.0
[specs] Replace old fixtures helper
[docs] Document optimistic rendering
```


## Continuous integration

CI runs the whole suite in multiple Chrome configurations: without CSP, under a nonce-only
CSP, under a strict-dynamic CSP, against the `unpoly-migrate` build, against the ES6
build and against the minified build.

It runs on every pull request against `master`, and on every push to `master`.


## If you are an agent

Ask your human before committing, pushing or opening a pull request.
