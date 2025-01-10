Templates
=========

By embedding `<template>` elements into your responses, your frontend can clone HTML fragments without making
another server request.


Rendering a template
--------------------

Instead of [rendering an HTML string](/providing-html#string), you may also refer to a [`<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).
This is useful for using the same HTML multiple times, or when you don't
want to embed long HTML strings into attributes.

To refer to a template, pass its CSS selector to any attribute or option that accepts HTML:


```html
<a href="#" up-target=".target" up-document="#my-template">Click me</a> <!-- mark-phrase "#my-template" -->

<div class="target">
  Old content
</div>

<template id="my-template"> <!-- mark-phrase "my-template" -->
  <div class="target">
    New content
  </div>
</template>
```

When the link is clicked, Unpoly will look for a template matching `#my-template`.
The template is cloned and the `.target` is updated with a matching element from the cloned template.
All of this happens locally, without making a server request.


### Shorthand

Since the target can be [derived](/target-derivation) from the template's root element (`.target`), and since
[we can omit `[href]`](/providing-html#omitting-href), we can shorten the link to this:

```html
<a up-fragment="#my-template">Click me</a>
```

### Features that support templates

Rendering of template selectors is supported by most attributes and functions that process HTML:

| JavaScript function                          | HTML attribute                    |
|----------------------------------------------|-----------------------------------|
| `up.render({ content: '#my-template' })`     | `[up-content="#my-template"]`     |
| `up.render({ fragment: '#my-template' })`    | `[up-fragment="#my-template"]`    | 
| `up.render({ document: '#my-template' })`    | `[up-document="#my-template"]`    | 
| `up.render({ placeholder: '#my-template' })` | `[up-placeholder="#my-template"]` | 
| `up.Preview#insert()`                        | &ndash;                           | 
| `up.Preview#swapContent()`                   | &ndash;                           | 
| `up.Preview#showPlaceholder()`               | &ndash;                           | 





## Dynamic templates with variables {#dynamic}

Sometimes we want to clone a template, but with variations.
For example, we may want to change a piece of text, or vary the size of a component.

As an example, we have a simple template that describes a single element. We want to use
this template in various places, but set a custom element text every time:

```html
<template id="task-template">
  <div class="task">
    Custom task description here <!-- mark-phrase "Custom task description here" -->
  </div>
</template>
```

Below we will look at various ways to achieve this.


### Option 1: Post-processing in a compiler {#compiler-postprocessing}

When we reference a template, we can pass a [data object](/data) for the cloned element as an
[`[up-use-data]`](/up-follow#up-use-data) attribute:

```html
<a up-fragment="#my-template" up-use-data="{ description: 'Buy toast' }">
  Click me
</a>
```

By defining a matching a [compiler](/up.compiler) function, we can post-process the cloned element
and its data object. When the compiler below is called with the cloned element, it's `data` argument will be set to `{ description: 'Buy toast' }`.

```js
up.compiler('.task', function(task, data) {
  if (data.description) {
    task.innerText = data.description
  }
})
```

Sometimes we cannot use the `[up-use-data]` attribute, e.g. when configuring a [placeholder](/placeholders).
In that case we can append the data object after the template selector:

```html
<a href="/home" up-placeholder="#spinner { size: 'xl' }"> <!-- mark-phrase "#spinner { size: 'xl' }" -->
  Click me
</a>
```


### Option 2: Using a templating engine {#templating-engine}

Sometimes we want to render a complex data object:

```html
<a up-fragment="#results-template" up-use-data="
  {
    gameCount: 3,
    players: [
      { name: 'Luke', score: 100 },
      { name: 'Alice', score: 120 },
    ]
  }">
  Show results
</a>
```

For this we need a more expressive template with variables, loops or conditions.

There are [countless templating engines](https://awesome-javascript.js.org/resources/templating-engines.html) to choose from.
For this example we're going to use templates in the style of
[Mustache.js](https://github.com/janl/mustache.js) or [Handlebars](https://handlebarsjs.com/):


```html
<script id="results-template" type="text/mustache"> <!-- mark-phrase "text/mustache" -->
  <div id="game-results">
    <h1>Results of game {{gameCount}}</h1>

    {{#players}}
      <p>{{name}} has scored {{score}} points.</p>
    {{/players}}
  </div>>
</script>
```

> [note]
> We're using a `<script>` element here with a custom `[type]`, because strictly speaking `<template>` elements cannot have a `[type]` attribute.
> Both are valid methods to embed HTML fragments into larger document, while largely being ignored by the browser.


#### Parsing template expressions

Unpoly does not ship with a templating engine, but makes it very easy to implement
or integrate your own:

- Listen to the `up:template:clone` event on your custom template elements.
- Process the given template and data using a templating function of your choice.
- Set `event.nodes` to a [list](/List) of [`Node`](https://developer.mozilla.org/en-US/docs/Web/API/Node) objects representing
the template results.

#### Example integrations {#templating-engine-example}

An event handler for an Mustache integration would look like this:

```js
up.on('up:template:clone', '[type="text/mustache"]', function(event) {
  const template = event.target.innerHTML
  const result = Mustache.render(template, event.data)
  event.nodes = up.element.createNodesFromHTML(result)
})
```

If you only care about simple `{{variable}}` replacements, you can also use JavaScript string functions,
without adding a dependency. Here we define a very simple templating function for the `text/minimustache` type:

```js
up.on('up:template:clone', '[type="text/minimustache"]', function(event) { // mark-phrase "text/minimustache"
  let template = event.target.innerHTML
  let evaluate = (_match, variable) => up.util.escapeHTML(event.data[variable])
  let filled = template.replace(/{{(\w+)}}/g, evaluate)
  event.nodes = up.element.createNodesFromHTML(filled)
})
```




### Option 3: Modifying the element programmatically {#callback-postprocessing}

You can use the [`[up-on-rendered]`](/up-follow#up-on-rendered) attribute to change the template element
after it was cloned and inserted. The callback is provided with an `up.RenderResult` which
references the element we want to customize:

```html
<a
  up-fragment="#task-template"
  up-on-rendered="result.fragment.innerText = 'Buy toast'"
>
  Click me
</a>
```

From JavaScript you can [manually clone](/up.template.clone) a template and then modify the result:

```js
let [fragment] = up.template.clone('#task-template')
fragment.innerText = 'Buy Toast'
up.render({ fragment })
```


## Template lookup order {#lookup}

When matching a template with its CSS selector, Unpoly will start looking in the [origin](/origin) [layer](/up.layer) first.
The origin is the element that caused an update. In the example above, this would be the clicked hyperlink.

If no template is found in the origin layer, Unpoly will look in ancestor layers, prefering closer layers.
This allows you to declare global templates to your global application layout (typically rendered into the [root layer](/up.layer.root)),
but override with more specific templates in overlays.


@page templates
