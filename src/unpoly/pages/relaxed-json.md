Relaxed JSON
============

*Relaxed JSON* is a JSON superset that aims to be easier to write by humans.


Example
-------

Unpoly often accepts JSON in HTML attributes or HTTP headers: 

```html
<span class='user' up-data='{ "name": "Bob", "age": 18 }'>Bob</span>
```

To be easier on the hand and eyes, Unpoly also accepts single-quoted strings and unquoted property names:

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


Parsing relaxed JSON
--------------------

Your frontend code can parse relaxed JSON using `up.util.parseRelaxedJSON()`:

```js
let value = up.util.parseRelaxedJSON("{ foo: 'one', bar: 'two', }")
console.log(value) // logs an object { foo: 'one', bar: 'two' }
```

On the backend we recommend using a [JSON5](https://json5.org/) parser, which is a superset of relaxed JSON.
JSON5 parsers are available in [many languages](https://github.com/json5/json5/wiki/In-the-Wild).



@page relaxed-json
