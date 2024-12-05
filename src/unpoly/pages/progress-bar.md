Progress bar
============

When requests are [taking long]((/up:network:late)) to load, Unpoly will show a thin progress bar at the top edge of the screen.

![Progress bar animation](images/progress-bar.gif)

This mimics similiar loading indicators by browsers, which only appear during full page loads.



## Styling the progress bar

The progress bar is implemented as a single `<up-progress-bar>` element.
Unpoly will automatically insert and remove this element as requests
are [late](/up:network:late) or [recovered](up:network:recover).

You may style the progress bar element using CSS:

```css
up-progress-bar {
  background-color: red;
}
```


## Controlling when the progress bar appears

Unpoly will show the progress bar when a request is taking longer to respond
than `up.network.config.lateDelay`.

You may override this per-request by using the [`{ lateDelay }`](/up.render#options.lateDelay)
option or [`[up-late-delay]`](/up-follow#up-late-delay) attribute. Passing `{ lateDelay: false }` will
never show a progress bar for that request.

Requests that are loading in the background should never show the progress bar. 
You may move a request into the background by passing an [`{ background: true }`](/up.render#options.background) option
or setting an [`[up-background]`](/up-follow#up-background) attribute.  Requests from [preloading](/preloading) or [polling](/up-poll) are automatically
marked as background requests.

To disable the progress bar globally, configure `up.network.config.progressBar = false`.

## Disabling

The progress bar can be disabled entirely:

```js
up.network.config.progressBar = false
```



Custom loading indicators
-------------------------

If you don't like the default progress bar, you can observe the `up:network:late`
and [`up:network:recover`](/up:network:recover) events to implement a custom
loading indicator that appears during long-running requests.

To build a custom loading indicator, place an element like this in your application layout:

```html
<loading-indicator>Please wait!</loading-indicator>
```

Now add a [compiler](/up.compiler) that hides the `<loading-indicator>` element
while there are no long-running requests:

```js
// Disable the default progress bar
up.network.config.progressBar = false

up.compiler('loading-indicator', function(indicator) {
  function show() { up.element.show(indicator) }
  function hide() { up.element.hide(indicator) }

  hide()

  return [
    up.on('up:network:late', show),
    up.on('up:network:recover', hide)
  ]
})
```

When you have implemented a custom loading indicator, you may want to disable the default progress bar
by configuring `up.network.config.progressBar = false`.



### Advanced loading state

Unpoly allows you to make arbitrary changes to individual fragments while they are loading.

See [Loading state](/loading-state) for details.



@page progress-bar
