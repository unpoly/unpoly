Page flow
=========

Just like in a classical web application, the server renders a series of *full HTML pages*.

Given a tabbed navigation for three pages:

```
  /pages/a                /pages/b                /pages/c

+---+---+---+           +---+---+---+           +---+---+---+
| A | B | C |           | A | B | C |           | A | B | C |
|   +--------  (click)  +---+   +----  (click)  +---+---+   |
|           |  ======>  |           |  ======>  |           |
|  Page A   |           |  Page B   |           |  Page C   |
|           |           |           |           |           |
+-----------|           +-----------|           +-----------|
```

Your markup markup could look like this:

```
<nav>
  <a href="/pages/a">A</a>
  <a href="/pages/b">B</a>
  <a href="/pages/b">C</a>
</nav>

<article>
    Page A
</article>
```

Slow, full page loads. White flash during loading.


Smoother flow by updating fragments
-----------------------------------

In Up.js you annotate navigation links with an `up-target` attribute.
The value of this attribute is a CSS selector that indicates which page
fragment to update.

Since we only want to update the ´<article>` tag, we will use `up-target="article`:


```
<nav>
  <a href="/pages/a" up-target="article">A</a>
  <a href="/pages/b" up-target="article">B</a>
  <a href="/pages/b" up-target="article">C</a>
</nav>
```

Instead of `article` you can use any other CSS selector (e. g.  `#main .article`).

With these `up-target` annotations Up.js only updates the targeted part of the screen.
Javascript will not be reloaded, no white flash during a full page reload.


Read on
-------

- You can [animate page transitions](#) by definining animations for fragments as they enter or leave the screen.
- The `up-target` mechanism also works with [forms](#form).
- As you switch through pages, Up.js will [update your browser's location bar and history](#history)
- You can [open fragments in popups or modal dialogs](#modal).
- You can give users [immediate feedback](#navigation) when a link is clicked or becomes current, without waiting for the server.
- [Controlling Up.js pragmatically through Javascript](#???)
- [Defining custom tags and event handlers](#magic)










