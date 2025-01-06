Optimistic rendering
====================

Optimistic rendering is a pattern where we update the page
without waiting for the server to respond. When the server eventually does respond, the optimistic change
is reverted and replaced by the server-confirmed content.


## Suitable use cases {#use-cases}

Optimistic rendering is an application of [previews](/previews).
Previews are temporary page changes that are reverted when a request ends.

Rendering optimistically can involve heavy DOM mutations to produce a screen state resembling the ultimate server response.
Since this requires additional code, we recommend to use
optimistic rendering for interactions where the duplication is low, or where the extra effort adds significant value for the user.
Some suitable use cases include:

- Forms with few or simple validations (e.g. adding a todo)
- Forms where users would expect an immediate effect (e.g. submitting a chat message)
- Re-ordering items with drag'n'drop (because most logic is already on the client)
- High-value screens where every conversion matters

To limit the duplication of view logic, you may [use templates](#templates).
This also confines HTML rendering to the server.

> [note]
> Optimistic rendering is a recent feature in Unpoly, and inherently difficult in a server-driven approach.
> Expect more changes as we're looking for the best patterns.


## Understanding the demo app

For a demonstration of opportunistic rendering in Unpoly, check out the [*Tasks* tab](https://demo.unpoly.com/tasks)
in the official [demo app](https://demo.unpoly.com). The entire TODO list is rendered optimistically.
This includes the following interactions:

- Adding a task
- Checking and unchecking a task
- Re-ordering tasks with drag'n'drop
- Clearing done tasks

To see how it behaves under high latency, check the `[×] Disable cache` and `[×] Extra server delay` options in the bottom bar.
You will see that everything reacts instantly, despite an [RTT](https://en.wikipedia.org/wiki/Round-trip_delay)
of ≈1200 ms (depending on your location). The `X tasks left` indicator is not rendering optimistically on purpose,
so you see when an actual server response replaces the optimistic update.

The code for the demo app is [available on GitHub](https://github.com/unpoly/unpoly-demo).
Although it is a implemented as a Rails application,
the [JavaScript code](https://github.com/unpoly/unpoly-demo/blob/master/app/assets/javascripts/application.js)
will be the same in any language or framework.


## Previewing form submissions {#previewing-form-submissions}

Let's take a closer look at how the [demo app](https://demo.unpoly.com) optimistically adds a task
to the TODO list. This involves processing form data and rendering a major fragment on the client.

The HTML for the TODO list is structured like this:

```html
<div id="tasks">
  <!-- Form to add a new task -->
  <form up-target="#tasks" up-preview="add-task"> <!-- mark-phrase "add-task" -->
    <input type="text" name="text" required>
    <button type="submit">Save</button>
  </form>

  <!-- List of existing tasks -->
  <div class="task">Buy milk</div>
  <div class="task">Buy toast</div>
  <div class="task">Buy honey</div>
</div>
```

When the user submits a new task, we want to immediately add a new `.task` element to the list
below the form. To do so the preview function `add-task` can access the submitting form data
through [`preview.params`](/up.Preview.prototype.params). The input value is then used to
construct a new `.task` element and prepend it to the list:

```js
up.preview('add-task', function(preview) {
  let form = preview.origin.closest('form')
  let text = preview.params.get('text')
  let newTask = `<div class="task">${up.util.escapeHTML(text)}</div>`
  preview.insert(form, 'afterend', newTask)
  form.reset()
})
```

Because we're using the `up.Preview#insert` function to prepend the new `.task` element,
the element will automatically be removed when the preview [ends](/previews#overview).
This ensures a consistent screen state in cases where we end up *not* updating the entire `#tasks` fragment,
e.g. when the form submission [fails](/failed-responses).


### Handling validation errors

When a previewed form submission ends up [failing](/failed-responses) due to a [validation](/validation) error,
the preview will be reverted and the form is shown in an error state. Whenever possible, we want to avoid
the jarring effect of a quickly changing screen state.

For simple constraints, consider [native HTML validations](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) that run on the client,
such as [`[required]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required), [`[pattern]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern)
or [`[maxlength]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength).
For example, the example above uses the `[required]` attribute to block form submission until
the task text has been filled in:

```html
<form up-target="#tasks" up-preview="add-task">
  <input type="text" name="text" required> <!-- mark-phrase "required" -->
  <button type="submit">Save</button>
</form>
```

#### Server-validated constraints

Some constraints can only be checked on the server, such as uniqueness or authorization.
If a server-validated constraint is violated, the optimistic preview will be briefly visible, only to be replaced by the
server-provided form state. For example, the TODO list from the [demo app](https://demo.unpoly.com) has a server-validated constraints
that task items must be unique:

<video src="images/optimistic-validation-failure.webm" controls width="600" aria-label="An optimistic form submission showing a server-provided validation error"></video>

If a server-validated constraint violation is likely to occur, consider conveying previewed state
as "pending", e.g. by reducing its opacity or using gray text.

Sometimes you can also use the `[up-validate]` attribute to [validate with the server while typing](/validation#validating-while-typing).
This increases the chance that a server-provided validation error is noticed before
the form is submitted.


## Reducing view duplication with templates {#templates}

When a preview function needs to update a major fragment, this can lead to a duplication of view logic.
A HTML fragment that used to only be rendered by the server is now also found in the JavaScript.

By embedding [templates](/templates) into our responses, we can confine HTML rendering to the server.
Since the server already knows how to render a task, we can now re-use that knowledge for optimistic rendering
on the client.

In the example above, we would include a template with the rest of our markup: 

```html
<div id="tasks">
  ...
</div>

<script type="text/minimustache" id="task-template">
  <div class="task">
    {{text}}
  </div>
</script>
```

@include minimustache-tip

By referring to the server-rendered template, we can now remove the HTML snippet from our JavaScript:

```js
up.preview('add-task', function(preview) {
  let form = preview.origin.closest('form')
  let text = preview.params.get('text')

  if (text) {
    let newTask = up.template.clone('#task-template', { text }) // mark-line
    preview.insert(form, 'afterend', newTask)
    form.reset()
  }
})
```





@page optimistic-rendering
