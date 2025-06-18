Feedback classes
================

Unpoly adds CSS classes to interactive elements that are loading content,
and to the fragments they are [targeting](/targeting-fragments).

[Styling](#styling) these "feedback classes" is [one way](/loading-state) to instantly signal
that a user interaction has been registered and that the app is working.


## Feedback when following links {#link}

We have a link targeting a fragment `#target`:

```html
<a href="/path" up-target="#target">Link</a>

<div id="target">
  Inital content
</div>
```

When the user clicks on the `/foo` link, the link is instantly assigned the `.up-active` class.
The [targeted](/targeting-fragments) fragment (the `<main>` element) gets the `.up-loading` class:

```html
<a href="/bar" up-target="#target" class="up-active">Bar</a> <!-- mark: up-active -->

<div id="target" class="up-loading"> <!-- mark: up-loading -->
  Initial content
</div>
```

Consider [styling](#styling) <code autolink="false">.up-active</code> and <code autolink="false">.up-loading</code>
to signal that the app is working.


### Classes are removed when the request ends

Feedback classes remain set while the request is loading.
Once the response is received the `.up-active` and `.up-loading` classes are removed:

```html
<a href="/path" up-target="#target">Link</a>

<div id="target">
  New content from server
</div>
```

Feedback classes will also be removed if the request ends for any other reason,
such as the [server rendering an error code](/failed-responses#fail-options)
or when the request is [aborted](/aborting-requests). See [How previews end](/previews#ending)
for more examples for what terminates a request.


## Conveying feedback with CSS styles {#styling}

To instantly signal that a user interaction has been registered,
consider highlighting active links and submit buttons in your CSS:

```css
.up-active:is(a, [up-follow], input[type=submit], button[type=submit], button:not([type])) {
  outline: 2px solid blue;
}
```

To convey which parts of the page have a pending update, consider styling targeted fragments:

```css
.up-loading {
  opacity: 0.6;
}
```

You can show a hidden loading message while a form is submitting:

```css
.spinner {
  display: none;
  
  form.up-active & {
    display: block;
  }
}
```

If these CSS rules are not enough, see [Loading state](/loading-state) for a variety
of other strategies. In particular [previews](/previews) give you access to both the origin and
targeted elements, and allow to make arbitrary changes to the page while a request loading.


## Feedback when submitting forms {#form}

We have a form targeting a fragment `#target`:

```html
<form action="/action" up-target="#target">
  <input type="text" name="email">
  <button type="submit">Submit</button>
</form>

<div id="target">
  Initial content
</div>
```

When the user clicks the submit button, both the button and the form are marked as `.up-active`
while the form is submitting. The targeted fragment is marked as `.up-loading`:

```html
<form action="/action" up-target="#target" class="up-active"> <!-- mark: up-active -->
  <input type="text" name="email">
  <button type="submit" class="up-active">Submit</button> <!-- mark: up-active -->
</form>

<div id="target" class="up-loading"> <!-- mark: up-loading -->
  Initial content
</div>
```

Consider [styling](#styling) <code autolink="false">.up-active</code> and <code autolink="false">.up-loading</code>
to signal that the app is working.


### Fields can be active origins

Sometimes a form is not submitted by pressing a submit button, but by interacting with an input field:

- The user submits by pressing `Return` inside a focused field.
- A field with `[up-autosubmit]` is changed
- A field with `[up-validate]` is changed

In these cases that field is considered the [origin](/origin) element that
caused the submission. It is also marked as `.up-active`, in addition to the form and its default submit button:

```html
<form action="/action" up-submit class="up-active"> <!-- mark: up-active -->
  <input type="text" name="email" class="up-active"> <!-- mark: up-active -->
  <button type="submit" class="up-active">Submit</button> <!-- mark: up-active -->
</form>
```


## Feedback classes from JavaScript

When rendering from JavaScript, Unpoly will set `.up-active` on the [origin](/origin) element
that caused the interaction. For example, when following a link with `up.follow()`, that link
will be `.up-active` while loading:

```js
up.follow(link)
```

In situations where Unpoly cannot guess the origin, you can pass it as an `{ origin }` option.
For example, when button click causes a render pass, that button should be the origin:

```js
up.on('click', '.my-button', function(event) {
  up.render({ url: '/path', origin: event.target }) // mark: origin
})
```


## Custom feedback classes {#custom-classes}

To set additional classes on activated [origins](/origin), push a class name to `up.status.config.activeClasses`:

```js
up.status.config.activeClasses.push('activated')
```

To set additional classes on targeted fragments that are loading new content, push
a class name to `up.status.config.loadingClasses`:

```js
up.status.config.loadingClasses.push('fetching')
```


## Disabling feedback classes

To disable feedback classes, set an
[`[up-feedback=false]`](/up-follow#up-feedback) attribute:


```html
<a href="/path" up-follow up-feedback="false">Link</a> <!-- mark: false -->
```


From JavaScript you may pass an [`{ feedback: false }`](/up.render#options.feedback) option:

```js
up.follow(link, { feedback: false }) // mark: false
```


@page feedback-classes
