Switching form state
====================

A field with an `[up-switch]` attribute controls the state of other elements when its value changes.
The switching happens on the client, without a server request.

Common effects are [showing, hiding](#toggle) or [disabling](#disable) another element.
You can also implement [custom switching effects](#custom-effects).

> [tip]
> The `[up-switch]` attribute handles light, client-side effects.
> For effects that render on the server, see [[reactive-server-forms]].


## Showing or hiding other elements {#toggle}

The controlling form field gets an `[up-switch]` attribute with a selector for the elements to show or hide:

```html
<select name="level" up-switch=".level-dependent"> <!-- mark: up-switch=".level-dependent" -->
  <option value="beginner">Beginner</option>
  <option value="intermediate">Intermediate</option>
  <option value="expert">Expert</option>
</select>
```

The target elements use [`[up-show-for]`](/up-show-for) and [`[up-hide-for]`](/up-hide-for)
attributes to declare for which values they are shown or hidden:

```html
<div class="level-dependent" up-show-for="beginner"> <!-- mark: up-show-for="beginner" -->
  shown for beginner level, hidden for other levels
</div>

<div class="level-dependent" up-hide-for="beginner"> <!-- mark: up-hide-for="beginner" -->
  hidden for beginner level, shown for other levels
</div>
```

Elements are switched when the page loads and whenever the field changes.
A hidden element gets a `[hidden]` attribute.

By default the entire form is searched for matching elements. This can be [configured](#region).

You can also toggle an element [for multiple values](#multiple-values).


## Disabling or enabling fields {#disable}

The controlling field gets an `[up-switch]` attribute with a selector
for the fields to disable or enable:

```html
<select name="role" up-switch=".role-dependent">
  <option value="trainee">Trainee</option>
  <option value="manager">Manager</option>
</select>
```

The target fields use [`[up-enable-for]`](/up-enable-for) and [`[up-disable-for]`](/up-disable-for)
attributes to declare for which values they are enabled or disabled:

```html
<!-- The department field is only enabled for managers -->
<input class="role-dependent" name="department" up-enable-for="manager"> <!-- mark: up-enable-for="manager" -->

<!-- The mentor field is only enabled for trainees -->
<input class="role-dependent" name="mentor" up-disable-for="manager"> <!-- mark: up-disable-for="manager" -->
```

When the target is a container, all fields and buttons within are disabled or enabled.


## Switching for multiple values {#multiple-values}

To switch for multiple values, separate them with a space or comma:

```html
<div class="level-dependent" up-show-for="intermediate expert"> <!-- mark: up-show-for="intermediate expert" -->
  only shown for intermediate and expert levels
</div>
```

If your values might contain spaces, you may also serialize them as a [relaxed JSON](/relaxed-json) array:

```html
<div class='level-dependent' up-show-for='["John Doe", "Jane Doe"]'> <!-- mark: up-show-for='["John Doe", "Jane Doe"]' -->
  You selected John or Jane Doe
</div>
```


## Switching on blank or present values {#presence}

Instead of switching on specific string values, you can use `:blank` to match an empty input value:

```html
<input type="text" name="user" up-switch=".target">

<div class="target" up-show-for=":blank"> <!-- mark: up-show-for=":blank" -->
  please enter a username
</div>
```

Inversely, `:present` matches any non-empty input value:

```html
<div class="target" up-hide-for=":present"> <!-- mark: up-hide-for=":present" -->
  please enter a username
</div>
```


## Usage with checkboxes {#checkboxes}

For checkboxes you may match against the pseudo-values `:checked` or `:unchecked`:

```html
<input type="checkbox" name="flag" up-switch=".flag-dependent">

<div class="flag-dependent" up-show-for=":checked"> <!-- mark: up-show-for=":checked" -->
  only shown when checkbox is checked
</div>

<div class="flag-dependent" up-show-for=":unchecked"> <!-- mark: up-show-for=":unchecked" -->
  only shown when checkbox is unchecked
</div>
```

You may also match against the `[value]` attribute of the checkbox element:

```html
<input type="checkbox" name="flag" value="active" up-switch=".flag-dependent">

<div class="flag-dependent" up-show-for="active"> <!-- mark: up-show-for="active" -->
  only shown when checkbox is checked
</div>
```

### Array fields {#array-fields}

When you have multiple checkboxes for a single [array field](/up.form.config#config.arrayParam),
set `[up-switch]` on an element containing all checkboxes:

```html
<div up-switch=".department-dependent"> <!-- mark: up-switch=".department-dependent" -->
  <input type="checkbox" name="department[]" value="development"> Development
  <input type="checkbox" name="department[]" value="sales"> Sales
  <input type="checkbox" name="department[]" value="accounting"> Accounting
</div>

<div class="department-dependent" up-show-for="sales, accounting">
  shown when either sales or accounting is checked
</div>
```


## Usage with radio buttons {#radio-buttons}

Use `[up-switch]` on a container for a radio button group:

```html
<div up-switch=".level-dependent"> <!-- mark: <div> -->
  <input type="radio" name="level" value="beginner">
  <input type="radio" name="level" value="intermediate">
  <input type="radio" name="level" value="expert">
</div> <!-- mark: </div> -->

<div class="level-dependent" up-show-for="beginner">
  shown for beginner level, hidden for other levels
</div>

<div class="level-dependent" up-hide-for="beginner">
  hidden for beginner level, shown for other levels
</div>
```


## Changing the switched region {#region}

By default the entire form is searched for matching elements.
You can narrow or expand the search scope by setting an [`[up-switch-region]`](/up-switch#up-switch-region)
attribute on the controlling field.

To match all elements within the current [layer](/up.layer), set the region to `:layer`:

```html
<form method="post" action="/order">
  <select name="payment" up-switch=".payment-info" up-switch-region=":layer"> <!-- mark: up-switch-region=":layer" -->
    <option value="paypal">PayPal</option>
    <option value="manual">Manual wire transfer</option>
  </select>
</form>

<div class="payment-info" up-show-for="paypal">
  You will be redirected to PayPal to complete your order.
</div>

<div class="payment-info" up-show-for="manual">
  We will ship your package once we receive your transfer.
</div>
```


## Reacting to different events {#reacting-to-different-events}

By default switch effects are applied for every [`input`](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) event.
For example, text fields switch other elements as the user is typing:

```html
<input type="text" name="user" up-switch=".user-dependent">

<div class="user-dependent" up-show-for="alice">
  only shown for user alice
</div>
```

You can watch for other events by setting an [`[up-watch-event]`](/up-switch#up-watch-event) attribute.
For example, listening to `change` waits until the text field is blurred
before applying any switching effects:

```html
<input type="text" name="user" up-switch=".user-dependent" up-watch-event="change"> <!-- mark: up-watch-event="change" -->
```

When watching a fast-firing event like `input`,
you can debounce the switching effect
with an [`[up-watch-delay]`](/up-switch#up-watch-delay) attribute:

```html
<input type="text" name="user" up-switch=".user-dependent" up-watch-event="input" up-watch-delay="150"> <!-- mark: up-watch-delay="150" -->
```

See [[watch-options]] for all options to control how changes are observed.


## Custom switching effects {#custom-effects}

`[up-switch]` lets you implement your own switching effects.
For example, we want a custom `[highlight-for]` attribute. It draws a bright
outline around the department field when the manager role is selected:

```html
<select name="role" up-switch=".role-dependent">
  <option value="trainee">Trainee</option>
  <option value="manager">Manager</option>
</select>

<input class="role-dependent" name="department" highlight-for="manager"> <!-- mark: highlight-for="manager" -->
```

When the role select changes, an `up:form:switch` event is emitted on all elements matching `.role-dependent`.
We can use this event to implement our custom `[highlight-for]` effect:

```js
up.on('up:form:switch', '[highlight-for]', (event) => {
  let highlightedValue = event.target.getAttribute('highlight-for')
  let isHighlighted = (event.field.value === highlightedValue)
  event.target.style.outline = isHighlighted ? '2px solid orange' : '' // mark: outline
})
```

The event is also emitted when the page loads, so elements start in the correct state.
See `up:form:switch` for all event properties and when it is emitted.


@page switching-form-state
@signature
