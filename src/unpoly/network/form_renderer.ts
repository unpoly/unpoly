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

export class FormRenderer {
  declare _request: UpRequest
  declare _form: HTMLFormElement
  declare params: Params

  constructor(request: UpRequest) {
    this._request = request
  }

  buildAndSubmit(): void {
    // We cannot serialize binary entries as input fields
    this.params = this._request.params.withoutBinaryEntries()

    let action = this._request.url
    let { method } = this._request

    // GET forms cannot have an URL with a query section in their [action] attribute.
    // The query section would be overridden by the serialized input values on submission.
    const paramsFromQuery = Params.fromURL(action)
    this.params.addAll(paramsFromQuery)
    action = Params.stripURL(action)

    if (!u.contains(HTML_FORM_METHODS, method)) {
      // HTML forms can only have a GET or POST method. Other HTTP methods will be converted
      // to a `POST` request and carry their original method as a `_method` parameter.
      method = wrapMethod(method, this.params)
    }

    this._form = e.affix(document.body, 'form.up-request-loader', { method, action }) as HTMLFormElement

    // We only need an [enctype] attribute if the user has explicitly
    // requested one. If none is given, we can use the browser's default
    // [enctype]. Binary values cannot be sent by this renderer anyway, so
    // we don't need to default to multipart/form-data in this case.
    let contentType = this._request.contentType
    if (contentType) {
      this._form.setAttribute('enctype', contentType)
    }

    let csrfParam, csrfToken
    if ((csrfParam = this._request.csrfParam()) && (csrfToken = this._request.csrfToken())) {
      this.params.add(csrfParam, csrfToken)
    }

    // @params will be undefined for GET requests, since we have already
    // transfered all params to the URL during normalize().
    u.each(this.params.toArray(), this._addField.bind(this))

    submitForm(this._form)
  }

  _addField(attrs: ParamEntry): void {
    e.affix(this._form, 'input[type=hidden]', attrs)
  }
}
