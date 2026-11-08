// Unpoly's namespaces are ES modules. Each exports `api`, its contribution to `window.up`,
// and optionally `install()`, which performs all its side effects (registering compilers,
// listeners, macros). A module's top level only declares things.
//
// We only access `api` and `install` as static properties of the imported modules, never
// pass a module namespace object around: webpack would then have to build that object,
// listing every export of the module (2.4 KB for up.util alone).
//
// Import cycles between modules are fine, as long as no top level needs a binding from the
// cycle before it is initialized. ES modules evaluate depth-first, so within a cycle the
// module we import first from here is evaluated last. Hence two rules:
//
// - Outside of functions, a module uses imported bindings only for `extends` and
//   `new Config()`. Other top-level uses (like element.js calling `mockable()`) are only
//   safe while the two modules aren't part of the same cycle.
// - This file enters every cycle through a namespace, never through a base class. Importing
//   `Layer` first, with Layer → layer.js → RootLayer → Layer, would evaluate
//   `class RootLayer extends Layer` before `Layer` exists.
//
// After changing imports, load dist/unpoly.js once. A ReferenceError at load time
// ("Cannot access … before initialization") means a cycle is entered from the wrong side.
import * as namespace from './unpoly/namespace.js.erb'
import * as mockable from './unpoly/mockable.js'
import * as util from './unpoly/util.js'
import * as error from './unpoly/error.js'
import * as migrateStub from './unpoly/migrate_stub.js'
import * as browser from './unpoly/browser.js'
import * as element from './unpoly/element.js'
import * as baseError from './unpoly/error/error.js'
import * as notImplementedError from './unpoly/error/not_implemented.js'
import * as abortedError from './unpoly/error/aborted.js'
import * as blockedError from './unpoly/error/blocked.js'
import * as cannotMatchError from './unpoly/error/cannot_match.js'
import * as cannotParseError from './unpoly/error/cannot_parse.js'
import * as cannotTargetError from './unpoly/error/cannot_target.js'
import * as offlineError from './unpoly/error/offline.js'
import * as recordClass from './unpoly/util/record.js'
import * as configClass from './unpoly/util/config.js'
import * as logConfigClass from './unpoly/log/log_config.js'
import * as registryClass from './unpoly/util/registry.js'
import * as optionsParserClass from './unpoly/element/options_parser.js'
import * as fifoCacheClass from './unpoly/util/fifo_cache.js'
import * as rectClass from './unpoly/util/rect.js'
import * as urlPatternClass from './unpoly/util/url_pattern.js'
import * as eventEmitterClass from './unpoly/event/event_emitter.js'
import * as eventListenerClass from './unpoly/event/event_listener.js'
import * as eventListenerGroupClass from './unpoly/event/event_listener_group.js'
import * as cspInfoClass from './unpoly/script/csp/csp_info.js'
import * as helloFragmentClass from './unpoly/script/hello_fragment.js'
import * as destructorPassClass from './unpoly/script/destructor_pass.js'
import * as nonceableCallbackClass from './unpoly/script/csp/nonceable_callback.js'
import * as scriptGateClass from './unpoly/script/csp/script_gate.js'
import * as bodyShifterClass from './unpoly/viewport/body_shifter.js'
import * as focusCapsuleClass from './unpoly/viewport/focus_capsule.js'
import * as revealMotionClass from './unpoly/viewport/reveal_motion.js'
import * as fieldWatcherClass from './unpoly/form/field_watcher.js'
import * as switcherClass from './unpoly/form/switcher.js'
import * as formValidatorClass from './unpoly/form/form_validator.js'
import * as paramsClass from './unpoly/form/params.js'
import * as fragmentPollingClass from './unpoly/radio/fragment_polling.js'
import * as linkCurrentUrlsClass from './unpoly/status/link_current_urls.js'
import * as previewClass from './unpoly/status/preview.js'
import * as linkFollowIntentClass from './unpoly/link/link_follow_intent.js'
import * as motionControllerClass from './unpoly/motion/motion_controller.js'
import * as selectorTrackerClass from './unpoly/fragment/selector_tracker.js'
import * as fragmentFinderClass from './unpoly/fragment/fragment_finder.js'
import * as selectorClass from './unpoly/fragment/selector.js'
import * as layerClass from './unpoly/layer/base.js'
import * as layerLookupClass from './unpoly/layer/layer_lookup.js'
import * as layerStackClass from './unpoly/layer/layer_stack.js'
import * as overlayFocusClass from './unpoly/layer/overlay_focus.js'
import * as tetherClass from './unpoly/layer/tether.js'
import * as progressBarClass from './unpoly/network/progress_bar.js'
import * as requestClass from './unpoly/network/request.js'
import * as responseClass from './unpoly/network/response.js'

