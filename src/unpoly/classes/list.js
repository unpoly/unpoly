/*-
The Unpoly documentation uses the term `List` to refer to an array-like value.

There is no actual `List` class. Instead that term refers to an abstract interface
for objects that have a `{ length }` property and allow random access to an indexed element:

```js
list[2] // result: 'hello'
list.length // result: 10
```

You can also use them in a `for` loop:

```js
for (let element of list) {
  console.log(element)
}
```

Whether a list supports additional utilities like [`forEach()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach) or
[`map()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) depends on
the specific type of the list value.

## Common list types

Common types of array-like values include:

- `Array`
- `NodeList`
- `HTMLCollection`
- [`arguments`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments) object
- [jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/)

## Converting lists to arrays {#convert-to-array}

Sometimes we want to convert an array-like value into an actual `Array` so we can call
methods like [`map()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
or [`flat()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat).

One way to do this is to destructure the array-like value:

```js
let array = [...list]
```

One drawback of destructuring is that it will always create a new array, even if the given `list` is already an `Array`.
To only convert non-`Array` values, use `up.util.toArray()`:

```js
let array = up.util.toArray()
```

@class List
@stable
*/
