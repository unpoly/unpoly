###*
Linking to page fragments
=========================

Standard HTML links are a poor fit for modern applications:

- State changes caused by AJAX updates get lost during the page transition.
- Unsaved form changes get lost during the page transition.
- The JavaScript VM is reset during the page transition.
- If the page layout is composed from multiple srollable containers
  (e.g. a pane view), the scroll positions get lost during the page transition.
- The user sees a "flash" as the browser loads and renders the new page,
  even if large portions of the old and new page are the same (navigation, layout, etc.).

Unpoly fixes this by letting you annotate  links with an [`up-target`](/a-up-target)
attribute. The value of this attribute is a CSS selector that indicates which page
fragment to update. The rest of the page will remain unchanged.


\#\#\# Example

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

Since we only want to update the `<article>` tag, we annotate the links
with an `up-target` attribute:

```
<nav>
  <a href="/pages/a" up-target="article">A</a>
  <a href="/pages/b" up-target="article">B</a>
  <a href="/pages/b" up-target="article">C</a>
</nav>
```

Note that instead of `article` you can use any other CSS selector like `#main .article`.

With these [`up-target`](/a-up-target) annotations Unpoly only updates the targeted part of the screen.
The JavaScript environment will persist and the user will not see a white flash while the
new page is loading.


\#\#\# Read on

