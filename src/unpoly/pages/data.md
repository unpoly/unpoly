Attaching data to an element
============================

Unpoly lets you attach structured data to an element, to be consumed
by a [compiler](/up.compiler) or [event handler](/up.on).


## Using data attributes for simple key/value pairs

You may use HTML5 [`[data-*]` attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes)
to attach simple string values:

```html
<span class='user' data-age='18' data-name='Bob'>Bob</span>
```

An object with all data attributes will be passed to your [compilers](/up.compiler)
as a second argument:

```js
up.compiler('.user', function(element, data) {
  console.log(data.age)  // => "18"
  console.log(data.name) // => "Bob"
})
```

Note how `data.age` is a string in the example above. Data attributes always have string values.

Data attributes with multiple, dash-separated words in their name can be accessed with `camelCase` keys:

```html
<span class='user' data-first-name='Alice' data-last-name='Anderson'>Alice</span>
```

```js
up.compiler('.user', function(element, data) {
  console.log(data.firstName) // => "Alice"
  console.log(data.lastName)  // => "Anderson"
})
```

## Describing structured data with `[up-data]`

HTML5 data attributes cannot express structured data, like an array or object.
Also their values are always strings.

For a more powerful alternative you can set the `[up-data]` attribute to any
[JSON](https://en.wikipedia.org/wiki/JSON) value:

```html
<div class='google-map' up-data='[
  { "lat": 48.36, "lng": 10.99, "title": "Friedberg" },
  { "lat": 48.75, "lng": 11.45, "title": "Ingolstadt" }
]'></div>
```

The JSON will be parsed and passed to your compiler function as a second argument:

```js
up.compiler('.google-map', function(element, pins) {
  var map = new google.maps.Map(element)
  for (let pin of pins) {
    var position = new google.maps.LatLng(pin.lat, pin.lng)
    new google.maps.Marker({ position, map, title: pin.title })
  }
})
```

You may set `[up-data]` to any JSON-serializable value, like an object:

```html
<span class='user' up-data='{ "name": "Bob", "age": 18 }'>Bob</span>
```

```js
up.compiler('.user', function(element, data) {
  console.log(data.name) // => "Bob"
  console.log(data.age)  // => 18
})
```

If `[up-data]` is a JSON object, any HTML5 data attributes will be merged into the parsed value:

```html
<span class='user' data-name='Bob' up-data='{ "age": 18 }'>Bob</span>
```

```js
up.compiler('.user', function(element, data) {
  console.log(data.name) // => "Bob" from [data-name]
  console.log(data.age)  // => 18    from [up-data]
})
```

## Using arbitrary attributes

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
  console.log(element.getAttribute('name'))          // => "Bob"
  console.log(up.element.numberAttr(element, 'age')) // => 18
})
```

## Using data in an event handler

Any attached data will also be passed to event handler registered with `up.on()`.

For instance, this element has attached data in its `[up-data]` attribute:

```html
<span class='user' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>
```

The data will be passed to your event handler as a third argument:

```js
up.on('click', '.user', function(event, element, data) {
console.log("This is %o who is %o years old", data.name, data.age)
})
```


## Accessing data programmatically

Use `up.data(element)` to retrieve an object with the given element's data.


## Preserving data through reloads

When [reloading](/up.reload) or [validating](/up.validate) an element,
you may keep an existing data object by passing it as a [`{ data }`](/up.render#options.data) option.

In the example below, `data.counter` is increased by `1` for every compiler pass,
regardless of what the server renders into `[up-data]`:

```js
up.compiler('.element', function(element, data) {
  data.counter ??= 1 // set initial state
  console.log("Counter is", data.counter) // logs 1, 2, 3, ...
  data.counter++
  element.addEventListener('click', function() {
    up.reload(element, { data })
  })
})
```

To keep an entire element, you may also use `[up-keep]`.
The `up:fragment:keep` event lets you inspect the old and new element
with its old and new data. You may then decide whether to keep the existing element or to
swap it with the new version.


@page data
