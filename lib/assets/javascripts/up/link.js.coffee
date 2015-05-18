###*
Linking to page fragments
=========================

Just like in a classical web application, an Up.js app renders a series of *full HTML pages* on the server.

Let's say we are rendering three pages with a tabbed navigation to switch between screens:

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

Your HTML could look like this:

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

Since we only want to update the `<article>` tag, we will use `up-target="article"`:


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
- You can [animate page transitions](/up.motion) by definining animations for fragments as they enter or leave the screen.
- The `up-target` mechanism also works with [forms](/up.form).
- As you switch through pages, Up.js will [update your browser's location bar and history](/up.history)
- You can [open fragments in popups or modal dialogs](/up.modal).
- You can give users [immediate feedback](/up.navigation) when a link is clicked or becomes current, without waiting for the server.
- [Controlling Up.js pragmatically through Javascript](/up.flow)
- [Defining custom tags and event handlers](/up.magic)

  
@class up.link
###

up.link = (->

  u = up.util
  
  ###*
  Visits the given URL without a full page load.
  This is done by fetching `url` through an AJAX request
  and replacing the current `<body>` element with the response's `<body>` element.
  
  @method up.visit
  @param {String} url
    The URL to visit.
  @param {Object} options
    See options for [`up.replace`](/up.flow#up.replace)
  @example
      up.visit('/users')
  ###
  visit = (url, options) ->
    u.debug "Visiting #{url}"
    # options = util.options(options, )
    up.replace('body', url, options)

  ###*
  Follows the given link via AJAX and replaces a CSS selector in the current page
  with corresponding elements from a new page fetched from the server.
  
  @method up.follow
  @param {Element|jQuery|String} link
    An element or selector which resolves to an `<a>` tag
    or any element that is marked up with an `up-follow` attribute.
  @param {String} [options.target]
    The selector to replace.
    Defaults to the `up-target` attribute on `link`,
    or to `body` if such an attribute does not exist.
  @param {Function|String} [options.transition]
    A transition function or name.
  ###
  follow = (link, options) ->
    $link = $(link)

    options = u.options(options)
    url = u.option($link.attr('href'), $link.attr('up-follow'))
    selector = u.option(options.target, $link.attr('up-target'), 'body')
    options.transition = u.option(options.transition, $link.attr('up-transition'), $link.attr('up-animation')) 
    options.history = u.option(options.history, $link.attr('up-history'))
    
    up.replace(selector, url, options)

  resolve = (element) ->
    $element = $(element)
    followAttr = $element.attr('up-follow')
    if $element.is('a') || (u.isPresent(followAttr) && !u.castsToTrue(followAttr))
      $element
    else
      $element.find('a:first')
      
  ###*
  Follows this link via AJAX and replaces a CSS selector in the current page
  with corresponding elements from a new page fetched from the server:

      <a href="/users" up-target=".main">User list</a>
  
  By also adding an `up-instant` attribute, the page will be fetched
  on `mousedown` instead of `click`, making the interaction even faster:
  
      <a href="/users" up-target=".main" up-instant>User list</a>
  
  Note that using `[up-instant]` will prevent a user from canceling a link
  click by moving the mouse away from the interaction area. However, for
  navigation actions this isn't needed. E.g. popular operation
  systems switch tabs on `mousedown`.

  @method a[up-target]
  @ujs
  @param {String} up-target
    The CSS selector to replace
  @param up-instant
    If set, fetches the element on `mousedown` instead of `click`.
    This makes the interaction faster.
  ###
  up.on 'click', 'a[up-target]', (event, $link) ->
    event.preventDefault()
    # Check if the event was already triggered by `mousedown`
    unless $link.is('[up-instant]')
      follow($link)
    
  up.on 'mousedown', 'a[up-target][up-instant]', (event, $link) ->
    if event.which is 1
      event.preventDefault()
      follow($link)

  ###
  @method up.link.childClicked
  @private
  ###
  childClicked = (event, $link) ->
    $target = $(event.target)
    $targetLink = $target.closest('a, [up-follow]')
    $targetLink.length && $link.find($targetLink).length
    
  ###*
  If applied on a link, Follows this link via AJAX and replaces the
  current `<body>` element with the response's `<body>` element

      <a href="/users" up-follow>User list</a>
  
  See [`[up-dash]`](/up.link#up-dash) for a variant of `[up-target]` that
  comes with additional 

  You can also apply `[up-follow]` to any element that contains a link
  in order to enlarge the link's click area:

      <div class="notification" up-follow>
         Record was saved!
         <a href="/records">Close</a>
      </div>

  In the example above, clicking anywhere within `.notification` element
  would follow the `Close` link.

  @method [up-follow]
  @ujs
  @param {String} [up-follow]
  @param up-instant
    If set, fetches the element on `mousedown` instead of `click`.
    This makes the interaction faster.
  ###
  up.on 'click', '[up-follow]', (event, $element) ->
    unless childClicked(event, $element)
      event.preventDefault()
      # Check if the event was already triggered by `mousedown`
      unless $element.is('[up-instant]')
        follow(resolve($element))
        
  up.on 'mousedown', '[up-follow][up-instant]', (event, $element) ->
    if !childClicked(event, $element) && event.which == 1
      event.preventDefault()
      follow(resolve($element))
  
  ###
  Marks up the current link to be followed *as fast as possible*.
  This is done by:
  
  - [Following the link through AJAX](/up.link#up-target) instead of a full page load
  - [Preloading the link's destination URL](/up.proxy#up-preload)
  - [Triggering the link on `mousedown`](/up.link#up-instant) instead of on `click`
  
  Use `up-dash` like this:
  
      <a href="/users" up-dash=".main">User list</a>
  
  Note that this is shorthand for:
  
    <a href="/users" up-target=".main" up-instant up-preload>User list</a>  

  You can also apply `[up-dash]` to any element that contains a link
  in order to enlarge the link's click area:

      <div class="notification" up-dash>
         Record was saved!
         <a href="/records" up-dash='.main'>Close</a>
      </div>
  
  @method [up-dash]
  @ujs
  ###
  up.awaken '[up-dash]', ($element) ->
    target = $element.attr('up-dash')
    newAttrs = {
      'up-preload': 'true',
      'up-instant': 'true'
    }
    if u.isBlank(target) || u.castsToTrue(target)
      newAttrs['up-follow'] = ''
    else
      newAttrs['up-target'] = target
    u.setMissingAttrs($element, newAttrs)
    $element.removeAttr('up-dash')
    
  visit: visit
  follow: follow
  resolve: resolve
  childClicked: childClicked

)()

up.visit = up.link.visit
up.follow = up.link.follow
