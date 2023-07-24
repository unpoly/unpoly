up.head = (function() {

  const u = up.util

  const config = new up.Config(() => ({
    metaSelectors: [
      'meta',
      'link[rel=alternate]',
      'link[rel=canonical]',
      'link[rel=icon]',
      '[up-meta]',
    ],

    noMetaSelectors: [
      'meta[http-equiv]',
      '[up-meta=false]',
    ],

    assetSelectors: [
      'link[rel=stylesheet]',
      'script[src]',
      '[up-asset]'
    ],

    noAssetSelectors: [
      '[up-asset=false]',
    ]
  }))

  function reset() {
    config.reset()
  }

  function findElements(parent = document.head, includeSelectors, excludeSelectors) {
    let fullIncludeSelector = includeSelectors.join(',')
    let fullExcludeSelector = excludeSelectors.join(',')
    let elements = parent.querySelectorAll(fullIncludeSelector)
    let isExcluded = (element) => element.matches(fullExcludeSelector)
    return u.reject(elements, isExcluded)
  }

  function findAssets(head) {
    return findElements(head, config.assetSelectors, config.noAssetSelectors)
  }

  function findMetas(head) {
    return findElements(head, config.metaSelectors, config.noMetaSelectors)
  }

  function updateMetas(newMetas) {
    let oldMetas = findMetas()
    for (let oldMeta of oldMetas) {
      // We do not use up.destroy() as meta elements may be inserted/removed
      // multiple times as we open and close an overlay.
      oldMeta.remove()
    }

    for (let newMeta of newMetas) {
      document.head.append(newMeta)
    }
  }

  function assertAssetsOK(newAssets, renderOptions) {
    let oldAssets = findAssets()

    let oldHTML = u.map(oldAssets, 'outerHTML').join('')
    let newHTML = u.map(newAssets, 'outerHTML').join('')

    if (oldHTML !== newHTML) {
      up.event.assertEmitted('up:assets:changed', { oldAssets, newAssets, renderOptions })
    }
  }

  up.on('up:framework:reset', reset)

  return {
    updateMetas,
    assertAssetsOK,
    findAssets,
    findMetas,
  }

})()
