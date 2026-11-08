// Unpoly's namespaces are ES modules. Each exports `api`, its contribution to `window.up`,
// and optionally `install()`, which performs all its side effects (registering compilers,
// listeners, macros). A module's top level only declares things.
//
// We only access `api` and `install` as static properties of the imported modules, never
// pass a module namespace object around: webpack would then have to build that object,
// listing every export of the module (2.4 KB for up.util alone).
//
// Import cycles between modules are fine, as long as nothing evaluated while a module or class
// is defined needs a binding from the cycle before it is initialized. ES modules evaluate
// depth-first, so within a cycle the module we import first from here is evaluated last.
// Hence these rules:
//
// - Anything that runs when a module or class is defined must only use bindings that are
//   already evaluated. That means `extends`, computed keys (`[isEqual.key]`), static fields and
//   blocks (`static { memoizeMethod(…) }`) and top-level calls (`new Config()`, `mockable()`).
//   These are safe for bindings from util and element, because those are evaluated before
//   anything else. This is also why util and element must never import a class.
// - A base class must be evaluated before its subclasses. When a base class reaches one of
//   its subclasses through its own imports, `class Sub extends Base` runs before `Base` exists.
//   So code outside a class hierarchy imports the base class, not a subclass, wherever it can
//   (the layer modes are only imported by each other and by this file). Where it can't
//   (`RenderJob` creates a `ChangeFromURL`), that code must be evaluated before the base class.
// - This file imports the namespaces before the classes, and so enters every cycle through a
//   namespace.
//
// After changing imports, run tmp/a2/tdz.cjs (if you have it) and load dist/unpoly.js once.
// A ReferenceError at load time ("Cannot access … before initialization") means a cycle is
// entered from the wrong side.
import * as namespace from './unpoly/namespace.js.erb'
import * as mockable from './unpoly/mockable.js'
import * as util from './unpoly/util.js'
import * as error from './unpoly/error.js'
import * as migrateStub from './unpoly/migrate_stub.js'
import * as browser from './unpoly/browser.js'
import * as element from './unpoly/element.js'
import * as framework from './unpoly/framework.js'
import * as event from './unpoly/event.js'
import * as protocol from './unpoly/protocol.js'
import * as log from './unpoly/log.js'
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
import * as renderJobClass from './unpoly/fragment/render/render_job.js'
import * as fragmentProcessorClass from './unpoly/fragment/render/fragment_processor.js'
import * as fragmentFocusClass from './unpoly/fragment/render/fragment_focus.js'
import * as fragmentScrollingClass from './unpoly/fragment/render/fragment_scrolling.js'
import * as renderOptionsClass from './unpoly/fragment/render/render_options.js'
import * as renderResultClass from './unpoly/fragment/render/render_result.js'
import * as responseDocClass from './unpoly/fragment/render/response_doc.js'
import { RootLayer } from './unpoly/layer/modes/root_layer.js'
import { ModalLayer } from './unpoly/layer/modes/modal_layer.js'
import { PopupLayer } from './unpoly/layer/modes/popup_layer.js'
import { DrawerLayer } from './unpoly/layer/modes/drawer_layer.js'
import { CoverLayer } from './unpoly/layer/modes/cover_layer.js'
import { RequestQueue } from './unpoly/network/request_queue.js'
import { RequestCache } from './unpoly/network/request_cache.js'
import { DestroyFragment } from './unpoly/fragment/render/change/destroy_fragment.js'

window.up = {}

const apis = [
  namespace.api,
  mockable.api,
  util.api,
  error.api,
  migrateStub.api,
  browser.api,
  element.api,
  framework.api,
  event.api,
  protocol.api,
  log.api,
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
  renderJobClass.api,
  fragmentProcessorClass.api,
  fragmentFocusClass.api,
  fragmentScrollingClass.api,
  renderOptionsClass.api,
  renderResultClass.api,
  responseDocClass.api,
]

// Copy property descriptors, so getters (like `up.context`) stay live.
for (let api of apis) {
  Object.defineProperties(up, Object.getOwnPropertyDescriptors(api))
}

// TEMPORARY (TypeScript migration, Phase 1): Namespaces we haven't converted yet can't import
// the classes that are no longer on `window.up`. An `import` in a file that we `require()`
// below makes webpack stop concatenating every module it reaches, which costs ~6 KB in
// unpoly.min.js. So they read these classes from here. When converting a namespace, have it
// import its classes and remove them here.
up._classes = {
  RootLayer, ModalLayer, PopupLayer, DrawerLayer, CoverLayer, // used by up.layer
  RequestQueue, RequestCache,                                 // used by up.network
  DestroyFragment,                                            // used by up.fragment
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

  event.install,
  log.install,
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
