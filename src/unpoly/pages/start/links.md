Link to a fragment
==================

Your first move with Unpoly is a link that updates a fragment,
instead of loading a full new page.


Following a link
----------------

Take any link in your app and add an `[up-follow]` attribute:

```html
<a href="/preferences" up-follow>Preferences</a> <!-- mark: up-follow -->
```

Click it. Unpoly fetches `/preferences` in the background, and your server
responds with a full HTML page, the same way it would for a regular page load.
Unpoly extracts the response's [main element](/main) and swaps it into the
current page. The URL and history are updated, and the Back button keeps working.

Your backend saw a normal request and rendered a normal page.
Nothing on the server needs to change.


Targeting a fragment
--------------------

To update a smaller fragment, name it with an `[up-target]` attribute:

```html
<nav>
  <a href="/pages/a" up-target="article">A</a> <!-- mark: up-target="article" -->
  <a href="/pages/b" up-target="article">B</a>
</nav>

<article>
  Page A
</article>
```

Clicking *B* fetches `/pages/b` and replaces only the `<article>` element with
its counterpart from the response. Everything around it keeps its state.

An `[up-target]` attribute implies `[up-follow]`, so you don't need to set both.



@page start/links
@signature
