Attaching data to elements
==========================

Unpoly lets you attach structured data to an element, to be consumed
by a [compiler](/enhancing-elements) or [event handler](/up.on).

Use HTML5 `data-*` attributes for simple string values. When your data has
structure, `[up-data]` takes any JSON. Compilers can also read any other
attribute directly.


## Using data attributes for simple key/value pairs {#data-attributes}

You may use HTML5 [`[data-*]` attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)
to attach simple string values:

```html
<span class='user' data-age='18' data-name='Bob'>Bob</span>
```

An object with all data attributes will be passed to your [compilers](/enhancing-elements)
as a second argument:

```js
up.compiler('.user', function(element, data) { // mark: data
  console.log(data.age)  // result: "18"
  console.log(data.name) // result: "Bob"
})
```

> [important]
> Data attributes always have string values. In the example above `data.age` is the string `"18"`.

Data attributes with multiple, dash-separated words in their name can be accessed with `camelCase` keys:

```html
<span class='user' data-first-name='Alice' data-last-name='Anderson'>Alice</span>
```

```js
up.compiler('.user', function(element, data) {
  console.log(data.firstName) // result: "Alice"
  console.log(data.lastName)  // result: "Anderson"
})
```

## Describing structured data with `[up-data]` {#up-data-attribute}

HTML5 data attributes cannot express structured data, like an array or object.
Also their values are always strings.

For a more powerful alternative you can set the `[up-data]` attribute to any
[relaxed JSON](/relaxed-json) value:

```html
<div class="google-map" up-data="{ pins: [
  { lat: 48.36, lng: 10.99, title: 'Friedberg' },
  { lat: 48.75, lng: 11.45, title: 'Ingolstadt' }
] }"></div>
```

The JSON will be parsed and passed to your compiler function as a second argument:

```js
up.compiler('.google-map', function(element, data) { // mark: data
  var map = new google.maps.Map(element)
  for (let pin of data.pins) {
    var position = new google.maps.LatLng(pin.lat, pin.lng)
    new google.maps.Marker({ position, map, title: pin.title })
  }
})
```

### All JSON values can be data

`[up-data]` lets us attach many value types, like arrays (`pins`), objects (`pin`) and numbers (`pin.lat`).

The topmost expression is usually an object, but may be any JSON-serializable value:

```html
<ol class="high-scores" up-data="[910, 720, 554]">...</ol>
```

```js
up.compiler('.high-scores', function(element, data) {
  console.log(data) // result: [910, 720, 554]
})
```

### Merging data attributes

If `[up-data]` is a JSON object, any HTML5 data attributes will be merged into the parsed value:

```html
<span class="user" data-name="Bob" up-data="{ age: 18 }">Bob</span>
```

```js
up.compiler('.user', function(element, data) {
  console.log(data.name) // result: "Bob"
  console.log(data.age)  // result: 18
})
```

## Using arbitrary attributes {#attribute-functions}

Your compilers and event handlers may access any HTML attribute
via the standard [`Element#getAttribute()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute)
method.

Unpoly provides convenience functions to read an element attribute and
cast it to a particular type:

- `up.element.booleanAttr(element, attr)`
- `up.element.numberAttr(element, attr)`
- `up.element.jsonAttr(element, attr)`

Here is an example where we use arbitrary HTML attributes to attach data to our element:

```html
<span class='user' name='Bob' age='18'>Bob</span>
```

```js
up.compiler('.user', function(element) {
  console.log(element.getAttribute('name'))          // result: "Bob"
  console.log(up.element.numberAttr(element, 'age')) // result: 18
})
```

## Using data in an event handler {#event-handlers}

Any attached data will also be passed to event handlers registered with `up.on()`.

For instance, this element has attached data in its `[up-data]` attribute:

```html
<span class="user" up-data="{ age: 18, name: 'Bob' }">Bob</span>
```

The data will be passed to your event handler as a third argument:

```js
up.on('click', '.user', function(event, element, data) {
  console.log("This is %o who is %o years old", data.name, data.age)
})
```


## Accessing data programmatically {#read}

Use [`up.data(element)`](/up-data) to retrieve an object with the given element's data:

```js
up.data('.user') // result: { age: 18, name: 'Bob' }
```


## Overriding data for a render pass {#override}

When rendering a single fragment, you can override data keys
from the server HTML. For this use an [`[up-use-data]`](/up-follow#up-use-data) attribute or [`{ data }`](/up.render#options.data) option.
The new fragment will compile with the given data, without requiring an `[up-data]` attribute in the HTML:

```html
<a href="/score" up-target="#score" up-use-data="{ startScore: 1500 }"> <!-- mark: up-use-data="{ startScore: 1500 }" -->
  Load score
</a>

<div id="score">
  <!-- chip: Will compile with data { startScore: 1500 } -->
</div>
```

### Mapping selectors to data {#map}

Use an [`[up-use-data-map]`](/up-follow#up-use-data-map) attribute or [`{ dataMap }`](/up.render#options.dataMap) option to map selectors to data objects.
When a selector matches any element within an updated fragment, the matching element is compiled with the mapped data:

```html
<a
  href="/score"
  up-target="#stats"
  up-use-data-map="{ '#score': { startScore: 1500 }, '#message': { max: 3 } }"> <!-- mark: up-use-data-map="{ '#score': { startScore: 1500 }, '#message': { max: 3 } }" -->
  Load score
</a>

<div id="stats">
  <div id="score">
    <!-- chip: Will compile with data { startScore: 1500 } -->
  </div>
  
  <div id="message">
    <!-- chip: Will compile with data { max: 3 } -->
  </div>
</div>
```

You can also map data objects when updating [multiple fragments](/targeting-fragments#multiple) using a comma-separated target:

```html
<a
  href="/score"
  up-target="#score, #message"
  up-use-data-map="{ '#score': { startScore: 1500 }, '#message': { max: 3 } }">
  Load score
</a>
```



## Preserving data through reloads {#preserving}

When [reloading](/up.reload) or [validating](/up.validate) an element,
you may keep an existing data object by passing it as a [`{ data }`](/up.render#options.data) option.

In the example below, `data.counter` is increased by `1` for every compiler pass,
regardless of what the server renders into `[up-data]`:

```js
up.compiler('.element', function(element, data) {
  data.counter ??= 1 // set initial state
  console.log('Counter is', data.counter) // logs 1, 2, 3, ...
  data.counter++
  element.addEventListener('click', function() {
    up.reload(element, { data })
  })
})
```

As a shortcut you may also pass [`{ keepData: true }`](/up.reload#options.keepData) when reloading.

To keep an entire element, you may also use `[up-keep]`.
The `up:fragment:keep` event lets you inspect the old and new element
with its old and new data. You may then decide whether to keep the existing element,
swap it with the new version, or just update its data.


@page data
@signature
