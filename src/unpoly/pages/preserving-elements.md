Preserving elements
===================

Unpoly lets you preserve selected elements during rendering.

Preserved elements remain attached to their current position on the page, even when their parent element is replaced.


## Use cases

Unpoly apps rarely do fine-grained element updates, instead opting to update medium-sized fragments.\
However, there are use cases for preserving individual elements:

- Media elements (`<video>`, `<audio>`) that should retain their playback state during updates.
- Elements that are expensive to [initialize](/enhancing-elements), like heavy `<select>` replacements.
- Other elements with client-side state that is difficult to express in a URL or [data object](/data).

## Basic example

In the example below we want to preserve an `<audio>` element so it keeps playing
as content around it is updated. We can achieve this by setting an `[up-keep]` attribute
on the element we want to keep:

```html
<!-- label: Initial page -->
<div id="article">
  <p>Article 1</p>
  <audio id="player" up-keep src="song1.mp3"></audio> <!-- mark: up-keep -->
</div>

<a href="/article2" up-target="#article">Go to article 2</a>
```

When the link is clicked, Unpoly will request `/article2` and receives HTML like this:

```html
<!-- label: Response from the server -->
<div id="article">
  <p>Article 2</p>
  <audio id="player" up-keep src="song2.mp3"></audio>
</div>
```

Before Unpoly renders the new HTML, it tries to correlate `[up-keep]` elements within the current page
and the response.
Because the `<audio>` element's  [derived target](/target-derivation) (`#player`) matches in both the old and new content,
Unpoly can preserve it. Elements around it will be updated with new content, highlighted below:

```html
<!-- label: Page after update -->
<article>                                             <!-- mark-line -->
  <p>Article 2</p>                                    <!-- mark-line -->
  <audio id="player" up-keep src="song1.mp3"></audio> <!-- chip: preserved -->
</article>                                            <!-- mark-line -->

<a href="/article2" up-target="#article">Go to article 2</a> <!-- chip: not targeted -->
```


> [important]
> The `[up-keep]` element must have a [derivable target selector](/target-derivation)
> so its position within the old and new parents can be correlated.
> If Unpoly cannot uniquely identify the element within
> both the old and new content, the element cannot be preserved.



## Keep conditions {#conditions}

Sometimes we want more control over how long an element is preserved. For example, when we want to keep
similar elements until a substantial change is detected. 


### Keeping an element until its HTML changes {#same-html}

To preserve an element as long as its [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML) remains the same,
set an `[up-keep="same-html"]` attribute. Only when the element's attributes or children changes between versions,
it is replaced by the new version.

