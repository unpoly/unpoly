Loading state
=============

While Unpoly waits for the server, it can show loading state: a highlighted button,
a dimmed fragment, a spinner, a skeleton screen or even the expected result.
Every effect appears instantly after the user's interaction and is reverted when the request ends.


Styling loading elements
------------------------

When the user clicks a link or submits a form, Unpoly adds an `.up-active` class to that element,
and an `.up-loading` class to the fragment it is targeting:

```html
<a href="/stories/5" up-target="#story" class="up-active">Read story</a> <!-- mark: class="up-active" -->

<div id="story" class="up-loading"> <!-- mark: class="up-loading" -->
  Old content
</div>
```

Style these classes in your CSS to show that the app is working:

```css
.up-active {
  outline: 2px solid blue;
}

.up-loading {
  opacity: 0.6;
}
```

Both classes are removed when the response arrives.
To also disable a form's fields and buttons while it submits, see [[disabling-forms]].

<p class="read-more"><a href="/feedback-classes">Read more: Feedback classes</a></p>


Showing placeholders
--------------------

A placeholder is a spinner or UI skeleton shown within the targeted fragment while it is loading.
Set the placeholder's HTML as an `[up-placeholder]` attribute:

```html
<a href="/stories/5" up-target="#story" up-placeholder="<p>Loading…</p>">Read story</a> <!-- mark: up-placeholder="<p>Loading…</p>" -->
```

While the request is loading, the existing content of `#story` is hidden
and the placeholder is shown in its place:

```html
<div id="story">
  <p>Loading…</p> <!-- mark-line -->
  <up-wrapper hidden>Old content</up-wrapper>
</div>
```

Placeholders can also be cloned from a [template](/templates),
so you can reuse the same skeleton for many links.

<p class="read-more"><a href="/placeholders">Read more: Placeholders</a></p>


Previews: arbitrary temporary changes
-------------------------------------

Feedback classes and placeholders are *previews*: temporary page changes that Unpoly
applies when a request starts, and reverts when the request ends.
You can define your own preview with `up.preview()`:

```js
up.preview('link-spinner', function(preview) {
  preview.insert(preview.origin, '<img src="spinner.gif">')
})
```

Links and forms refer to a preview by its name:

```html
<a href="/stories/5" up-follow up-preview="link-spinner">Read story</a> <!-- mark: up-preview="link-spinner" -->
```

When the user clicks, the spinner is appended to the link. When the request ends,
the spinner is removed. This holds for any outcome: when the server responds with an error,
when the request is aborted, or when the server ends up updating a different fragment.
The page is always restored to a consistent state before the response is rendered.

<p class="read-more"><a href="/previews">Read more: Previews</a></p>


Optimistic rendering
--------------------

A preview can go beyond signaling and show the expected result before the server confirms it.
This is called *optimistic rendering*. For example, a preview can read the submitted
form data from `preview.params` and append a new item to a list:

```js
up.preview('add-task', function(preview) {
  let text = preview.params.get('text') // mark: preview.params
  let task = `<div class="task">${up.util.escapeHTML(text)}</div>`
  preview.insert('#tasks', task)
})
```

The item appears instantly. When the server responds, the optimistic change is reverted
and replaced by the server-rendered list.

<p class="read-more"><a href="/optimistic-rendering">Read more: Optimistic rendering</a></p>


Also in this topic
------------------

When a request takes longer than 400 ms, Unpoly shows a thin progress bar at the top of the screen.
To style, disable or replace it, see [[progress-bar]].

Loading state ends when the request ends. Requests that fail because the user is offline
are handled in [[network-issues]].


@page loading-state
@menu-title Overview
@signature
