| Effect                                                                                                       | HTML attribute         | JavaScript option |
|--------------------------------------------------------------------------------------------------------------|------------------------|-------------------|
| Fetch a URL and [replace matching fragments](/providing-html#url) from the response                          | `[href]` or `[action]` | `{ url }`         | 
| Update an element's inner HTML [from a string](/providing-html#content)                                      | `[up-content]`         | `{ content }`     | 
| Replace an element [from  a string](/providing-html#fragment) or [`Element` object](/providing-html#element) | `[up-fragment]`        | `{ fragment }`    | 
| Find a selector in a [a larger HTML string](/providing-html#document)                                        | `[up-document]`        | `{ document }`    | 
| Render an [existing `up.Response` object](/providing-html#response)                                          | –                      | `{ response }`    | 

@partial providing-html-table
