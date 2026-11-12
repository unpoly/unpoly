# up.FocusCapsule.prototype.autoVoid()

Invalidates this capsule when an explicit focus change by the user was detected.

Call it *after* your own focus-losing DOM mutation:

```js
let capsule = up.FocusCapsule.preserve(layer)
domChangeThatMayLoseFocus() // e.g. disabling
capsule.autoVoid()
await timeInWhichUserMayChangeFocusExplictly()
capsule.restore()
```

@function up.FocusCapsule.prototype.autoVoid
@internal
