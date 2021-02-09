  ###**
  Fragment placement
  ==================

  This page outlines various ways to place new fragments in your existing DOM tree.


  \#\#\# Swapping fragments

  Pass a CSS selector like `{ target: '.content' }` to replace an existing element
  with a new version, usually fetched from the server via HTTP.

  The server may return additional HTML, but only the element matching the selector is used.
  All other HTML from the server response is discarded.


  \#\#\# How existing fragments are matched

  Unpoly applies some optimizations when matching an existing fragment for a CSS selector.

  For example, when a click link triggers a fragment update, the link's DOM position is considered
  when matching fragments.

  See `up.fragment.get()` for details.


  \#\#\# Updating multiple fragments

  You can update multiple fragments from a single request by separating
  separators with a comma (like in CSS).

  For instance, if opening a post should
  also update a bubble showing the number of unread posts, you might
  do this:

  ```html
  <a href="/posts/5" up-target=".content, .unread-count">Read post</a>
  ```

  \#\#\# Appending or prepending content

  By default Unpoly will replace the given selector with the same
  selector from the server response. Instead of replacing you
  can *append* the loaded content to the existing content by using the
  `:after` pseudo selector. In the same fashion, you can use `:before`
  to *prepend* the loaded content.

  A practical example would be a paginated list of items. Below the list is
  a button to load the next page. You can append to the existing list
  by using `:after` in the `[up-target]` selector like this:

  ```html
  <ul class="tasks">
    <li>Wash car</li>
    <li>Purchase supplies</li>
    <li>Fix tent</li>
  </ul>

  <a href="/page/2" class="next-page" up-target=".tasks:after, .next-page">
    Load more tasks
  </a>
  ```

  \#\#\# Replacing an element's inner HTML

  If you would like to preserve the target element, but replace all of its child content,
  use the `:content` pseudo selector:

  ```
  <a href="/cards/5" up-target=".card:content">Show card #5</a>
  ```

  For more advanced cases of preserving elements, see `[up-keep]`.

  @page fragment-placement
  ###
