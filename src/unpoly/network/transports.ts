import * as u from '../util.js'
import * as e from '../element.js'
import { submitForm } from '../browser.js'
import { Params, type ParamEntry } from '../form.js'
import { wrapMethod } from '../protocol.js'
import { type UpRequest } from './request.js'

const CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded'
const CONTENT_TYPE_FORM_DATA = 'multipart/form-data'

// Assigns the handlers (onload, onerror, ...) to the XMLHttpRequest.
export function sendWithXHR(request: UpRequest, handlers: Partial<XMLHttpRequest>): void {
  const xhr = request.xhr

  // We copy params since we will modify them below.
  // This would confuse API clients and cache key logic in up.network.
  let params = u.copy(request.params)

  // IE11 explodes it we're setting an undefined timeout property
  if (request.timeout) {
    xhr.timeout = request.timeout
  }

  // The XMLHttpRequest method must be opened before we can add headers to it.
  // We get the method before the payload, since wrapping the method adds a _method param.
  xhr.open(getMethod(request, params), request.url)

  // The { contentType } will be missing in case of a FormData payload.
  // In this case the browser will choose a content-type with MIME boundary,
  // like: multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
  let [payload, contentType] = buildPayload(request, params)
  if (contentType) {
    xhr.setRequestHeader('Content-Type', contentType)
  }

  for (let headerName in request.headers) {
    let headerValue = request.headers[headerName]
    xhr.setRequestHeader(headerName, headerValue)
  }

  Object.assign(xhr, handlers)

  xhr.send(payload)
}

function getMethod(request: UpRequest, params: Params): string {
  // By default HTTP methods other than `GET` or `POST` will be converted into a `POST`
  // request and carry their original method as a `_method` parameter. This is to
  // [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347)
  // if the server redirects with 302 (Rails default) instead of 303.
  let method = request.method
  if (request.wrapMethod && !request.will302RedirectWithGET()) {
    method = wrapMethod(method, params)
  }
  return method
}

function buildPayload(request: UpRequest, params: Params): [payload: any, contentType: string | null | undefined] {
  let payload = request.payload
  let contentType: string | null | undefined = request.contentType

  // (1) If a user sets { payload } we also expect them to set a { contentType }.
  //     In that case we don't change anything.
  // (2) We don't send a { contentType } or { payload } for GET requests.
  if (!payload && request.allowsPayload()) {

    // Determine the effective Content-Type by looking at our params values.
    if (!contentType) {
      contentType = params.hasBinaryEntries() ? CONTENT_TYPE_FORM_DATA : CONTENT_TYPE_URL_ENCODED
    }

    // Serialize our payload
    if (contentType === CONTENT_TYPE_FORM_DATA) {
      // The effective Content-Type header will look like
      // multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
      // When we send a FormData payload the browser will automatically
      // chooose a boundary and set the payload.
      contentType = null
      payload = params.toFormData()
    } else {
      // Only in form submissions %-encoded spaces are sent as a plus characater ("+")
      payload = params.toQuery().replace(/%20/g, '+')
    }
  }

  return [payload, contentType]
}

// In HTML5, forms may only have a GET or POST method.
// There were several proposals to extend this to PUT, DELETE, etc.
// but they have all been abandoned.
const HTML_FORM_METHODS = ['GET', 'POST']

export function submitWithForm(request: UpRequest): void {
  // We cannot serialize binary entries as input fields
  let params = request.params.withoutBinaryEntries()

  let action = request.url
  let { method } = request

  // GET forms cannot have an URL with a query section in their [action] attribute.
  // The query section would be overridden by the serialized input values on submission.
  const paramsFromQuery = Params.fromURL(action)
  params.addAll(paramsFromQuery)
  action = Params.stripURL(action)

  if (!u.contains(HTML_FORM_METHODS, method)) {
    // HTML forms can only have a GET or POST method. Other HTTP methods will be converted
    // to a `POST` request and carry their original method as a `_method` parameter.
    method = wrapMethod(method, params)
  }

  let form = e.affix(document.body, 'form.up-request-loader', { method, action }) as HTMLFormElement

  // We only need an [enctype] attribute if the user has explicitly
  // requested one. If none is given, we can use the browser's default
  // [enctype]. Binary values cannot be sent by this function anyway, so
  // we don't need to default to multipart/form-data in this case.
  let contentType = request.contentType
  if (contentType) {
    form.setAttribute('enctype', contentType)
  }

  let csrfParam, csrfToken
  if ((csrfParam = request.csrfParam()) && (csrfToken = request.csrfToken())) {
    params.add(csrfParam, csrfToken)
  }

  // @params will be undefined for GET requests, since we have already
  // transfered all params to the URL during normalize().
  u.each(params.toArray(), (attrs) => addField(form, attrs))

  submitForm(form)
}

function addField(form: HTMLFormElement, attrs: ParamEntry): void {
  e.affix(form, 'input[type=hidden]', attrs)
}
