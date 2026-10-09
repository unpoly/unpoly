Scrolling & focus
=================

After a fragment update, Unpoly decides what scrolls and what gets focus.
Following a link scrolls the new content into view and focuses it, the way a full page load would.
A minor update leaves scroll positions and focus where they are.
Every default can be changed per link, per form or globally.


Navigation defaults
-------------------

Take a link that updates the page's [main element](/main):

```html
<a href="/posts/5" up-follow>Read post</a>
```

When the new `<main>` is rendered, the page scrolls to the top and the main element receives focus.
A screen reader starts reading the new post, and a keyboard user continues tabbing from there.

Now take a link that updates a minor fragment:

```html
<a href="/posts/5/comments" up-target="#comments">Show comments</a> <!-- mark: up-target="#comments" -->
```

Nothing scrolls. Focus stays where it was, unless the user's focus was inside the old `#comments` element.
In that case focus moves to the new fragment (or to the counterpart of the element the user was in),
so the user is not dropped at the `<body>`.

Both behaviors are controlled by the `[up-scroll]` and `[up-focus]` attributes
(or the `{ scroll }` and `{ focus }` options in JavaScript).
Their default value `auto` is the sequence above. It applies whenever a link or form [navigates](/navigation).
Low-level calls like `up.render()` do not scroll or focus unless told to.

Scrolling an element into view is called *revealing* it.
The element that scrolls is a *viewport*. By default that is the document itself,
but an app with its own scrolling panels can mark each panel with an `[up-viewport]` attribute.


Scrolling to new content
------------------------

To scroll the updated fragment into view, set an `[up-scroll]` attribute:

```html
<a href="/posts/5/comments" up-target="#comments" up-scroll="target">Show comments</a> <!-- mark: up-scroll="target" -->
```

The viewport scrolls just far enough to make the new `#comments` element visible.
If it is already on screen, nothing moves.

Other values scroll to the `top` or `bottom`, reveal an element matching a CSS selector,
or `keep` the current positions through an update that would otherwise reset them.
Strategies can be combined, and `[up-scroll="false"]` turns scrolling off for a navigating link.

<p class="read-more"><a href="/scrolling">Read more: Scrolling</a></p>


Moving focus
------------

To place focus on a specific element after the update, set an `[up-focus]` attribute
with a CSS selector:

```html
<a href="/search" up-target=".content" up-focus="input[type=search]">Search</a> <!-- mark: up-focus="input[type=search]" -->
```

When the `.content` fragment is rendered, the search field is focused and the user can start typing.
Other values focus the new `target`, `keep` the focus in a re-rendered form field,
or `restore` the focus from an earlier visit of the same URL.

In an overlay, focus is trapped: tabbing past the last element wraps around to the start of the overlay.
Only [popups](/overlays#layer-modes) let focus leave.
When the overlay closes, focus returns to the link that opened it.

<p class="read-more"><a href="/focus">Read more: Controlling focus</a></p>


Showing or hiding focus rings
-----------------------------

Because Unpoly focuses new content, focus rings can appear where mouse users don't expect them.
Unpoly marks every element it focuses with an `.up-focus-visible` class when the user
interacted with the keyboard, and with `.up-focus-hidden` after a mouse or touch interaction:

```html
<main class="up-focus-hidden" tabindex="-1"> <!-- mark: class="up-focus-hidden" -->
  ...
</main>
```

Style these classes in your CSS to show rings for keyboard users only.
Unpoly's default stylesheet already removes the outline from `.up-focus-hidden` elements.

<p class="read-more"><a href="/focus-visibility">Read more: Focus ring visibility</a></p>


Also in this topic
------------------

To declare navigation bars that obstruct the viewport, animate the scroll motion, or add padding when revealing an element, see [[scroll-tuning]].

When the user presses the back button, scroll positions and focus are restored to where they were. See [[restoring-history]].

Loading more items as the user scrolls down is a [live fragment](/live-fragments) rather than a scroll option. See [[infinite-scrolling]].

@page scrolling-and-focus
@menu-title Overview
@signature
