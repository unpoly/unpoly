const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

function minify(doMinify) {
  return {
    mode: doMinify ? 'production' : 'none',
    optimization: {
      minimize: doMinify,
      minimizer: [
        new TerserPlugin({
          terserOptions: { // https://github.com/terser/terser#minify-options
            compress: { // https://github.com/terser/terser#compress-options
              passes: 3,
              ecma: 2020,
            },
            mangle: {
              properties: {
                reserved: ["$compiler", "$macro", "$on", "Cache", "Class", "FragmentDataProxyHandler", "Layer", "Params", "RenderJob", "RenderResult", "Request", "Response", "abort", "abortable", "accept", "acceptEvent", "acceptLocation", "add", "addAll", "addField", "affix", "age", "ajax", "alias", "align", "all", "ancestors", "anchoredRight", "animate", "animation", "any", "args", "asCurrent", "ask", "assign", "attach", "attr", "autoCache", "autoFocus", "autoHistoryTargets", "autoRevalidate", "autoScroll", "autosubmit", "background", "badDownlink", "badRTT", "badResponseTime", "badTargetClasses", "banner", "batch", "behavior", "booleanAttr", "boot", "browser", "build", "cache", "cacheExpiry", "cacheSize", "changeEvents", "child", "class", "clear", "clearCache", "clickableSelectors", "close", "closeAnimation", "closeDuration", "closeEasing", "closest", "compact", "compiler", "concurrency", "config", "confirm", "contains", "content", "contentType", "context", "copy", "count", "cover", "coveredUrl", "createFromHTML", "createFromSelector", "cspNonce", "csrfHeader", "csrfParam", "csrfToken", "current", "currentClasses", "data", "delay", "delete", "deprecatedFunction", "descendants", "destroy", "destructor", "disable", "dismiss", "dismissAriaLabel", "dismissEvent", "dismissLabel", "dismissLocation", "dismissOverlays", "dismissable", "document", "drawer", "duration", "each", "easing", "element", "emit", "enable", "enabled", "escapeHTML", "etag", "evalOption", "event", "every", "except", "experimentalFunction", "extract", "fail", "failContext", "failLayer", "failMode", "failTarget", "fallback", "feedback", "fieldSelectors", "fields", "filter", "find", "findResult", "finish", "first", "fixedBottom", "fixedTop", "flatMap", "flatten", "focus", "follow", "followOptions", "followSelectors", "force", "foreignOverlaySelectors", "form", "formGroup", "format", "fragment", "fragments", "framework", "fromFields", "fromForm", "fromURL", "front", "function", "functionWithDefault", "functionWithParamsNote", "get", "getAll", "getFirst", "getHeader", "group", "groupSelectors", "halt", "hash", "headers", "hello", "hide", "history", "history='auto'", "host", "hungrySelectors", "index", "inputDelay", "inputEvents", "instantSelectors", "interval", "isArray", "isAttached", "isBlank", "isBoolean", "isBusy", "isClosed", "isCurrent", "isDefined", "isDetached", "isElement", "isEnabled", "isEqual", "isError", "isFollowable", "isFront", "isFunction", "isGiven", "isIdle", "isJQuery", "isList", "isLocation", "isMissing", "isNone", "isNull", "isNumber", "isObject", "isOpen", "isOverlay", "isPresent", "isPromise", "isRoot", "isSafe", "isString", "isSubmittable", "isSuccess", "isSupported", "isTargetable", "isUndefined", "isVisible", "json", "jsonAttr", "key", "key1", "key2", "keys", "last", "lastModified", "layer", "link", "loadPage", "location", "log", "macro", "mainTargets", "makeFollowable", "map", "matchAroundOrigin", "matches", "merge", "method", "methodParam", "microtask", "migrate", "modal", "mode", "module", "morph", "motion", "navSelectors", "navigate", "navigateOptions", "network", "noFollowSelectors", "noInstantSelectors", "noPreloadSelectors", "noSubmitSelectors", "nobodyPrevents", "nonessentialFunction", "noop", "normalizeURL", "numberAttr", "objectProperty", "off", "ok", "omit", "on", "onAborted", "onAccepted", "onDismissed", "onEscape", "onFinished", "onLoaded", "onOpened", "once", "only", "open", "openAnimation", "openDuration", "openEasing", "origin", "overlay", "overlays", "padding", "params", "parent", "parseURL", "passive", "payload", "peel", "pick", "pickBy", "pluckKey", "pollEnabled", "pollInterval", "pollIntervalScale", "popup", "position", "preload", "preloadDelay", "preloadEnabled", "preloadSelectors", "presence", "preventScroll", "preventable", "previousLocation", "priority", "progressBar", "property", "propertyWithArrayDefault", "protocol", "prototype", "proxy", "push", "radio", "reason", "referencingFunction", "reject", "reload", "remove", "render", "replace", "request", "requestMetaKeys", "restoreFocus", "restoreScroll", "restoreTargets", "revalidate", "reveal", "revealMax", "revealPadding", "revealSnap", "revealTop", "root", "runScripts", "saveFocus", "saveScroll", "scroll", "search", "set", "setAttrs", "setStyle", "shouldReduceRequests", "show", "size", "snap", "some", "source", "speed", "stableFunction", "stack", "startPolling", "status", "stopPolling", "stripURL", "style", "styleNumber", "submit", "submitButtonSelectors", "submitButtons", "submitOptions", "submitSelectors", "subtree", "sync", "syntax", "target", "targetDerivers", "targetElements", "task", "test", "text", "time", "timeout", "timer", "times", "title", "toArray", "toFormData", "toObject", "toQuery", "toSelector", "toTarget", "toURL", "toggle", "toggleClass", "tooltip", "top", "trailingSlash", "transition", "type", "uniq", "uniqBy", "up", "url", "useHungry", "useKeep", "util", "validate", "values", "verifyDerivedTarget", "viewport", "viewportSelectors", "visit", "watch", "wrapList", "wrapMethod", "xhr"]
              }
            }
          }
        })
      ]
    }
  }
}

