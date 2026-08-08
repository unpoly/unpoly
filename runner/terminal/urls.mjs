// Builds URLs for the spec runner page. Single home for the `/specs` endpoint and
// its query encoding, shared by the runner (full-config run URL) and the receiver
// (spec-only "debug in browser" deep-links).

export function specsURL(serverURL, params) {
  // Jasmine's spec filter decodes the query with decodeURIComponent(), which keeps
  // "+" literal — so encode spaces as %20, not "+".
  let query = new URLSearchParams(params).toString().replaceAll('+', '%20')
  return query ? `${serverURL}/specs?${query}` : `${serverURL}/specs`
}