The example below uses a JavaScript-based `<select>` replacement like [Tom Select](https://tom-select.js.org/).
Because initialization is expensive, we want to preserve the element as long is possible. We *do* want to update
it when the server renders a different value, different options, or a validation error.
We can achieve this by setting `[up-keep="same-html"]` on a container that contains the select
and eventual error messages:

```html
<fieldset id="department-group" up-keep="same-html"> <!-- mark: up-keep="same-html" -->
  <label for="department">Department</label>
  <select id="department" name="department" value="IT">
    <option>IT</option>
    <option>Sales</option>
    <option>Production</option>
    <option>Accounting</option>
  </select>
  <!-- Eventual errors go here -->
</fieldset>
```

Unpoly will compare the element's **initial HTML** as it is rendered by the server.\
Client-side changes to the element (e.g. by a [compiler](/enhancing-elements)) are ignored.

Before the HTML is compared, **light normalization** is applied.\
You can customize normalization with `up.fragment.config.normalizeKeepHTML`.

### Keeping an element until its data changes {#same-data}

To preserve an element as long as its [data](/data) remains the same,
set an `[up-keep="same-data"]` attribute. Only when the element's `[up-data]` attribute changes between versions,
it is replaced by the new version. Changes in other attributes or its children are ignored.

The example below uses a [compiler](/enhancing-elements) to render an interactive map into elements with a `.map` class.
The initial map location is passed as an `[up-data]` attribute.
Because we don't want to lose client-side state (like pan or zoom settings), we want to keep the map widget
as long as possible. Only when the map's initial location changes, we want to re-render the map
centered around the new location. We can achieve this by setting an `[up-keep="same-data"]` attribute on
the map container:

```html
<div class="map" up-data="{ location: 'Hofbräuhaus Munich' }" up-keep="same-data"></div> <!-- mark: up-keep="same-data" -->
```

Instead of `[up-data]` we can also use HTML5 [`[data-*]` attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes):

```html
<div class="map" data-location="Hofbräuhaus Munich" up-keep="same-data"></div> <!-- mark: data-location="Hofbräuhaus Munich" -->
```

Unpoly will compare the element's **initial data** as it is rendered by the server.\
Client-side changes to the data object (e.g. by a [compiler](/enhancing-elements)) are ignored.

> [tip]
> Instead of re-rendering when data changes you can [inspect data in the new version](#updating-data)
> and update the existing element.


### Custom keep condition

You can define arbitrary conditions for keeping an element to JavaScript.

Let's say we only want to update an `<audio up-keep>` when its track changes.
In addition, we never want to update an audio element that is currently playing. 
We can achieve this by listening to `up:keep:fragment` and comparing the old and new elements.
When we prevent the event, the element is no longer kept and an update is forced:

```js
up.on('up:fragment:keep', 'audio', function(event) {
  let oldAudio = event.target
  let newAudio = event.newElement
  if (oldAudio.src !== newAudio.src && oldAudio.paused) {
    // Preventing the event forces an update
    event.preventDefault()
  }
})
```

Short keep conditions can also be inlined as an [`[up-on-keep]`](/up-keep#up-on-keep) attribute:

```html
<audio src="song.mp3" up-keep up-on-keep="if (!this.paused) event.preventDefault()"></audio> <!-- mark: up-on-keep="if (!this.paused) event.preventDefault()" -->
```

## Forcing an update {#forcing-updates}

There are many ways to force an update of an `[up-keep]` element:

- By giving the new element an `[up-keep=false]` attribute.
- By giving the new element a different `[id]` or `[up-id]` attribute so its [derived target](/target-derivation) no longer matches the existing element.
- By preventing the [`up:fragment:keep`](/up:fragment:keep) event that is emitted on the existing element.

You can also choose to render without keeping elements:

- Link or forms can force a swap of `[up-keep]` elements by setting an [`[up-use-keep=false]`](/up-follow#up-use-keep) attribute.
- Rendering functions can force a swap of `[up-keep]` elements by passing an [`{ keep: false }`](/up.render#options.keep) option.



## Updating data for kept elements {#updating-data}

Even when keeping elements, you may reconcile its [data object](/data) with the data
from the new element that was discarded.

Let's say you want to display a map within an element. The center of the map
is encoded using an `[up-data]` attribute:

```html
<div id="map" up-keep up-data="{ lat: 50.86, lng: 7.40 }"></div>
```

We can initialize the map using a [compiler](/enhancing-elements) like this:

```js
up.compiler('.map', function(element, data) {
  var map = new google.maps.Map(element)
  map.setCenter(data)
})
```

While we want to preserve the map during page loads, we *do* want to pick up
a new center coordinate when the containing fragment is updated. We can do so by
listening to an `up:fragment:keep` event and observing `event.newData`:

```js
up.compiler('.map', function(element, data) {
  var map = new google.maps.Map(element)
  map.setCenter(data)

  map.addEventListener('up:fragment:keep', function(event) { // mark-line
    map.setCenter(event.newData) // mark-line
  }) // mark-line
})
```

> [TIP]
> Instead of keeping an element and update its data you may also
> [preserve an element's data through reloads](/data#preserving).


@page preserving-elements
