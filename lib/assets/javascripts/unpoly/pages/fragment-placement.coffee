  ###**
  Fragment placement
  ==================

  This page outlines various ways to place new fragments in your existing DOM tree.


  \#\#\# Swapping fragments

  Pass a CSS selector like `{ target: '.content' }` to replace an existing element
  with a new version, usually fetched from the server via HTTP.

  The server may return additional HTML, but only the element matching the selector is used.
  All other HTML from the server response is discarded.


  \#\#\# Interaction origin is considered

  When a link or form updates a fragment, Unpoly will prefer to match fragments
  in the vicinity of that link or form element.

  For example, assume we have two links that replace `.card`:

  ```html
  <div class="card">
    Card #1 preview
    <a href="/cards/1" up-target=".card">Show full card #1</a>
  </div>

  <div class="card">
    Card #2 preview
    <a href="/cards/2" up-target=".card">Show full card #2</a>
  </div>
  ```

  When clicking on *"Show full card #2"*, Unpoly will replace the second card.
  The server should only render a single `.card` element.

  See `up.fragment.get()` for more examples and advanced use cases.


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
