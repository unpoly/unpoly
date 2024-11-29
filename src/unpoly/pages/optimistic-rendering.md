Optimistic rendering
====================

Optimistic rendering is a pattern where we update the page
without waiting for the server to respond. When the server eventually does respond, the optimistic change
is reverted and replaced by the server-confirmed content.


> [note]
> Optimistic rendering is a recent feature, and inherently difficult in a server-driven approach.
> Expect more changes as we're looking for the best patterns. 

### Example

The entire TODO list is rendered optimistically:

- Adding a task
- Checking and unchecking a task
- Re-ordering tasks with drag'n'drop
- Clearing done tasks

The HTML is in [`views/tasks`](https://github.com/unpoly/unpoly-demo/tree/master/app/views/tasks).
The JavaScript is in [`application.js`](https://github.com/unpoly/unpoly-demo/blob/master/app/assets/javascripts/application.js)


```html
<div id="tasks">
   <form up-target="#tasks" up-preview="add-task">
      <input type="text" name="text">
      <button type="submit">Save</button>
   </form>
   
   <div class="task">Buy milk</div>
   <div class="task">Buy toast</div>
</div>
```


```js
up.preview('add-task', function(preview) {
  let form = preview.origin.closest('form')
  let text = preview.params.get('text')

  if (text) {
    preview.insert(form, 'afterend', `<div class="task">${up.util.escapeHTML(text)}</div>`)
    form.reset()
  }
})
```

Server-side validation (uniquness)

### Using templates

Optimistic rendering often involves duplicating view logic.

We can keep the view logic on the server by embedding template elements into our responses:

```html
<template id="task-template">
  <div class="task"></div>
</template>
```



```js
let task = up.template.clone('#task-template')
task.innerText = text
preview.insert(form, 'afterend', task)
```

See [Templates](/templates) for many more examples, including ways to define [dynamic templates](/templates#dynamic) with variables, loops or conditions.


@page optimistic-rendering
