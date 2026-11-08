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

  () => require('./unpoly/viewport/body_shifter'),
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
  () => require('./unpoly/fragment/selector_tracker'),
  () => require('./unpoly/form/field_watcher'),
  () => require('./unpoly/form/switcher'),
  () => require('./unpoly/form/form_validator'),
  () => require('./unpoly/viewport/focus_capsule'),
  () => require('./unpoly/fragment/render/fragment_processor'),
  () => require('./unpoly/fragment/fragment_finder'),
  () => require('./unpoly/fragment/render/fragment_focus'),
  () => require('./unpoly/radio/fragment_polling'),
  () => require('./unpoly/fragment/render/fragment_scrolling'),
  () => require('./unpoly/layer/base'),
  () => require('./unpoly/layer/modes/overlay'),
  () => require('./unpoly/layer/modes/overlay_with_tether'),
  () => require('./unpoly/layer/modes/overlay_with_viewport'),
  () => require('./unpoly/layer/modes/root_layer'),
  () => require('./unpoly/layer/modes/modal_layer'),
  () => require('./unpoly/layer/modes/popup_layer'),
  () => require('./unpoly/layer/modes/drawer_layer'),
  () => require('./unpoly/layer/modes/cover_layer'),
  () => require('./unpoly/layer/layer_lookup'),
  () => require('./unpoly/layer/layer_stack'),
  () => require('./unpoly/status/link_current_urls'),
  () => require('./unpoly/link/link_follow_intent'),
  () => require('./unpoly/motion/motion_controller'),
  () => require('./unpoly/layer/overlay_focus'),
  () => require('./unpoly/form/params'),
  () => require('./unpoly/status/preview'),
  () => require('./unpoly/network/progress_bar'),
  () => require('./unpoly/fragment/render/render_options'),
  () => require('./unpoly/fragment/render/render_result'),
  () => require('./unpoly/network/request'),
  () => require('./unpoly/network/request_cache'),
  () => require('./unpoly/network/request_queue'),
  () => require('./unpoly/network/form_renderer'),
  () => require('./unpoly/network/xhr_renderer'),
  () => require('./unpoly/network/response'),
  () => require('./unpoly/fragment/render/response_doc'),
  () => require('./unpoly/viewport/reveal_motion'),
  () => require('./unpoly/fragment/selector'),
  () => require('./unpoly/layer/tether'),

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
