const u = up.util

const SINGLE_QUOTED_STRING = /"(?:\\\\|\\"|[^"])*"/g
const DOUBLE_QUOTED_STRING = /'(?:\\\\|\\'|[^'])*'/g
const OBJECT_LITERAL = /{[^}]*}/g

up.TextParser = class TextParser {

  constructor(text) {
    this._text = text
    this._placeholders = []
  }

  strip(pattern, transform = u.identity) {
    throw "this must be recursive"
    this._text = this._text.replace(pattern, (match) => {
      let placeholder = '$' + this._placeholders.length
      this._placeholders[placeholder] = transform(match)
      return placeholder
    })
  }

  stripSingleQuotedStrings(transform) {
    this.strip(SINGLE_QUOTED_STRING, transform)
  }

  stripDoubleQuotedStrings(transform) {
    this.strip(DOUBLE_QUOTED_STRING, transform)
  }

  stripStrings() {
    this.stripSingleQuotedStrings()
    this.stripDoubleQuotedStrings()
  }

  stripObjects(transform) {
    this.strip(OBJECT_LITERAL, transform)
  }

  restore(str = this._text) {
    while (/\$\d/.test(str)) {
      str = str.replace(/$\d+/g, (placeholder) => this._placeholders[placeholder])
    }
    return str
  }

}