function file(srcPath, output) {
  let parsedOutput = path.parse(output)
  let entryName = parsedOutput.name // foo.js => foo
  let outputFilename = parsedOutput.base
  let outputFolder = parsedOutput.dir || (__dirname + '/../dist')

  return {
    entry: {
      [entryName]: srcPath
    },
    output: {
      path: outputFolder,
      filename: outputFilename,
    },
    devServer: {
      contentBase: './dist',
      writeToDisk: true,
    },
    cache: true
  }
}

function scriptPipeline({ es, lint = true }) {
  if (es === 'modern') {
    es = 'es2020'
  }

  let erbLoader = {
    loader: 'rails-erb-loader',
    options: {
      runner: 'ruby',
      engine: 'erb',
    }
  }

  let tsLoader = {
    loader: 'ts-loader',
    options: {
      appendTsSuffixTo: [/.*/],
      transpileOnly: true,
      compilerOptions: {
        allowJs: true,
        checkJs: true,
        // importHelpers: true,
        // module: "ES2020",
        target: es
      }

    }
  }

  let coffeeLoader = {
    loader: 'coffee-loader'
  }

  let plugins = []
  if (lint) {
    plugins.push(
      new ESLintPlugin({
        extensions: ['js', 'ts']
      })
    )
  }

  return {
    plugins,
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [tsLoader]
        },
        {
          test: /\.coffee$/,
          exclude: /node_modules/,
          use: [tsLoader, coffeeLoader]
        },
        {
          test: /\.js\.erb$/,
          exclude: /node_modules/,
          use: [tsLoader, erbLoader]
        },
        {
          test: /\.coffee\.erb$/,
          exclude: /node_modules/,
          use: [tsLoader, coffeeLoader, erbLoader]
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.coffee', '.js.erb', '.coffee.erb']
    },
    target: ['web', es]
  }
}

function merge(...configs) {
  let merged = {
    module: {
      rules: []
    },
    resolve: {
      extensions: []
    },
    plugins: []
  }

  for (let config of configs) {
    if (!config) {
      // Skip null configs
      continue
    }

    // First set all the config keys that never existed in merged
    for (let key in config) {
      if (merged[key] == null) {
        merged[key] = config[key]
      }
    }

    // Now merge all keys with array values
    if (config.module && config.module.rules) {
      merged.module.rules.push(...config.module.rules)
    }
    if (config.resolve && config.resolve.extensions) {
      merged.resolve.extensions.push(...config.resolve.extensions)
    }
    if (config.plugins) {
      merged.plugins.push(...config.plugins)
    }
  }

  return merged
}

let extractCssLoader = {
  loader: MiniCssExtractPlugin.loader,
  options: {}
}

stylePipeline = function(filename = "[name.css]") {
  return {
    plugins: [
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // all options are optional
        filename,
        chunkFilename: '[id].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      })
    ],
    module: {
      rules: [
        {
          test: /\.(css)$/,
          use: [extractCssLoader, 'css-loader']
        },
        {
          test: /\.(sass|scss)$/,
          use: [extractCssLoader, 'css-loader', 'sass-loader']
        },
      ],
    },
    resolve: {
      extensions: ['.css', '.sass', '.scss']
    }
  }
}

discardStyles = function() {
  return {
    module: {
      rules: [
        {
          test: /\.(css|sass|scss)$/,
          use: 'null-loader'
        },
      ],
    },
    resolve: {
      extensions: ['.css', '.sass', '.scss']
    }
  }
}

module.exports = {
  merge,
  file,
  scriptPipeline,
  stylePipeline,
  discardStyles,
  minify
}
