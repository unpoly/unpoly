Switching form state
====================

A field with the `[up-switch]` attribute can control the state of other element when the field changes.

Common effects are [showing, hiding](#toggle) or [disabling](#disable} another element.
You can also implement [custom switching effects](#custom).

## Showing or hiding other elements {#toggle}

The controlling form field gets an `[up-switch]` attribute with a selector for the elements to show or hide:

```html
<select name="level" up-switch=".level-dependent">
  <option value="beginner">beginner</option>
  <option value="intermediate">intermediate</option>
  <option value="expert">expert</option>
</select>
```

The target elements can use [`[up-show-for]`](/up-show-for) and [`[up-hide-for]`](/up-hide-for)
attributes to indicate for which values they should be shown or hidden:

```html
<div class="level-dependent" up-show-for="beginner"> <!-- mark-phrase "up-show-for" -->
  shown for beginner level, hidden for other levels
</div>

<div class="level-dependent" up-hide-for="beginner"> <!-- mark-phrase "up-hide-for" -->
  hidden for beginner level, shown for other levels
</div>
```

By default the entire form will be searched for matches. This can be [configured](#region).

To toggle an element [for multiple values](#multiple-values), separate with a comma:

```
<div class="level-dependent" up-show-for="intermediate, expert"> <!-- mark-phrase "up-show-for" -->
  only shown for intermediate and expert levels
</div>
```

## Disabling or hiding fields {#disable}

The controlling field gets an `[up-switch]` attribute with a selector
for the fields to disable for enable:

```html
<select name="role" up-switch=".role-dependent">
  <option value="trainee">Trainee</option>
  <option value="manager">Manager</option>
</select>
```

The target elements can use [`[up-enable-for]`](/up-enable-for) and [`[up-disable-for]`](/up-disable-for)
attributes to indicate for which values they should be shown or hidden:

```html
<!-- The department field is only shown for managers -->
<input class="role-dependent" name="department" up-enable-for="manager"> <!-- mark-phrase "up-enable-for" -->

<!-- The mentor field is only shown for trainees -->
<input class="role-dependent" name="mentor" up-disable-for="manager"> <!-- mark-phrase "up-disable-for" -->
```

## Custom switching effects {#custom-effects}

`[up-switch]` allows you to implement your own switching effects.
For example, we want a custom `[highlight-for]` attribute. It draws a bright
outline around the department field when the manager role is selected:

```html
<select name="role" up-switch=".role-dependent">
  <option value="trainee">Trainee</option>
  <option value="manager">Manager</option>
</select>

<input class="role-dependent" name="department" highlight-for="manager"> <!-- mark-phrase "highlight-for" -->
```

When the role select changes, an `up:form:switch` event is emitted on all elements matching `.role-dependent`.
We can use this event to implement our custom `[highlight-for]` effect:

```js
up.on('up:form:switch', '[highlight-for]', (event) => {
  let highlightedValue = event.target.getAttribute('highlight-for')
  let isHighlighted = (event.field.value === readonlyValue)
  event.target.style.highlight = isHighlighted ? '2px solid orange' : ''
})
```

> [tip]
> To implement asynchronous effects that are rendered on the server, see [Reactive server forms](/reactive-server-forms).

## Switching for multiple values {#multiple-values}

To switch for multiple values, separate them with a comma:

```html
<div class="level-dependent" up-show-for="intermediate, expert"> <!-- mark-phrase "intermediate, expert" -->
  only shown for intermediate and expert levels
</div>
```

If your values might contain spaces, you may also serialize them as a [relaxed JSON](/relaxed-json) array:

```html
<div class='level-dependent' up-show-for='["John Doe", "Jane Doe"]'> <!-- mark-phrase '["John Doe", "Jane Doe"]' -->
  You selected John or Jane Doe
</div>
```

## Switching on blank or present values {#presence}

Instead of switching on specific string values, you can use `:blank` to match an empty input value:

```html
<input type="text" name="user" up-switch=".target"> <!-- mark-phrase ":blank" -->

<div class="target" up-show-for=":blank">
  please enter a username
</div>
```

Inversely, `:present` will match any non-empty input value:

```html
<div class="target" up-hide-for=":present"> <!-- mark-phrase ":present" -->
  please enter a username
</div>
```


## Usage with checkboxes {#checkboxes}

For checkboxes you may match against the pseudo-values `:checked` or `:unchecked`:

```html
<input type="checkbox" name="flag" up-switch=".flag-dependent">

<div class="flag-dependent" up-show-for=":checked">
  only shown when checkbox is checked
</div>

<div class="flag-dependent" up-show-for=":unchecked">
  only shown when checkbox is unchecked
</div>
```

You may also match against the `[value]` attribute of the checkbox element:

```html
<input type="checkbox" name="flag" value="active" up-switch=".flag-dependent">

<div class="flag-dependent" up-show-for="active">
  only shown when checkbox is checked
</div>
```

## Usage with radio buttons {#radio-buttons}

Use `[up-switch]` on a container for a radio button group:

```html
<div up-switch=".level-dependent"> <!-- mark-phrase "div" -->
  <input type="radio" name="level" value="beginner">
  <input type="radio" name="level" value="intermediate">
  <input type="radio" name="level" value="expert">
</div> <!-- mark-phrase "div" -->

<div class="level-dependent" up-show-for="beginner">
  shown for beginner level, hidden for other levels
</div>

<div class="level-dependent" up-hide-for="beginner">
  hidden for beginner level, shown for other levels
</div>
```

## Changing the switched region {#region}

By default the entire form will be searched for matches.
You can narrow or expand the search scope by setting an [`[up-switch-region]`](/up-switch#up-switch-region)
attribute on the controlling field.

To match all elements within the current [layer](/up.layer), set the region to `:layer`:

```
<form method="post" action="/order">
  <select name="payment" up-switch="#info" up-switch-region=":layer"> <!-- mark-phrase "up-switch-region" -->
    <option value="paypal">PayPal</option>
    <option value="manual">Manual wire transfer</option>
  </select>
</form>

<div id="info" up-show-for="paypal">
  You will be redirected to PayPal to complete your order.
</div>

<div id="info" up-show-for="manual">
  We will ship your package once we receive your transfer.
</div>
```

## Reacting to different events

By default switch effects are applied for every [`input`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input) event.
For example, text fields will switch other elements as the user is typing:

```html
<input type="text" name="user" up-switch=".user-dependent">

<div class="user-dependent" up-show-for="alice">
  only shown for user alice
</div>
```

You can watch for other events by setting an [`[up-watch-event]`](/up-switch#up-watch-event) attribute.
For example, listening to `change` will wait until the text field is blurred
before applying any switching effects:

```html
<input type="text" name="user" up-switch=".user-dependent" up-watch-event="change"> <!-- mark-phrase "up-watch-event" -->
```

When watching a fast-firing event like `input`,
you can debounce the switching effect
with an [`[up-watch-delay]`](/up-switch#up-watch-delay) attribute:

```html
<input type="text" name="user" up-switch=".user-dependent" up-watch-event="input" up-watch-delay="150"> <!-- mark-phrase "up-watch-delay" -->
```


@page switching-form-state
