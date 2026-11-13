import * as u from '../util.js'
import * as e from '../element.js'
import { submitForm } from '../browser.js'
import { Params, type ParamEntry } from '../form.js'
import { wrapMethod } from '../protocol.js'
import { type UpRequest } from './request.js'

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
