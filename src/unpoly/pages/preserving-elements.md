Preserving elements
===================

An element with an `[up-keep]` attribute survives when the fragment around it is replaced.
A playing `<video>` or a map widget with its pan and zoom state stays where it is
while Unpoly updates everything around it.


Keeping an element
------------------

Set an `[up-keep]` attribute on the element you want to keep.
In the example below, an `<audio>` element keeps playing while the article around it changes:

```html
<!-- label: Initial page -->
<div id="article">
  <p>Article 1</p>
  <audio id="player" up-keep src="song1.mp3"></audio> <!-- mark: up-keep -->
</div>

<a href="/article2" up-target="#article">Go to article 2</a>
```

When the link is clicked, Unpoly requests `/article2` and receives HTML like this:

```html
<!-- label: Response from the server -->
<div id="article">
  <p>Article 2</p>
  <audio id="player" up-keep src="song2.mp3"></audio>
</div>
```

Before the new HTML is rendered, Unpoly looks for `[up-keep]` elements in the fragment that is about to be replaced.
For each one it [derives a target selector](/target-derivation) (here `#player`) and looks for a match in the new content.
When it finds one, the existing element is moved into the new fragment and its counterpart from the response is discarded.
Everything else is updated as usual:

```html
<!-- label: Page after update -->
<div id="article">                                    <!-- mark-line -->
  <p>Article 2</p>                                    <!-- mark-line -->
  <audio id="player" up-keep src="song1.mp3"></audio> <!-- chip: preserved -->
</div>                                                <!-- mark-line -->

<a href="/article2" up-target="#article">Go to article 2</a> <!-- chip: not targeted -->
```

The kept element is the *old* element, so it still plays `song1.mp3`.
Its event listeners and any state set by a [compiler](/enhancing-elements) survive the update.

> [important]
> The `[up-keep]` element needs a [derivable target selector](/target-derivation), like an `[id]`.
> If Unpoly cannot uniquely identify the element within both the old and the new content,
> the element is replaced like any other.

Elements can only be kept within the `<body>`. See `[up-keep]` for a few more limitations with media elements.


Keep conditions {#conditions}
---------------

By default an element is kept for as long as its target selector can be matched in the new content.
Often you want an element to live through small updates, but to be replaced once something substantial changes.


### Keeping an element until its HTML changes {#same-html}

To keep an element only as long as its [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML) stays the same,
set `[up-keep="same-html"]`. The element is only replaced when its attributes or children
differ between versions.

The example below uses a JavaScript-based `<select>` replacement like [Tom Select](https://tom-select.js.org/).
Because initialization is expensive, we want to keep the element as long as possible.
We *do* want to update it when the server renders a different value, different options, or a validation error.
We can achieve this by setting `[up-keep="same-html"]` on a container that holds both the select
and any error messages:

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

Unpoly compares the element's **initial HTML** as it was rendered by the server.
Changes made on the client, like elements inserted by a [compiler](/enhancing-elements), are ignored.

Before the HTML is compared, light normalization is applied: indentation and fluctuating attributes like CSP nonces are ignored.
You can customize this with `up.fragment.config.normalizeKeepHTML`.


### Keeping an element until its data changes {#same-data}

To keep an element only as long as its [data](/data) stays the same, set `[up-keep="same-data"]`.
The element is only replaced when its `[up-data]` attribute differs between versions.
Changes in other attributes or in its children are ignored.

The example below uses a [compiler](/enhancing-elements) to render an interactive map into elements with a `.map` class.
The initial map location is passed as an `[up-data]` attribute.
Because we don't want to lose client-side state like pan or zoom, we keep the map widget as long as possible.
Only when the map's initial location changes, we re-render the map around the new location:

```html
<div class="map" up-data="{ location: 'Hofbräuhaus Munich' }" up-keep="same-data"></div> <!-- mark: up-keep="same-data" -->
```

Instead of `[up-data]` we can also use HTML5 [`[data-*]` attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes):

```html
<div class="map" data-location="Hofbräuhaus Munich" up-keep="same-data"></div> <!-- mark: data-location="Hofbräuhaus Munich" -->
```

Unpoly compares the element's **initial data** as it was rendered by the server.
Changes to the data object made on the client, e.g. by a [compiler](/enhancing-elements), are ignored.

> [tip]
> Instead of re-rendering when data changes you can [inspect the data of the new version](#updating-data)
> and update the existing element.


### Custom keep conditions {#custom-keep-condition}

For conditions that HTML cannot express, listen to the `up:fragment:keep` event.
It is emitted on the existing element before it is kept.
The counterpart from the response is available as `event.newFragment`.
When you prevent the event, the element is not kept and the update is forced.

Let's say we only want to update an `<audio up-keep>` when its track changes,
and never while it is playing:

```js
up.on('up:fragment:keep', 'audio', function(event) {
  let oldAudio = event.target
  let newAudio = event.newFragment // mark: event.newFragment
  if (oldAudio.src !== newAudio.src && oldAudio.paused) {
    // Preventing the event forces an update
    event.preventDefault()
  }
})
```

Short conditions can also be inlined as an [`[up-on-keep]`](/up-keep#up-on-keep) attribute.
The snippet can access the old element as `this`, and the new element as `newFragment`:

```html
<audio src="song.mp3" up-keep up-on-keep="if (!this.paused) event.preventDefault()"></audio> <!-- mark: up-on-keep="if (!this.paused) event.preventDefault()" -->
```


Forcing an update {#forcing-updates}
-----------------

There are several ways to replace an `[up-keep]` element despite its attribute:

- Give the new element an `[up-keep="false"]` attribute. It then replaces the existing element,
  even if that element has `[up-keep]`.
- Give the new element a different `[id]` or `[up-id]` attribute,
  so its [derived target](/target-derivation) no longer matches the existing element.
- Prevent the `up:fragment:keep` event that is emitted on the existing element.

You can also render without keeping any elements at all:

- Links or forms can force a swap of all `[up-keep]` elements by setting an [`[up-use-keep="false"]`](/up-follow#up-use-keep) attribute.
- Rendering functions can force a swap by passing a [`{ keep: false }`](/up.render#options.keep) option.


Updating data for kept elements {#updating-data}
-------------------------------

Even when keeping an element, you may want to pick up the [data](/data)
from the new element that was discarded.

Let's say you want to display a map within an element. The center of the map
is encoded as an `[up-data]` attribute:

```html
<div class="map" up-keep up-data="{ lat: 50.86, lng: 7.40 }"></div>
```

We can initialize the map using a [compiler](/enhancing-elements) like this:

```js
up.compiler('.map', function(element, data) {
  var map = new google.maps.Map(element)
  map.setCenter(data)
})
```

While we want to keep the map during updates, we *do* want to pick up a new center coordinate
when the containing fragment is updated. We can do so by listening to the `up:fragment:keep` event
and reading the new element's data from `event.newData`:

```js
up.compiler('.map', function(element, data) {
  var map = new google.maps.Map(element)
  map.setCenter(data)

  element.addEventListener('up:fragment:keep', function(event) { // mark-line
    map.setCenter(event.newData) // mark-line
  }) // mark-line
})
```

If you only want to be notified after the decision was made, listen to `up:fragment:kept` instead.
It is emitted after all keep conditions have been evaluated and can no longer prevent the keeping.

> [tip]
> Instead of keeping an element and updating its data, you may also
> [preserve an element's data through reloads](/data#preserving).


@page preserving-elements
