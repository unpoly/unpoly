const u = up.util

up.FieldTracker = class FieldTracker {

  constructor(root, options, callback) {
    this._root = root ?? this._form
    this._form = up.form.get(root)
    this._layer = up.layer.get(root)
    this._callback = callback
    this._guard = options.guard ?? (() => true)
    this._knownFields = new Map()
  }

  start() {
    this._considerAddedFields(up.form.fields(this._form))

    let cleaner = u.cleaner()

    cleaner(
      this._listen('up:fragment:inserted', (fields) => {
        this._considerAddedFields(fields)
      })
    )

    cleaner(
      this._listen('up:fragment:destroyed', (fields) => {
        this._considerRemovedFields(fields, true)
      })
    )

    cleaner(
      this._listen('up:fragment:kept', (fields) => {
        this._considerRemovedFields(fields)
        this._considerAddedFields(fields)
      })
    )

    cleaner(
      () => this._removeAllFields()
    )

    return cleaner.clean
  }

  _listen(eventType, handler) {
    // We cannot just listen on this._root or this._form because we might have
    // fields outside the form (using [form] attribute).
    return this._layer.on(eventType, ({ target, fragment }) => {
      // up:fragment:destroyed is emitted on the former parent,
      // but has the actual destroyed element as a { fragment } prop.
      let fields = up.form.fields(fragment || target)
      handler(fields)
    })
  }

  _considerAddedFields(fields) {
    for (let field of fields) {
      if (!this._knownFields.has(field) && this._shouldKnowField(field)) {
        // Callbacks can return a function that is called when the field is removed later.
        let undo = this._callback(field)
        this._knownFields.set(field, undo)
      }
    }
  }

  _considerRemovedFields(fields, force = false) {
    for (let field of fields) {
      if (force || (this._knownFields.has(field) && !this._shouldKnowField(field))) {
        let undo = this._knownFields.get(field)
        this._knownFields.delete(field)
        undo?.(field)
      }
    }
  }

  _shouldKnowField(field) {
    return (up.form.get(field) === this._form)
      && (this._root === this._form || this._root.contains(field))
      && this._guard(field)
  }

  _removeAllFields() {
    // Make a copy of the known fields, as we're removing items as we're iterating over it.
    let fields = [...this._knownFields.keys()]
    this._considerRemovedFields(fields, true)
  }

}
