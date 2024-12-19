| Name                  | Type       | Description                                                                                                                                   |
|-----------------------|------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `value`               | `string`   | The changed field value.                                                                                                                      |
| `name`                | `string`   | The `[name]` of the changed field.                                                                                                            |
| `options.origin`      | `Element`  | The element that caused the change.<br>This is usually the changed field.                                                                     |
| `options.feedback`    | `boolean`  | Whether to set [feedback classes](/feedback-classes) while working.<br>Parsed from the field's `[up-watch-feedback]` attribute.               |
| `options.disable`     | `boolean`  | Which [fields to disable](/disabling-forms) while working.<br>Parsed from the field's `[up-watch-disable]` attribute.                         |
| `options.preview`     | `string`   | The name of a [preview](/previews) to run while working.<br>Parsed from the field's `[up-watch-preview]` attribute.                           |
| `options.placeholder` | `string`   | The HTML or selector for a [placeholder](/placeholders) to show while working.<br>Parsed from the field's `[up-watch-placeholder]` attribute. |

@partial watch-callback-arguments
