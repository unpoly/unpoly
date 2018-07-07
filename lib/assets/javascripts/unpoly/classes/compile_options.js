u = up.util;

up.CompileOptions = function(element, opts) {
  this.element = element;
  this.fetchData = opts.fetchData;
  this.fetchValue = opts.fetchValue;
}

var methods = up.CompileOptions.prototype;

Object.defineProperty(methods, 'data', {
  get: function() {
    this._data = this._data || [this.fetchData(this.element)]
    return this._data[0]
  }
})

Object.defineProperty(methods, 'value', {
  get: function() {
    this._value = this._value || [this.fetchValue(this.element)]
    return this._value[0]
  }
})
