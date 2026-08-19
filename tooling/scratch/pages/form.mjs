// The one page here with a handler, because a form needs to read parameters and answer with a
// status code. Its markup stays in form.ejs — the handler renders it explicitly.

import { layout } from '../helpers/layout.mjs'
import { view } from '../helpers/view.mjs'

function blankUser() {
  return { email: '', password: '' }
}

function userFromRequest(req) {
  return {
    email: req.body.email ?? '',
    password: req.body.password ?? '',
  }
}

function validateUser(user) {
  const errors = {}
  if (!user.email.includes('@')) errors.email = 'E-mail must contain an @'
  if (user.password.length < 8) errors.password = 'Password must be at least 8 characters'
  return errors
}

function renderForm({ user, errors = {}, saved = false }) {
  return layout(view('form', { user, errors, saved }), { title: 'form' })
}

export function get(req, res) {
  res.send(renderForm({ user: blankUser() }))
}

export function post(req, res) {
  const user = userFromRequest(req)
  const errors = validateUser(user)
  const failed = Object.keys(errors).length > 0

  // A validation roundtrip is not a submission: it gets the form back either way, and Unpoly
  // takes the group it asked about. Only a real submit is allowed to succeed.
  const validating = Boolean(req.headers['x-up-validate'])

  // 422 rather than 200, because Unpoly detects a failed submission from a non-200 status —
  // see src/unpoly/pages/validation.md.
  res.status(failed ? 422 : 200).send(renderForm({ user, errors, saved: !failed && !validating }))
}
