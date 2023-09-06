const CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded'
const CONTENT_TYPE_FORM_DATA = 'multipart/form-data'

const u = up.util

up.Request.XHRRenderer = class XHRRenderer {

  constructor(request) {
    this._request = request
  }

  buildAndSend(handlers) {
    const xhr = this._request.xhr

    // We copy params since we will modify them below.
    // This would confuse API clients and cache key logic in up.network.
    this._params = u.copy(this._request.params)

    // IE11 explodes it we're setting an undefined timeout property
    if (this._request.timeout) {
      xhr.timeout = this._request.timeout
    }

    // The XMLHttpRequest method must be opened before we can add headers to it.
    xhr.open(this._getMethod(), this._request.url)

    // The { contentType } will be missing in case of a FormData payload.
    // In this case the browser will choose a content-type with MIME boundary,
    // like: multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
    let contentType = this._getContentType()
    if (contentType) {
      xhr.setRequestHeader('Content-Type', contentType)
    }

    for (let headerName in this._request.headers) {
      let headerValue = this._request.headers[headerName]
      xhr.setRequestHeader(headerName, headerValue)
    }

    Object.assign(xhr, handlers)
    xhr.send(this._getPayload())
  }

  _getMethod() {
    // By default HTTP methods other than `GET` or `POST` will be converted into a `POST`
    // request and carry their original method as a `_method` parameter. This is to
    // [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347)
    // if the server redirects with 302 (Rails default) instead of 303.
    let method = this._request.method
    if (this._request.wrapMethod && !this._request.will302RedirectWithGET()) {
      method = up.protocol.wrapMethod(method, this._params)
    }
    return method
  }

  _getContentType() {
    this._finalizePayload()
    return this._contentType
  }

  _getPayload() {
    this._finalizePayload()
    return this._payload
  }

  _finalizePayload() {
    this._payload = this._request.payload
    this._contentType = this._request.contentType

    // (1) If a user sets { payload } we also expect them to set a { contentType }.
    //     In that case we don't change anything.
    // (2) We don't send a { contentType } or { payload } for GET requests.
    if (!this._payload && this._request.allowsPayload()) {

      // Determine the effective Content-Type by looking at our params values.
      if (!this._contentType) {
        this._contentType = this._params.hasBinaryValues() ? CONTENT_TYPE_FORM_DATA : CONTENT_TYPE_URL_ENCODED
      }

      // Serialize our payload
      if (this._contentType === CONTENT_TYPE_FORM_DATA) {
        // The effective Content-Type header will look like
        // multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
        // When we send a FormData payload the browser will automatically
        // chooose a boundary and set the payload.
        this._contentType = null
        this._payload = this._params.toFormData()
      } else {
        // Only in form submissions %-encoded spaces are sent as a plus characater ("+")
        this._payload = this._params.toQuery().replace(/%20/g, '+')
      }
    }
  }

  static {
    u.memoizeMethod(this.prototype, {
      _finalizePayload: true,
      _getMethod: true,
    })
  }
}
