| Effect                                                                 | HTML attribute         | JavaScript option |
|------------------------------------------------------------------------|------------------------|-------------------|
| Fetch a URL and update targeted fragments                              | `[href]` or `[action]` | `{ url }`         | 
| Update a fragment's inner HTML from a string, `<template>` or `Element`                           | `[up-content]`         | `{ content }`     | 
| Update a fragment's outer HTML from a string, `<template>` or `Element` | `[up-fragment]`        | `{ fragment }`    | 
| Update targeted fragments from a larger HTML string                    | `[up-document]`        | `{ document }`    | 
| Update targeted fragments from an existing `up.Response` object        | –                      | `{ response }`    | 

@partial providing-html-table
