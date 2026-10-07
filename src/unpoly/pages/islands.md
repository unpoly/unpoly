Framework islands
=================

Some widgets need heavy client-side interaction, like a rich text editor or an interactive chart.
You can mount such components from a frontend framework like **React** or **Vue** as *islands*:
self-contained, client-rendered widgets inside a server-rendered page.

[Compilers](/enhancing-elements) give each island a managed lifecycle: the component mounts when
its element enters the page, receives props from server data, and unmounts when Unpoly
swaps the fragment around it. The rest of the page needs no framework code.


Mounting an island {#mounting}
------------------

The server renders a placeholder element, with initial props serialized into an
[`[up-data]`](/data) attribute:

```html
<div class="color-picker" up-data="{ value: '#a2d8ff' }"></div> <!-- mark: up-data -->
```

A compiler mounts a React component into every matching element.
By returning a [destructor function](/enhancing-elements#destructor), it also unmounts
the component when the surrounding fragment is swapped or its overlay closes:

```js
import { createRoot } from 'react-dom/client'
import ColorPicker from './components/color-picker'

up.compiler('.color-picker', function(element, data) {
  let root = createRoot(element)
  root.render(<ColorPicker value={data.value}/>) // mark: data.value
  return () => root.unmount() // mark: return
})
```

A Vue island works the same way:

```js
import { createApp } from 'vue'
import ColorPicker from './components/ColorPicker.vue'

up.compiler('.color-picker', function(element, data) {
  let app = createApp(ColorPicker, data) // chip: data becomes props
  app.mount(element)
  return () => app.unmount() // mark: return
})
```

Simple string props can also be passed as HTML5 [data attributes](/data#data-attributes):

```html
<div class="color-picker" data-value="#a2d8ff"></div> <!-- mark: data-value -->
```

They appear in the same `data` argument, so the compilers above work without changes.

Because islands mount through the regular compiler mechanism, they work on any screen:
in the initial page, in updated fragments, or in [overlays](/up.layer).


Reaching out of the island {#page-interaction}
--------------------------

A common pattern is an island that edits a form value. Give the island a hidden field
to maintain, and the surrounding form submits like any other Unpoly form:

```html
<form method="post" action="/profile" up-submit>
  <input type="hidden" name="theme-color" value="#a2d8ff"> <!-- mark: name="theme-color" -->
  <div class="color-picker" up-data="{ field: 'theme-color' }"></div>
  <button>Save</button>
</form>
```

```js
up.compiler('.color-picker', function(element, data) {
  let field = element.closest('form').elements[data.field] // mark: data.field
  let root = createRoot(element)
  root.render(<ColorPicker value={field.value} onChange={(value) => field.value = value}/>)
  return () => root.unmount()
})
```

Shadowing a hidden field is only one of several form-association patterns Unpoly supports.
See [[custom-form-fields]] for the alternatives and their trade-offs.

Component callbacks can also use Unpoly's JavaScript API directly.
For example, a row in a client-rendered table could open details in an overlay:

```js
<tr onClick={() => up.layer.open({ url: `/orders/${order.id}` })}>
  <td>{order.date}</td>
  <td>{order.total}</td>
</tr>
```


Keeping an island's state through updates {#keeping}
-----------------------------------------

When a fragment containing an island is updated, the destructor unmounts the old component,
and the compiler mounts a new one with fresh props from the server HTML.
Any client-side state inside the island is reset by this.

To preserve an island while the fragment around it is updated, assign it an `[up-keep]` attribute:

```html
<div class="color-picker" up-data="{ value: '#a2d8ff' }" up-keep></div> <!-- mark: up-keep -->
```

When new content contains a matching element, the existing element remains attached in its
current position, keeping the mounted component and all its state. Elements are matched by
their [derived target](/target-derivation): any element with the same `.color-picker` class
in the new HTML counts as a match, even when its `[up-data]` differs.

A kept element ignores the new HTML, including changed `[up-data]`. The recommended pattern
is to listen to `up:fragment:keep` and pass the new props into the already-mounted component.
The event's `event.newData` property carries the parsed [data](/data) of the new element:

```js
up.compiler('.color-picker', function(element, data) {
  let root = createRoot(element)
  let render = (data) => root.render(<ColorPicker value={data.value}/>)
  render(data)
  element.addEventListener('up:fragment:keep', (event) => render(event.newData)) // mark: event.newData
  return () => root.unmount()
})
```

This updates the island in place, without remounting. Component state like cursor positions
or open popovers survives the fragment update.

A simpler alternative is [`[up-keep="same-data"]`](/preserving-elements#same-data). It keeps
the island while its data is unchanged, but *remounts* it with fresh props when the server
sends changed `[up-data]`. Any state inside the component is reset by the remount.

See [[preserving-elements]] for how elements are matched, and for ways to control what is kept.


An island owns its subtree {#boundaries}
--------------------------

Unpoly and the framework each manage their own side of the island's root element:

- Elements rendered by the framework are not [compiled](/enhancing-elements).
  Attributes that need a compiler, like `[up-preload]` or the selectors of your own compilers,
  have no effect inside an island. Links and forms are handled through events and still work;
  component code can also call functions like `up.layer.open()` directly, as shown [above](#page-interaction).
  Don't work around this by calling `up.hello()` on framework-rendered DOM: the framework's
  next reconciliation will clobber or duplicate any changes a compiler made.
- Conversely, don't [target](/targeting-fragments) elements inside an island.
  The framework expects to own that DOM. Update an island through its props or state,
  or re-render the entire island element.


@page islands
@signature
