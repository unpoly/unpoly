Optimistic rendering
====================

Optimistic rendering is a pattern where the page is updated without waiting for the server.
When the server eventually responds, the optimistic change is reverted
and replaced by the server-confirmed content.

In Unpoly, optimistic rendering is an application of [previews](/learn/previews):
temporary page changes that are reverted when a request ends.
A preview can produce a screen state resembling the ultimate server response,
so the user sees the effect of their interaction instantly, even under high latency.

## Suitable use cases {#use-cases}

Rendering optimistically can involve heavy DOM mutations to produce a screen state resembling the ultimate server response.
Since this requires additional code, we recommend to use
optimistic rendering for interactions where the duplication is low, or where the extra effort adds significant value for the user.
Some suitable use cases include:

- Forms with few or simple validations (e.g. adding a todo)
- Forms where users would expect an immediate effect (e.g. submitting a chat message)
- Re-ordering items with drag'n'drop (because most logic is already on the client)
- High-value screens where every conversion matters

To limit the duplication of view logic, you may [use templates](#templates).
By embedding templates into your responses, the server stays in control of HTML rendering.


## Previewing form submissions {#previewing-form-submissions}

Let's look at how a TODO list optimistically adds a task when its form is submitted.
This involves processing form data and rendering a major fragment on the client.
The example is taken from the [demo app](#demo), which you can try in your browser.

The HTML for the TODO list is structured like this:

```html
<div id="tasks">
  <!-- Form to add a new task -->
  <form up-target="#tasks" up-preview="add-task"> <!-- mark: up-preview="add-task" -->
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
below the form. To do so the preview function `add-task` can access the submitted form data
through [`preview.params`](/api/up.Preview.prototype.params). The input value is then used to
construct a new `.task` element and insert it after the form:

```js
up.preview('add-task', function(preview) {
  let form = preview.origin.closest('form')
  let text = preview.params.get('text') // mark: preview.params
  let newTask = `<div class="task">${up.util.escapeHTML(text)}</div>`
  preview.insert(form, 'afterend', newTask)
})
```

Because we're using the `up.Preview#insert()` function to insert the new `.task` element,
the element is automatically removed when the preview [ends](/learn/previews#ending).
This ensures a consistent screen state in cases where we end up *not* updating the entire `#tasks` fragment,
e.g. when the form submission [fails](/learn/error-responses).

When the user submits again before the server responds, the new submission [aborts](/learn/aborting-requests)
the earlier request and reverts its preview.


## Handling validation errors

When a previewed form submission [fails](/learn/error-responses) with a [validation](/learn/validation) error,
the server's error messages still appear reliably. Every preview is [reverted when its request ends](/learn/previews#ending),
so Unpoly removes the optimistic change before it renders the form with its errors.
The user never keeps seeing a change that the server rejected.

What remains is a quick change from the optimistic state to the error state.
Whenever possible, we want to avoid this jarring effect.

For simple constraints, consider [native HTML validations](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) that run on the client,
such as [`[required]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required), [`[pattern]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern)
or [`[maxlength]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength).
For example, the form above uses the `[required]` attribute to block form submission until
the task text has been filled in.

### Server-validated constraints

Some constraints can only be checked on the server, such as uniqueness or authorization.
If a server-validated constraint is violated, the optimistic preview is briefly visible, only to be replaced by the
server-provided form state. For example, the TODO list from the [demo app](#demo) has a server-validated constraint
that task items must be unique:

<figure>
  <video src="images/optimistic-validation-failure.webm" controls width="600" aria-label="Video: An optimistic submission that fails validation on the server"></video>
  <figcaption>

The TODO list already has a task "Buy toast". The user types "Buy toast" again and clicks Save.
The new task appears at the top of the list right away, in gray and without an Edit button,
while the Save button shows a spinner. When the server responds, the optimistic task is gone,
and the form shows the error "has already been taken" below the text field.

  </figcaption>
</figure>

If a server-validated constraint violation is likely to occur, consider conveying previewed state
as "pending", e.g. by reducing its opacity or using gray text.

Sometimes you can also use the `[up-validate]` attribute to [validate with the server while typing](/learn/validation#validating-while-typing).
This increases the chance that a server-provided validation error is noticed before
the form is submitted.


## Reducing view duplication with templates {#templates}

When a preview function needs to update a major fragment, this can lead to a duplication of view logic.
An HTML fragment that used to only be rendered by the server is now also found in the JavaScript.

There is a way to mitigate that. By embedding [templates](/learn/templates) into our responses, we can confine HTML rendering to the server.
Since the server already knows how to render a task, we can reuse that knowledge for optimistic rendering
on the client.

In the example above, we would include a template with the rest of our markup:

```html
<div id="tasks">
  ...
</div>

<script type="text/minimustache" id="task-template"> <!-- mark: id="task-template" -->
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

  let newTask = up.template.clone('#task-template', { text }) // mark-line
  preview.insert(form, 'afterend', newTask)
})
```


## Exploring the demo app {#demo}

For a demonstration of optimistic rendering in Unpoly, check out the [*Tasks* tab](https://demo.unpoly.com/tasks)
in the official [demo app](https://demo.unpoly.com). The entire TODO list is rendered optimistically.
This includes the following interactions:

- Adding a task
- Checking and unchecking a task
- Re-ordering tasks with drag'n'drop
- Clearing done tasks

To see how it behaves under high latency, check the `[×] Disable cache` and `[×] Extra server delay` options in the bottom bar.
You will see that everything reacts instantly, despite an [RTT](https://en.wikipedia.org/wiki/Round-trip_delay)
of ≈1200 ms (depending on your location). The `X tasks left` indicator is not rendered optimistically on purpose,
so you see when an actual server response replaces the optimistic update:

<figure>
  <video src="images/optimistic-rendering-demo.mp4" controls width="600" aria-label="Video: The demo app reacting instantly under high latency"></video>
  <figcaption>

In a task list, the user adds the tasks "Rake lawn" and "Buy honey", drags "Buy honey" to a new position,
checks off two tasks and clicks "Clear done". Every change appears the moment the user makes it.
The "tasks left" counter is not rendered optimistically. It changes a moment later,
when the server response arrives.

  </figcaption>
</figure>

The code for the demo app is [available on GitHub](https://github.com/unpoly/unpoly-demo).
Although it is implemented as a Rails application,
the [JavaScript code](https://github.com/unpoly/unpoly-demo/blob/master/app/assets/javascripts/application.js)
would be the same in any language or framework.


@page optimistic-rendering