window.up = {}

const apis = [
  namespace.api,
  mockable.api,
  util.api,
  error.api,
  migrateStub.api,
  browser.api,
  element.api,
  baseError.api,
  notImplementedError.api,
  abortedError.api,
  blockedError.api,
  cannotMatchError.api,
  cannotParseError.api,
  cannotTargetError.api,
  offlineError.api,
  recordClass.api,
  configClass.api,
  logConfigClass.api,
  registryClass.api,
  optionsParserClass.api,
  fifoCacheClass.api,
  rectClass.api,
  urlPatternClass.api,
  eventEmitterClass.api,
  eventListenerClass.api,
  eventListenerGroupClass.api,
  cspInfoClass.api,
  helloFragmentClass.api,
  destructorPassClass.api,
  nonceableCallbackClass.api,
  scriptGateClass.api,
  bodyShifterClass.api,
  focusCapsuleClass.api,
  revealMotionClass.api,
  fieldWatcherClass.api,
  switcherClass.api,
  formValidatorClass.api,
  paramsClass.api,
  fragmentPollingClass.api,
  linkCurrentUrlsClass.api,
  previewClass.api,
  linkFollowIntentClass.api,
  motionControllerClass.api,
  selectorTrackerClass.api,
  fragmentFinderClass.api,
  selectorClass.api,
  layerClass.api,
  layerLookupClass.api,
  layerStackClass.api,
  overlayFocusClass.api,
  tetherClass.api,
  progressBarClass.api,
  requestClass.api,
  responseClass.api,
]

// Copy property descriptors, so getters (like `up.context`) stay live.
for (let api of apis) {
  Object.defineProperties(up, Object.getOwnPropertyDescriptors(api))
}

// The explicit install order. All installs run before `up.framework.onEvaled()` below, while
// `up.framework.evaling` is still true. Event listeners, compilers, macros and registry entries
// created now are marked as defaults (`isDefault`), which a reset between specs keeps
// (see event_listener.js, registry.js, script.js). Installs listed before `framework` run
// before `up.framework` exists, so they cannot create any of these.
//
// TEMPORARY (TypeScript migration, Phase 1): Namespaces we haven't converted to ES modules yet
// are scripts that assign to `window.up` and register their side effects while they evaluate.
// They're listed as `() => require(…)`, so they run at their position in the install order,
// after the APIs of all converted modules are on `window.up`. When converting a file, remove
// its line, and add its `install` here if it has one.
const installs = [
  util.install,

  () => require('./unpoly/fragment/render/change/change'),
  () => require('./unpoly/fragment/render/change/addition'),
  () => require('./unpoly/fragment/render/render_job'),
  () => require('./unpoly/fragment/render/change/destroy_fragment'),
  () => require('./unpoly/fragment/render/change/open_layer'),
  () => require('./unpoly/fragment/render/change/update_layer'),
  () => require('./unpoly/fragment/render/change/update_steps'),
  () => require('./unpoly/fragment/render/change/close_layer'),
  () => require('./unpoly/fragment/render/change/change_from_url'),
  () => require('./unpoly/fragment/render/change/change_from_response'),
  () => require('./unpoly/fragment/render/change/change_from_content'),
  () => require('./unpoly/fragment/render/fragment_processor'),
  () => require('./unpoly/fragment/render/fragment_focus'),
  () => require('./unpoly/fragment/render/fragment_scrolling'),
  () => require('./unpoly/fragment/render/render_options'),
  () => require('./unpoly/fragment/render/render_result'),
  () => require('./unpoly/fragment/render/response_doc'),

  () => require('./unpoly/framework'),
  () => require('./unpoly/event'),
  () => require('./unpoly/protocol'),
  () => require('./unpoly/log'),
  () => require('./unpoly/script'),
  () => require('./unpoly/history'),
  () => require('./unpoly/fragment'),
  () => require('./unpoly/viewport'),
  () => require('./unpoly/motion'),
  () => require('./unpoly/network'),
  () => require('./unpoly/layer'),
  () => require('./unpoly/link'),
  () => require('./unpoly/form'),
  () => require('./unpoly/status'),
  () => require('./unpoly/radio'),
  () => require('./unpoly/rails'),
]

for (let install of installs) {
  install()
}

up.framework.onEvaled()
