# Fenced code

```sh
# A shell comment comes before the summary, but code is not the summary
```

The summary comes after the code block.

## Backtick fences

```sh
# Not a heading
## Not a heading either
```

## Tilde fences

~~~md
# Not a heading
```
A backtick fence does not close a tilde fence.
```
## Still inside
~~~

## Nested fences

````md
Outer fence of four backticks:

```js
// An inner fence of three cannot close it
```

# Still inside
````

## Indented fence

- A list item with code:

  ```sh
  # Not a heading
  ```

## Unclosed fence

```
# An unclosed fence runs to the end of the file

## Not a heading
