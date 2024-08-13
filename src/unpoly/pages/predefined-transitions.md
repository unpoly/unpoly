Predefined transitions
======================

Unpoly ships with a number of generic [transitions](/up.motion#transitions)
you can use in an `[up-transition]` attribute or a `{ transition }` option:


| Transition   | Visual effect  |
|--------------|----------------|
| `cross-fade` | Fades out the first element. Simultaneously fades in the second element. |
| `move-up`    | Moves the first element upwards until it exits the screen at the top edge. Simultaneously moves the second element upwards from beyond the bottom edge of the screen until it reaches its current position. |
| `move-down`  | Moves the first element downwards until it exits the screen at the bottom edge. Simultaneously moves the second element downwards from beyond the top edge of the screen until it reaches its current position. |
| `move-left`  | Moves the first element leftwards until it exists the screen at the left edge. Simultaneously moves the second element leftwards from beyond the right  edge of the screen until it reaches its current position. |
| `move-right` | Moves the first element rightwards until it exists the screen at the right edge. Simultaneously moves the second element rightwards from beyond the left edge of the screen until it reaches its current position. |
| `none`       | A transition that has no visible effect. Sounds useless at first, but can save you a lot of `if` statements. |


## Combining animations

You can compose a transition from two [named animations](/predefined-animations).
separated by a slash character (`/`):

- `move-to-bottom/fade-in`
- `move-to-left/move-from-top`


## Custom transitions

To define a custom transition, use `up.transition()`.


@page predefined-transitions
