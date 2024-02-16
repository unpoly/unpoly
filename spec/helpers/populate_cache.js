jasmine.populateCache = async function(requestOptions, responseOptions) {
  if (up.util.isString(requestOptions)) {
    requestOptions = { url: requestOptions }
  }

  if (up.util.isString(responseOptions)) {
    responseOptions = { responseText: responseOptions }
  }

  up.request({ ...requestOptions, cache: true })

  await wait()

  expect(jasmine.Ajax.requests.count()).toBe(1)

  jasmine.respondWith(responseOptions)

  await wait()

  expect(requestOptions).toBeCached()
}
