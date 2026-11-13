// `up.internal` publishes the internal functions and classes that the specs and unpoly-migrate
// need. Both are separate bundles, so they can't import from src/unpoly, and `window.up` only
// holds public API.
//
// Add a function or class here only when a spec or unpoly-migrate uses it. Publish it under its
// export name, as a shorthand key (`up.internal.sprintf`). When the export name doesn't stand on
// its own without its module, rename the export where it is defined (`getSubtree` in viewport.ts
// became `getViewportSubtree`). Because every key is an import binding, two keys can't share a
// name. tooling/lint/api_collisions.mjs checks that no import is renamed and every key is shorthand.
//
// src/unpoly.ts imports this module after every other module, so these imports never change the
// order in which modules are evaluated.
import {
  assert, camelToKebabCase, cleaner, containsAll, evalAutoOption, expressionOutline,
  extractCallback, extractOptions, FIFOCache, getComplexTokens, getSimpleTokens, isCrossOrigin,
  isElementLike, isFormData, isOptions, isRegExp, kebabToCamelCase, maskPattern, matchURLs,
  memoize, memoizeMethod, mergeDefined, newDeferred, newOptions, normalizeMethod, objectContains,
  parseArgs, parseScalarJSONPairs, parseString, Rect, renameKey, sequence, spanObject, sprintf,
  unresolvablePromise, UpURLPattern, withRenamedKeys, wrapValue,
} from './util.js'
import {
  addClassTemp, ancestor, attrSelector, booleanOrNumberAttr, booleanOrStringAttr, classSelector,
  closestAttr, containsElement, createBrokenDocumentFromHTML, extractSingular, fixedToAbsolute,
  getList, inlineStyle, isSingleton, leadingElement, paint, parseSelector, removeAttrsFromHTML,
  removeClassTemp, setAttrsTemp, setMissingAttr, setStyleTemp, trackDefinitions, unionSelector,
  unwrap,
} from './element.js'
import { OptionsParser } from './element/options_parser.js'
import { Config, newConfig } from './util/config.js'
import { assertConfirmed, popCookie, submitForm } from './browser.js'
import { fail, guard, guardFn } from './error.js'
import { assertEmitted, isSyntheticClick, parseEmitArgs, UpEventListener } from './event.js'
import {
  disableContainerTemp, findGroupSolution, getGroupSelectors, readFieldDisabled,
  submitButtonOverrides, Switcher, trackFields,
} from './form.js'
import {
  compressNestedSteps, defaultNormalizeKeepHTML, deriveFailOptions, expandTargets, insertTemp,
  parseTargetSteps, preprocessRenderOptions, provideNodes, resolveOrigin, ResponseDoc, SelectorTracker,
  splitTarget, toFailKey, toSuccessKey, tryToTarget,
} from './fragment.js'
import {
  emitReset, isBeforeBoot, setClassName, startExtension, stopExtension,
} from './framework.js'
import { canPushState, findMetaTags, isHistoryEnabled } from './history.js'
import { buildLayer, normalizeLayerOptions, Tether } from './layer.js'
import { shouldHandleClick } from './link.js'
import { printToError, printToStandard, printToWarn } from './log.js'
import { mockable } from './mockable.js'
import { isNone, MotionController, swapElementsDirectly } from './motion.js'
import { queue } from './network.js'
import { csrfParam, csrfToken, headerize, initialRequestMethod } from './protocol.js'
import {
  adoptDetachedHeadAsset, adoptNewFragment, adoptRenderOptionsFromHeader, clean, CSPInfo, cspNonce,
  findAssets, NonceableCallback, parseCallback, warnOfUnsafeCSP,
} from './script.js'
import {
  absolutize, focusedElementWithin, getViewportAround, getViewportSubtree, revealHash, rootHeight,
  rootScrollbarWidth,
} from './viewport.js'

export const api = {
  internal: {
    assert,
    camelToKebabCase,
    cleaner,
    containsAll,
    evalAutoOption,
    expressionOutline,
    extractCallback,
    extractOptions,
    getComplexTokens,
    getSimpleTokens,
    isCrossOrigin,
    isElementLike,
    isFormData,
    isOptions,
    isRegExp,
    kebabToCamelCase,
    maskPattern,
    matchURLs,
    memoize,
    memoizeMethod,
    mergeDefined,
    newDeferred,
    newOptions,
    normalizeMethod,
    objectContains,
    parseArgs,
    parseScalarJSONPairs,
    parseString,
    renameKey,
    sequence,
    spanObject,
    sprintf,
    unresolvablePromise,
    withRenamedKeys,
    wrapValue,

    fail,
    guard,
    guardFn,

    mockable,

    assertConfirmed,
    popCookie,
    submitForm,

    addClassTemp,
    ancestor,
    attrSelector,
    booleanOrNumberAttr,
    booleanOrStringAttr,
    classSelector,
    closestAttr,
    containsElement,
    createBrokenDocumentFromHTML,
    extractSingular,
    fixedToAbsolute,
    getList,
    inlineStyle,
    isSingleton,
    leadingElement,
    paint,
    parseSelector,
    removeAttrsFromHTML,
    removeClassTemp,
    setAttrsTemp,
    setMissingAttr,
    setStyleTemp,
    trackDefinitions,
    unionSelector,
    unwrap,

    emitReset,
    isBeforeBoot,
    setClassName,
    startExtension,
    stopExtension,

    assertEmitted,
    isSyntheticClick,
    parseEmitArgs,

    csrfParam,
    csrfToken,
    headerize,
    initialRequestMethod,

    printToError,
    printToStandard,
    printToWarn,

    adoptDetachedHeadAsset,
    adoptNewFragment,
    adoptRenderOptionsFromHeader,
    clean,
    cspNonce,
    findAssets,
    parseCallback,
    warnOfUnsafeCSP,

    canPushState,
    findMetaTags,
    isHistoryEnabled,

    compressNestedSteps,
    defaultNormalizeKeepHTML,
    deriveFailOptions,
    expandTargets,
    toFailKey,
    insertTemp,
    parseTargetSteps,
    preprocessRenderOptions,
    provideNodes,
    resolveOrigin,
    splitTarget,
    toSuccessKey,
    tryToTarget,

    absolutize,
    focusedElementWithin,
    getViewportAround,
    getViewportSubtree,
    revealHash,
    rootHeight,
    rootScrollbarWidth,

    isNone,
    swapElementsDirectly,

    queue,

    buildLayer,
    normalizeLayerOptions,

    shouldHandleClick,

    disableContainerTemp,
    findGroupSolution,
    getGroupSelectors,
    readFieldDisabled,
    submitButtonOverrides,
    trackFields,

    Config,
    newConfig,
    OptionsParser,
    FIFOCache,
    Rect,
    UpURLPattern,
    UpEventListener,
    CSPInfo,
    NonceableCallback,
    Switcher,
    MotionController,
    SelectorTracker,
    Tether,
    ResponseDoc,
  },
}
