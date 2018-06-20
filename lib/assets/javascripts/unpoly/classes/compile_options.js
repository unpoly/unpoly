u = up.util;

up.CompileOptions = function(element, fetchData, fetchValue) {
  this.element = element;
  this.fetchData = fetchData;
  this.fetchValue = fetchValue;
}

var methods = up.CompileOptions.prototype;

Object.defineProperty(methods, 'data', {
  get: function() {
    this._data = this._data || [this.fetchData(element)]
    return this._data[0]
  }
})

Object.defineProperty(methods, 'value', {
  get: function() {
    this._value = this._value || [this.fetchValue(element)]
    return this._value[0]
  }
})
