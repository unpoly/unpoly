Hungry elements
===============

An element with an `[up-hungry]` attribute is updated whenever a server response
contains a matching element, even when the render pass targeted something else.
This keeps elements in your application layout fresh, like an unread counter
or a notification bar, without naming them in every link's target.


## Marking an element as hungry {#marking}

Some elements live in the application layout, outside of the fragment that links
and forms usually target. Examples include:

- Unread message counters
- Page-specific subnavigation
- Account-wide notifications, e.g. about an expired credit card

Instead of including such elements in every [target selector](/targeting-fragments),
like `.content, .unread-count:maybe`, mark the element as `[up-hungry]`:

```html
<div class="unread-count" up-hungry> <!-- mark: up-hungry -->
  2 new messages
</div>
```

Now any link or form that updates a fragment on the page will also update the counter:

```html
<a href="/messages/5" up-target=".content">Read message</a>
```

When the response for `/messages/5` contains an `.unread-count` element, it replaces
the hungry element on the page, in the same render pass that updates `.content`.
When the response contains no `.unread-count` element, the counter stays as it is.
No error is thrown.

The server is not told about hungry elements. It renders its page as usual,
and Unpoly looks for matches in whatever the response contains. If your server
[renders only the targeted fragments](/optimizing-responses), make sure to still
include hungry elements in the response.


## A derivable target is required {#derivable-target}

To find a hungry element's counterpart in the response, Unpoly [derives a target selector](/target-derivation)
from the element. For this the element needs an [identifying attribute](/target-derivation#derivation-patterns),
such as an `[id]` or a unique `[class]`.

When no good target can be derived, the element is excluded from the update and a message
like this is [logged](/up.log):

```text
[up-hungry] Ignoring untargetable fragment <div>
```


## Animating the update {#animation}

A hungry element can define its own [transition](/up-transition) to morph between
its old and new content, independent of the primary target:

```html
<div class="unread-count" up-hungry up-transition="cross-fade"> <!-- mark: up-transition="cross-fade" -->
  2 new messages
</div>
```

You can also set `[up-duration]` and `[up-easing]` attributes, as on a link.


## Updating only sometimes {#conditions}

Before a hungry element is added to a render pass, an `up:fragment:hungry` event is emitted on the element.
Prevent the event to skip the hungry element for that render pass.

For example, a subnavigation should only update when the user navigates to another page.
A form validation that targets a fieldset should not replace it.
The following only updates `#side-nav` for render passes that [update history](/updating-history):

```js
up.on('up:fragment:hungry', '#side-nav', function(event) {
  if (!event.renderOptions.history) event.preventDefault() // mark: event.preventDefault()
})
```

The same condition fits into an `[up-on-hungry]` attribute, with `event` and `renderOptions` available
as variables:

```html
<nav id="side-nav" up-hungry up-on-hungry="if (!renderOptions.history) event.preventDefault()"> <!-- mark: up-on-hungry -->
  ...
</nav>
```

You may also decide based on the *new* element that would replace the hungry element,
which the event exposes as `event.newFragment`. This skips an update when the new element is marked as empty:

```js
up.on('up:fragment:hungry', '.unread-count', function(event) {
  if (event.newFragment.classList.contains('is-empty')) event.preventDefault()
})
```


## Hungry elements on other layers {#layers}

By default a hungry element is only updated by render passes on its own [layer](/up.layer).
When an overlay renders, a hungry element on the root layer is left alone.

To also update a hungry element when other layers render, set an [`[up-if-layer]`](/up-hungry#up-if-layer) attribute.
A notification bar in the root layout can pick up notifications from any overlay
with `[up-if-layer="subtree"]`:

```html
<div id="notifications" up-hungry up-if-layer="subtree"> <!-- mark: up-if-layer="subtree" -->
  Your credit card has expired.
</div>
```

The attribute takes a [layer reference](/layer-option) relative to the hungry element's layer.
Use `any` to piggy-back on render passes for all layers, or combine references like `current or child`.

This also works when a response [closes an overlay](/closing-overlays): the content of that
response is discarded for the overlay, but hungry elements on other layers still pick up their matches.
The `[up-flashes]` element uses this to show confirmation messages from a closing overlay in the parent layer.


## Disabling hungry updates {#disabling}

Hungry elements are processed for all updates on their layer. To exclude them from a render pass:

- Set an [`[up-use-hungry="false"]`](/up-follow#up-use-hungry) attribute on a link or form.
- Pass a [`{ hungry: false }`](/up.render#options.hungry) option when rendering from JavaScript.
- Prevent the `up:fragment:hungry` event, as [shown above](#conditions).

To exclude a single element, set `[up-hungry="false"]` on the element.


## Making other elements hungry {#config}

Instead of annotating each element, you can configure selectors for elements that should
always be hungry in `up.radio.config.hungrySelectors`:

```js
up.radio.config.hungrySelectors.push('.unread-count')
```

Such elements still need a [derivable target](#derivable-target).
Exceptions go into `up.radio.config.noHungrySelectors`.


## Resolving conflicts {#conflicts}

Each element in a response can only be inserted once. When hungry elements conflict
with each other or with the primary target, Unpoly decides as follows:

1. When both a [target selector](/targeting-fragments) and a hungry element match the same element
   in the response, only the direct render target is updated.
2. When hungry elements are nested within each other, the outermost element is updated.
3. When hungry elements on different layers match the same element in the response,
   the layer closest to the rendering layer wins.

Keep hungry elements to a few layout elements, and prefer explicit render targets for everything else.


@page hungry-elements
@signature
