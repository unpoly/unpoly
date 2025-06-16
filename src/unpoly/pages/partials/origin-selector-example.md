Below we see two links that will each update the `<div>` next to them.
This requires a rather verbose `[up-target]` attribute:

```html
<a href="/tasks/1" up-target="a[href='/tasks/1'] + div">Show task 1</a> <!-- mark-phrase: a[href='/tasks/1'] + div -->
<div>Task 1 will appear here</div

<a href="/tasks/2" up-target="a[href='/tasks/2'] + div">Show task 2</a> <!-- mark-phrase: a[href='/tasks/2'] + div -->
<div>Task 2 will appear here</div
```

We can simplify the `[up-target]` by referencing the followed link by `:origin`:

```html
<a href="/tasks/1" up-target=":origin + div">Show task 1</a> <!-- mark-phrase: :origin + div -->
<div>Task 1 will appear here</div

<a href="/tasks/2" up-target=":origin + div">Show task 2</a> <!-- mark-phrase: :origin + div -->
<div>Task 2 will appear here</div
```

When a link is clicked, `:origin` with a target [derived](/target-derivation) from the link element.
For example, clicking on the second link will target `a[href='/tasks/2']`.

@partial origin-selector-example
