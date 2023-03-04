const CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded'
const CONTENT_TYPE_FORM_DATA = 'multipart/form-data'

const u = up.util

up.Request.XHRRenderer = class XHRRenderer {

  constructor(request) {
    this.request = request
  }

  buildAndSend(handlers) {
    const xhr = this.request.xhr

    // We copy params since we will modify them below.
    // This would confuse API clients and cache key logic in up.network.
    this.params = u.copy(this.request.params)

    // IE11 explodes it we're setting an undefined timeout property
    if (this.request.timeout) {
      xhr.timeout = this.request.timeout
    }

    // The XMLHttpRequest method must be opened before we can add headers to it.
    xhr.open(this.getMethod(), this.request.url)

    // Add information about the response's intended use, so the server may
    // customize or shorten its response.
    const metaProps = this.request.metaProps()
    for (let key in metaProps) {
      this.addHeader(
        xhr,
        up.protocol.headerize(key),
        metaProps[key]
      )
    }

    for (let header in this.request.headers) {
      this.addHeader(
        xhr,
        header,
        this.request.headers[header]
      )
    }

    let csrfHeader, csrfToken
    if ((csrfHeader = this.request.csrfHeader()) && (csrfToken = this.request.csrfToken())) {
      this.addHeader(xhr, csrfHeader, csrfToken)
    }

    this.addHeader(xhr, up.protocol.headerize('version'), up.version)

    // The { contentType } will be missing in case of a FormData payload.
    // In this case the browser will choose a content-type with MIME boundary,
    // like: multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
    let contentType = this.getContentType()
    if (contentType) {
      this.addHeader(xhr, 'Content-Type', contentType)
    }

    Object.assign(xhr, handlers)
    xhr.send(this.getPayload())
  }

  getMethod() {
    // By default HTTP methods other than `GET` or `POST` will be converted into a `POST`
    // request and carry their original method as a `_method` parameter. This is to
    // [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347)
    // if the server redirects with 302 (Rails default) instead of 303.
    if (!this.method) {
      this.method = this.request.method
      if (this.request.wrapMethod && !this.request.will302RedirectWithGET()) {
        this.method = up.protocol.wrapMethod(this.method, this.params)
      }
    }

    return this.method
  }

  getContentType() {
    this.finalizePayload()
    return this.contentType
  }

  getPayload() {
    this.finalizePayload()
    return this.payload
  }

  addHeader(xhr, header, value) {
    if (u.isOptions(value) || u.isArray(value)) {
      value = u.safeStringifyJSON(value)
    }
    xhr.setRequestHeader(header, value)
  }

  finalizePayload() {
    this.payload = this.request.payload
    this.contentType = this.request.contentType

    // (1) If a user sets { payload } we also expect them to set a { contentType }.
    //     In that case we don't change anything.
    // (2) We don't send a { contentType } or { payload } for GET requests.
    if (!this.payload && this.request.allowsPayload()) {

      // Determine the effective Content-Type by looking at our params values.
      if (!this.contentType) {
        this.contentType = this.params.hasBinaryValues() ? CONTENT_TYPE_FORM_DATA : CONTENT_TYPE_URL_ENCODED
      }

      // Serialize our payload
      if (this.contentType === CONTENT_TYPE_FORM_DATA) {
        // The effective Content-Type header will look like
        // multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
        // When we send a FormData payload the browser will automatically
        // chooose a boundary and set the payload.
        this.contentType = null
        this.payload = this.params.toFormData()
      } else {
        // Only in form submissions %-encoded spaces are sent as a plus characater ("+")
        this.payload = this.params.toQuery().replace(/%20/g, '+')
      }
    }
  }

  static {
    u.memoizeMethod(this.prototype, [
      'finalizePayload',
    ])
  }
}