- You can [animate page transitions](/up.motion) by definining animations for fragments as they enter or leave the screen.
- The `up-target` mechanism also works with [forms](/up.form).
- As you switch through pages, Unpoly will [update your browser's location bar and history](/up.history)
- You can [open fragments in popups or modal dialogs](/up.modal).
- You can give users [immediate feedback](/up.navigation) when a link is clicked or becomes current, without waiting for the server.
- [Controlling Unpoly pragmatically through JavaScript](/up.flow)
- [Defining custom tags](/up.syntax)

  
@class up.link
###

up.link = (($) ->

  u = up.util
  
  ###*
  Visits the given URL without a full page load.
  This is done by fetching `url` through an AJAX request
  and replacing the current `<body>` element with the response's `<body>` element.

  For example, this would fetch the `/users` URL:

      up.visit('/users')

  @function up.visit
  @param {String} url
    The URL to visit.
  @param {String} [options.target='body']
    The selector to replace.
  @param {Object} [options]
    See options for [`up.replace`](/up.replace)
  @stable
  ###
  visit = (url, options) ->
    options = u.options(options)
    selector = u.option(options.target, 'body')
    up.replace(selector, url, options)

  ###*
  Follows the given link via AJAX and [replaces](/up.replace) a CSS selector in the current page
  with corresponding elements from a new page fetched from the server.

  Any Unpoly UJS attributes on the given link will be honored. E. g. you have this link:

      <a href="/users" up-target=".main">Users</a>

  You can update the page's `.main` selector with the `.main` from `/users` like this:

      var $link = $('a:first'); // select link with jQuery
      up.follow($link);

  The UJS variant of this are the [`a[up-target]`](/a-up-target) and [`a[up-follow]`](/a-up-follow) selectors.

  @function up.follow
  @param {Element|jQuery|String} linkOrSelector
    An element or selector which resolves to an `<a>` tag
    or any element that is marked up with an `up-href` attribute.
  @param {String} [options.target]
    The selector to replace.
    Defaults to the `up-target` attribute on `link`, or to `body` if such an attribute does not exist.
  @param {String} [options.failTarget]
    The selector to replace if the server responds with a non-200 status code.
    Defaults to the `up-fail-target` attribute on `link`, or to `body` if such an attribute does not exist.
  @param {String} [options.fallback]
    The selector to update when the original target was not found in the page.
  @param {String} [options.method='get']
    The HTTP method to use for the request.
  @param {String} [options.confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the link is followed.
  @param {Function|String} [options.transition]
    A transition function or name.
  @param {Function|String} [options.failTransition]
    The transition to use if the server responds with a non-200 status code.
  @param {Number} [options.duration]
    The duration of the transition. See [`up.morph`](/up.morph).
  @param {Number} [options.delay]
    The delay before the transition starts. See [`up.morph`](/up.morph).
  @param {String} [options.easing]
    The timing function that controls the transition's acceleration. [`up.morph`](/up.morph).
  @param {Element|jQuery|String} [options.reveal]
    Whether to reveal the target  element within its viewport before updating.
  @param {Boolean} [options.restoreScroll]
    If set to `true`, this will attempt to [restore scroll positions](/up.restoreScroll)
    previously seen on the destination URL.
  @param {Boolean} [options.cache]
    Whether to force the use of a cached response (`true`)
    or never use the cache (`false`)
    or make an educated guess (`undefined`).
  @param {Object} [options.headers={}]
    An object of additional header key/value pairs to send along
    with the request.
  @param {Object} [options.timeout={}]
    A timeout in milliseconds for the request.
  @param {String} [options.layer='auto']
    The name of the layer that ought to be updated. Valid values are
    `auto`, `page`, `modal` and `popup`.

    If set to `auto` (default), Unpoly will try to find a match in the
    same layer as the given link. If no match was found in that layer,
    Unpoly will search in other layers, starting from the topmost layer.
  @return {Promise}
    A promise that will be resolved when the link destination
    has been loaded and rendered.
  @stable
  ###
  follow = (linkOrSelector, options) ->
    $link = $(linkOrSelector)

    options = u.options(options)

    url = u.option($link.attr('up-href'), $link.attr('href'))
    target = u.option(options.target, $link.attr('up-target'))
    options.failTarget = u.option(options.failTarget, $link.attr('up-fail-target'))
    options.fallback = u.option(options.fallback, $link.attr('up-fallback'))
    options.transition = u.option(options.transition, u.castedAttr($link, 'up-transition'), 'none')
    options.failTransition = u.option(options.failTransition, u.castedAttr($link, 'up-fail-transition'), 'none')
    options.history = u.option(options.history, u.castedAttr($link, 'up-history'))
    options.reveal = u.option(options.reveal, u.castedAttr($link, 'up-reveal'), true)
    options.cache = u.option(options.cache, u.castedAttr($link, 'up-cache'))
    options.restoreScroll = u.option(options.restoreScroll, u.castedAttr($link, 'up-restore-scroll'))
    options.method = followMethod($link, options)
    options.origin = u.option(options.origin, $link)
    options.layer = u.option(options.layer, $link.attr('up-layer'), 'auto')
    options.confirm = u.option(options.confirm, $link.attr('up-confirm'))
    options = u.merge(options, up.motion.animateOptions(options, $link))

    up.browser.whenConfirmed(options).then ->
      up.replace(target, url, options)

  ###*
  Returns the HTTP method that should be used when following the given link.

  Looks at the link's `up-method` or `data-method` attribute.
  Defaults to `"get"`.

  @function up.link.followMethod
  @param linkOrSelector
  @param options.method {String}
  @internal
  ###
  followMethod = (linkOrSelector, options) ->
    $link = $(linkOrSelector)
    options = u.options(options)
    u.option(options.method, $link.attr('up-method'), $link.attr('data-method'), 'get').toUpperCase()

  ###*
  @function up.link.childClicked
  @internal
  ###
  childClicked = (event, $link) ->
    $target = $(event.target)
    $targetLink = $target.closest('a, [up-href]')
    $targetLink.length && $link.find($targetLink).length
    
  shouldProcessLinkEvent = (event, $link) ->
    u.isUnmodifiedMouseEvent(event) && !childClicked(event, $link)

  followVariantSelectors = []

  ###*
  No-op that is called when we allow a browser's default action to go through,
  so we can spy on it in unit tests. See `link_spec.js`.

  @function allowDefault
  @internal
  ###
  allowDefault = (event) ->

  onAction = (selector, handler) ->
    followVariantSelectors.push(selector)
    handlerWithActiveMark = ($link) ->
      up.navigation.start $link, -> handler($link)
    up.on 'click', "a#{selector}, [up-href]#{selector}", (event, $link) ->
      if shouldProcessLinkEvent(event, $link)
        if $link.is('[up-instant]')
          # If the link was already processed on mousedown, we still need
          # to prevent this later click event's chain.
          up.bus.haltEvent(event)
        else
          up.bus.consumeAction(event)
          handlerWithActiveMark($link)
      else
        allowDefault(event)

    up.on 'mousedown', "a#{selector}[up-instant], [up-href]#{selector}[up-instant]", (event, $link) ->
      if shouldProcessLinkEvent(event, $link)
        up.bus.consumeAction(event)
        handlerWithActiveMark($link)

  ###*
  Returns whether the given link will be handled by Unpoly instead of making a full page load.

  A link will be handled by Unpoly if it has an attribute
  like `up-target` or `up-modal`.

  @function up.link.isFollowable
  @param {Element|jQuery|String} linkOrSelector
    The link to check.
  @experimental
  ###
  isFollowable = (link) ->
    $link = $(link)
    u.any followVariantSelectors, (selector) -> $link.is(selector)

  ###*
  Makes sure that the given link will be handled by Unpoly instead of making a full page load.

  This is done by giving the link an `up-follow` attribute
  unless it already have it an attribute like `up-target` or `up-modal`.

  @function up.link.makeFollowable
  @param {Element|jQuery|String} linkOrSelector
    The link to process.
  @experimental
  ###
  makeFollowable = (link) ->
    $link = $(link)
    unless isFollowable($link)
      $link.attr('up-follow', '')

  ###*
  Follows this link via AJAX and replaces a CSS selector in the current page
  with corresponding elements from a new page fetched from the server:

      <a href="/posts/5" up-target=".main">Read post</a>

  \#\#\# Updating multiple fragments

  You can update multiple fragments from a single request by separating
  separators with a comma (like in CSS). E.g. if opening a post should
  also update a bubble showing the number of unread posts, you might
  do this:

      <a href="/posts/5" up-target=".main, .unread-count">Read post</a>

  \#\#\# Appending or prepending instead of replacing

  By default Unpoly will replace the given selector with the same
  selector from a freshly fetched page. Instead of replacing you
  can *append* the loaded content to the existing content by using the
  `:after` pseudo selector. In the same fashion, you can use `:before`
  to indicate that you would like the *prepend* the loaded content.

  A practical example would be a paginated list of items. Below the list is
  a button to load the next page. You can append to the existing list
  by using `:after` in the `up-target` selector like this:

      <ul class="tasks">
        <li>Wash car</li>
        <li>Purchase supplies</li>
        <li>Fix tent</li>
      </ul>

      <a href="/page/2" class="next-page" up-target=".tasks:after, .next-page">
        Load more tasks
      </a>

  \#\#\# Following elements that are no links

  You can also use `[up-target]` to turn an arbitrary element into a link.
  In this case, put the link's destination into the `up-href` attribute:

      <button up-target=".main" up-href="/foo/bar">Go</button>

  Note that using any element other than `<a>` will prevent users from
  opening the destination in a new tab.

  @selector a[up-target]
  @param {String} up-target
    The CSS selector to replace
  @param {String} [up-method='get']
    The HTTP method to use for the request.
  @param {String} [up-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements.
  @param [up-fail-target='body']
    The selector to replace if the server responds with a non-200 status code.
  @param {String} [up-fail-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements
    when the server responds with a non-200 status code.
  @param {String} [up-fallback]
    The selector to update when the original target was not found in the page.
  @param {String} [up-href]
    The destination URL to follow.
    If omitted, the the link's `href` attribute will be used.
  @param {String} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the link is followed.
  @param {String} [up-reveal='true']
    Whether to reveal the target element within its viewport before updating.
  @param {String} [up-restore-scroll='false']
    Whether to restore previously known scroll position of all viewports
    within the target selector.
  @param {String} [up-cache]
    Whether to force the use of a cached response (`true`)
    or never use the cache (`false`)
    or make an educated guess (default).
  @param {String} [up-layer='auto']
    The name of the layer that ought to be updated. Valid values are
    `auto`, `page`, `modal` and `popup`.

    If set to `auto` (default), Unpoly will try to find a match in the
    same layer as the given link. If no match was found in that layer,
    Unpoly will search in other layers, starting from the topmost layer.
  @param [up-history]
    Whether to push an entry to the browser history when following the link.

    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
  @stable
  ###
  onAction '[up-target]', ($link) ->
    follow($link)

  ###*
  By adding an `up-instant` attribute to a link, the destination will be
  fetched on `mousedown` instead of `click` (`mouseup`).

      <a href="/users" up-target=".main" up-instant>User list</a>

  This will save precious milliseconds that otherwise spent
  on waiting for the user to release the mouse button. Since an
  AJAX request will be triggered right way, the interaction will
  appear faster.

  Note that using `[up-instant]` will prevent a user from canceling a link
  click by moving the mouse away from the interaction area. However, for
  navigation actions this isn't needed. E.g. popular operation
  systems switch tabs on `mousedown` instead of `click`.

  `up-instant` will also work for links that open [modals](/up.modal) or [popups](/up.popup).

  @selector [up-instant]
  @stable
  ###

  ###*
  If applied on a link, Follows this link via AJAX and replaces the
  current `<body>` element with the response's `<body>` element.

  To only update a fragment instead of the entire page, see
  [`a[up-target]`](/a-up-target).

  \#\#\# Example

      <a href="/users" up-follow>User list</a>

  \#\#\# Turn any element into a link

  You can also use `[up-follow]` to turn an arbitrary element into a link.
  In this case, put the link's destination into the `up-href` attribute:

      <span up-follow up-href="/foo/bar">Go</span>

  Note that using any element other than `<a>` will prevent users from
  opening the destination in a new tab.

  @selector a[up-follow]

  @param {String} [up-method='get']
    The HTTP method to use for the request.
  @param [up-fail-target='body']
    The selector to replace if the server responds with a non-200 status code.
  @param {String} [up-fallback]
    The selector to update when the original target was not found in the page.
  @param {String} [up-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements.
  @param {String} [up-fail-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements
    when the server responds with a non-200 status code.
  @param [up-href]
    The destination URL to follow.
    If omitted, the the link's `href` attribute will be used.
  @param {String} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the link is followed.
  @param {String} [up-history]
    Whether to push an entry to the browser history when following the link.

    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
  @param [up-restore-scroll='false']
    Whether to restore the scroll position of all viewports
    within the response.
  @stable
  ###
  onAction '[up-follow]', ($link) ->
    follow($link)

  ###*
  Marks up the current link to be followed *as fast as possible*.

  This is done by:

  - [Following the link through AJAX](/a-up-target) instead of a full page load
  - [Preloading the link's destination URL](/up-preload)
  - [Triggering the link on `mousedown`](/up-instant) instead of on `click`

  Use `up-dash` like this:

      <a href="/users" up-dash=".main">User list</a>

  Note that this is shorthand for:

      <a href="/users" up-target=".main" up-instant up-preload>User list</a>

  @selector [up-dash]
  @stable
  ###
  up.macro '[up-dash]', { priority: 'last' }, ($element) ->
    target = u.castedAttr($element, 'up-dash')
    $element.removeAttr('up-dash')
    newAttrs = {
      'up-preload': '',
      'up-instant': ''
    }
    if target is true
      # If it's literally `true` then we don't have a target selector.
      # Just follow the link by replacing `<body>`.
      makeFollowable($element)
    else
      newAttrs['up-target'] = target
    u.setMissingAttrs($element, newAttrs)

  ###*
  Add an `up-expand` class to any element that contains a link
  in order to enlarge the link's click area.

  `up-expand` honors all the UJS behavior in expanded links
  ([`up-target`](/a-up-target), [`up-instant`](/up-instant), [`up-preload`](/up-preload), etc.).

  \#\#\# Example

      <div class="notification" up-expand>
        Record was saved!
        <a href="/records">Close</a>
      </div>

  In the example above, clicking anywhere within `.notification` element
  would [follow](/up.follow) the *Close* link.

  `up-expand` also expands links that open [modals](/up.modal) or [popups](/up.popup).

  \#\#\# Elements with multiple contained links

  If a container contains more than one link, you can set the value of the
  `up-expand` attribute to a CSS selector to define which link should be expanded:

      <div class="notification" up-expand=".close">
        Record was saved!
        <a class="details" href="/records/5">Details</a>
        <a class="close" href="/records">Close</a>
      </div>

  @selector [up-expand]
  @param {String} [up-expand]
    A CSS selector that defines which containing link should be expanded.

    If omitted, the first contained link will be expanded.
  @stable
  ###
  up.macro '[up-expand]', { priority: 'last' }, ($area) ->
    $childLinks = $area.find('a, [up-href]')
    if selector = $area.attr('up-expand')
      $childLinks = $childLinks.filter(selector)
    if link = $childLinks.get(0)
      upAttributePattern = /^up-/
      newAttrs = {}
      newAttrs['up-href'] = $(link).attr('href')
      for attribute in link.attributes
        name = attribute.name
        if name.match(upAttributePattern)
          newAttrs[name] = attribute.value
      u.setMissingAttrs($area, newAttrs)
      $area.removeAttr('up-expand')
      makeFollowable($area)

  knife: eval(Knife?.point)
  visit: visit
  follow: follow
  makeFollowable: makeFollowable
  isFollowable: isFollowable
  shouldProcessLinkEvent: shouldProcessLinkEvent
  childClicked: childClicked
  followMethod: followMethod
  onAction: onAction

)(jQuery)

up.visit = up.link.visit
up.follow = up.link.follow
