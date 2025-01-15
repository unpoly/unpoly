Relaxed JSON
============

*Relaxed JSON* is a JSON dialect that that aims to be easier to write by humans.


Example
-------

Unpoly often accepts JSON in HTML attributes or HTTP headers: 

```html
<span class='user' up-data='{ "name": "Bob", "age": 18 }'>Bob</span>
```

Unpoly also accepts single-quoted strings and unquoted property names:

```html
<span class="user" up-data="{ name: 'Bob', age: 18 }">Bob</span>
```


Syntax rules
-----------

- Every JSON object is also a Relaxed JSON object.
- Relaxed JSON allows single-quoted strings, in addition to double-quoted strings.
- Relaxed JSON allows unquoted property names, like JavaScript. It's also OK to double-quote property names.
- Relaxed JSON allows [trailing commas](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Trailing_commas) in object literals and array literals.


Postel's law
-------------

When Unpoly outputs HTML (e.g. for the `X-Up-Context` header) it always produces regular JSON.

If you implement the [optional server protocol](/up.protocol) you only need to deal with regular JSON strings.


@page relaxed-json
