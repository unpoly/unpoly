Dependent fields
================

The list of employees needs to be updated as the appartment changes:

```html
<form action="/contracts">
  <select name="department" up-validate="[name=employee]">...</select>
  <select name="employee">...</select>
</form>
```

See `[up-validate]` for more details.



@page dependent-fields
