@partial up-follow/history

@param [up-history='auto']
  Whether the browser URL, window title and meta tags will be [updated](/updating-history).

  If set to `true`, the history will always be updated, using the title and URL from
  the server response, or from given `[up-title]` and `[up-location]` attributes.

  If set to `auto` history will be updated if the `[up-target]` matches
  a selector in `up.fragment.config.autoHistoryTargets`. By default this contains all
  [main targets](/up-main).

  If set to `false`, the history will remain unchanged.

  @see updating-history

@param [up-title]
  An explicit document title to set before rendering.

  By default the title is extracted from the response's `<title>` tag.
  To prevent the title from being updated, set `[up-title=false]` to explicitly

  This attribute is only used when [updating history](#up-history).

@param [up-location]
  An explicit URL to set before rendering.

  By default Unpoly will use the link's `[href]` or the final URL after the server redirected.
  To prevent the URL from being updated, set `[up-location=false]`.

  This attribute is only used when [updating history](#up-history).

@param [up-meta-tags]
  Whether to update [meta tags](/up-meta) in the `<head>`.

  By default Unpoly will extract meta tags from the response's `<head>`.
  To prevent meta tags from being updated, set `[up-meta-tags=false]`.

  This attribute is only used when [updating history](#up-history).

@param [up-lang]
  An explicit language code to set as the [`html[lang]`](https://www.tpgi.com/using-the-html-lang-attribute/) attribute.

  By default Unpoly will extract the language from the response and update the `html[lang]`
  attribute in the current page.
  To prevent the attrribute from being changed, set `[up-lang=false]`.

  This attribute is only used when [updating history](#up-history).
