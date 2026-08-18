// Builds URLs for the spec runner page. Single home for the `/specs` endpoint and
// its query encoding, shared by the runner (full-config run URL) and the receiver
// (spec-only "debug in browser" deep-links).

export function specsURL(serverURL, params) {
  let search = new URLSearchParams()
  for (let [key, value] of Object.entries(params)) {
    // A repeatable setting becomes one param per value (?spec=a&spec=b), which is what
    // Express parses back into an array. Passing the array to URLSearchParams would
    // comma-join it into a single filter that matches nothing.
    for (let entry of Array.isArray(value) ? value : [value]) search.append(key, entry)
  }

  // Jasmine's spec filter decodes the query with decodeURIComponent(), which keeps
  // "+" literal — so encode spaces as %20, not "+".
  let query = search.toString().replaceAll('+', '%20')
  return query ? `${serverURL}/specs?${query}` : `${serverURL}/specs`
}
