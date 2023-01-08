Predefined transitions
======================

Unpoly ships with a number of generic [transitions](/up.motion#transitions)
you can use in an `[up-transition]` attribute or a `{ transition }` option:


| Animation          | Visual effect  |
|--------------------|----------------|
| `fade-in`          | Changes the element's opacity from 0% to 100% |
| `fade-out`         | Changes the element's opacity from 100% to 0% |
| `move-to-top`      | Moves the element upwards until it exits the screen at the top edge |
| `move-from-top`    | Moves the element downwards from beyond the top edge of the screen until it reaches its current position |
| `move-to-bottom`   | Moves the element downwards until it exits the screen at the bottom edge |
| `move-from-bottom` | Moves the element upwards from beyond the bottom edge of the screen until it reaches its current position |
| `move-to-left`     | Moves the element leftwards until it exists the screen at the left edge |
| `move-from-left`   | Moves the element rightwards from beyond the left edge of the screen until it reaches its current position |
| `move-to-right`    | Moves the element rightwards until it exists the screen at the right edge |
| `move-from-right`  | Moves the element leftwards from beyond the right  edge of the screen until it reaches its current position |
| `none`             | An animation that has no visible effect. Sounds useless at first, but can save you a lot of `if` statements. |


## Combining animations

You can compose a transition from two [named animations](/predefined-animations).
separated by a slash character (`/`):

- `move-to-bottom/fade-in`
- `move-to-left/move-from-top`


## Custom transitions

To define a custom transition, use `up.transition()`.


@page predefined-transitions
