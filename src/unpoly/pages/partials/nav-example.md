Let's look at a simple menu with two links:

```html
<nav> <!-- mark-phrase "up-nav" -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</nav>
```

When the browser location changes to `/foo`, the first link is marked as `.up-current`:

```html
<nav>
  <a href="/foo" class="up-current">Foo</a> <!-- mark-phrase "up-current" -->
  <a href="/bar">Bar</a>
</nav>
```

When the browser location changes to `/bar`, the first link loses its `.up-current` class.
Now the second link is marked as `.up-current`:

```html
<nav>
  <a href="/foo">Foo</a>
  <a href="/bar" class="up-current">Bar</a> <!-- mark-phrase "up-current" -->
</nav>
```

@partial nav-example
