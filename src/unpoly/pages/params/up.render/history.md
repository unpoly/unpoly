@partial up.render/history

@param {boolean|string} [options.history]
  Whether the browser URL, window title and meta tags will be [updated](/updating-history).

  If set to `true`, the history will always be updated.

  If set to `'auto'` history will be updated if the `{ target }` matches
  a selector in `up.fragment.config.autoHistoryTargets`. By default this contains all
  [main targets](/main).

  If set to `false`, the history will remain unchanged.

  @see updating-history

@param {boolean|string} [options.title]
  An explicit document title to set before rendering.

  By default the title is extracted from the response's `<title>` tag.
  To prevent the title from being updated, pass `{ title: false }`

  This option is only used when [updating history](#options.history).

@param {boolean|string} [options.location]
  An explicit browser location URL to set before rendering.

  By default Unpoly will use the `{ url }` or the final URL after the server redirected.
  To prevent the URL from being updated, pass `{ location: false }`.

  This option is only used when [updating history](#options.history).

@param {boolean|Array<Element>} [options.metaTags]
  Whether to update [meta tags](/up-meta) in the `<head>`.

  By default Unpoly will extract meta tags from the response's `<head>`.
  To prevent meta tags from being updated, pass `{ metaTags: false }`.

  This option is only used when [updating history](#options.history).

@param {boolean|Array<Element>} [options.lang]
  An explicit language code to set as the [`html[lang]`](https://www.tpgi.com/using-the-html-lang-attribute/) attribute.

  By default Unpoly will extract the language from the response and update the `html[lang]`
  attribute in the current page.
  To prevent the attrribute from being changed, pass `{ lang: false }`.

  This option is only used when [updating history](#options.history).
