Multiple values can be separated by either a space (`foo bar`) or a comma (`foo, bar`).

If your values might contain spaces, you may also serialize them as a [relaxed JSON](/relaxed-json) array (`["foo", "bar"]`).

To react to the [presence or absence](/switching-form-state#presence) of a value, use `:blank` or `:present`.

For [checkboxes](/switching-form-state#checkboxes), you can react to `:checked` or `:unchecked` in addition
to the checked value.

@partial switch-token-serialization
