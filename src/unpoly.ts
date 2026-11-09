// Unpoly's namespaces are ES modules. Each exports `api`, its contribution to `window.up`,
// and optionally `install()`, which performs all its side effects (registering compilers,
// listeners, macros). A module's top level only declares things.
//
// We only access `api` and `install` as static properties of the imported modules, never
// pass a module namespace object around: the bundler would then have to build that object,
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
//   These are safe for bindings from util and element, because this file imports them before
//   any namespace or class.
//   Only the few low-level modules they import themselves are evaluated earlier: mockable,
//   browser, error and the classes in error/ evaluate before util has finished, so they must
//   not use a binding from util while they are defined. This is also why util and element
//   must never import a feature namespace, or a class outside util/ and error/.
// - A base class must be evaluated before its subclasses. When a base class reaches one of
//   its subclasses through its own imports, `class Sub extends Base` runs before `Base` exists.
//   So code outside a class hierarchy imports the base class, not a subclass, wherever it can
//   (the layer modes are only imported by each other and by this file). Where it can't
//   (`RenderJob` creates a `ChangeFromURL`), that code must be evaluated before the base class.
// - This file imports the namespaces before the classes, and so enters every cycle through a
//   namespace.
//
// Loading dist/unpoly.js does not reliably reveal a cycle entered from the wrong side. The bundle
// has no "Cannot access … before initialization" errors, since esbuild turns top-level `const`,
// `let` and `class` into `var`. A binding read too early is just `undefined`: calling it throws a
// TypeError (`… is not a function`, `Class extends value undefined`), but reading a value does not
// fail at all. So after changing imports, check which modules a changed module reads while it is
// evaluated, and that they come first.
import * as namespace from './unpoly/namespace.js.erb'
import * as util from './unpoly/util.js'
import * as migrateStub from './unpoly/migrate_stub.js'
import * as element from './unpoly/element.js'
import * as framework from './unpoly/framework.js'
import * as event from './unpoly/event.js'
import * as protocol from './unpoly/protocol.js'
import * as log from './unpoly/log.js'
import * as script from './unpoly/script.js'
import * as history from './unpoly/history.js'
import * as fragment from './unpoly/fragment.js'
import * as viewport from './unpoly/viewport.js'
import * as motion from './unpoly/motion.js'
import * as network from './unpoly/network.js'
import * as layer from './unpoly/layer.js'
import * as link from './unpoly/link.js'
import * as form from './unpoly/form.js'
import * as status from './unpoly/status.js'
import * as radio from './unpoly/radio.js'
import * as rails from './unpoly/rails.js'
import * as baseError from './unpoly/error/error.js'
import * as notImplementedError from './unpoly/error/not_implemented.js'
import * as abortedError from './unpoly/error/aborted.js'
import * as blockedError from './unpoly/error/blocked.js'
import * as cannotMatchError from './unpoly/error/cannot_match.js'
import * as cannotParseError from './unpoly/error/cannot_parse.js'
import * as cannotTargetError from './unpoly/error/cannot_target.js'
import * as offlineError from './unpoly/error/offline.js'
import * as paramsClass from './unpoly/form/params.js'
import * as previewClass from './unpoly/status/preview.js'
import * as layerClass from './unpoly/layer/base.js'
import * as requestClass from './unpoly/network/request.js'
import * as responseClass from './unpoly/network/response.js'
import * as renderJobClass from './unpoly/fragment/render/render_job.js'
import * as renderResultClass from './unpoly/fragment/render/render_result.js'
import { RootLayer } from './unpoly/layer/modes/root_layer.js'
import { ModalLayer } from './unpoly/layer/modes/modal_layer.js'
import { PopupLayer } from './unpoly/layer/modes/popup_layer.js'
import { DrawerLayer } from './unpoly/layer/modes/drawer_layer.js'
import { CoverLayer } from './unpoly/layer/modes/cover_layer.js'
// up.internal, for the specs and unpoly-migrate. Imported last, so it doesn't change the order
// in which modules are evaluated.
import * as internal from './unpoly/internal.js'

window.up = {} as Up

const apis = [
  namespace.api,
  util.api,
  migrateStub.api,
  element.api,
  framework.api,
  event.api,
  protocol.api,
  log.api,
  script.api,
  history.api,
  fragment.api,
  viewport.api,
  motion.api,
  network.api,
  layer.api,
  link.api,
  form.api,
  status.api,
  radio.api,
  baseError.api,
  notImplementedError.api,
  abortedError.api,
  blockedError.api,
  cannotMatchError.api,
  cannotParseError.api,
  cannotTargetError.api,
  offlineError.api,
  paramsClass.api,
  previewClass.api,
  layerClass.api,
  requestClass.api,
  responseClass.api,
  renderJobClass.api,
  renderResultClass.api,
  internal.api,
] as const

// The type of `window.up` (see src/types/global.d.ts). It's an interface, so unpoly-migrate (and
// apps) can add keys by declaration merging. To add keys to an existing namespace, redeclare it
// with an intersection, like `util: CoreApi['util'] & { … }`: the redeclared type must be a subtype.
export interface Up extends CoreApi {} // oxlint-disable-line typescript/no-empty-object-type

/**
Every api above, merged.

@internal
*/
export type CoreApi = MergeApis<typeof apis>

type MergeApis<T extends readonly object[]> = T extends readonly [infer First, ...infer Rest extends readonly object[]]
  ? First & MergeApis<Rest>
  : unknown

// Copy property descriptors, so getters (like `up.context`) stay live.
// A later api would replace an earlier api's key without notice. The lint check in
// tooling/lint/api_collisions.mjs reports two apis that contribute the same key.
for (let api of apis) {
  Object.defineProperties(up, Object.getOwnPropertyDescriptors(api))
}

// Chrome reports an uncaught error by its class, like `Uncaught up.Aborted: …` in chromedriver's
// browser log, which apps filter in their tests. It also labels logged objects by their class, like
// `up.Request {…}`. (The error's own text, which DevTools prints, uses its `name` instead.)
// Minifiers rename our classes, in our .min.js bundles and in apps that minify unpoly.js
// themselves, so the log would say `Uncaught m: …`. So we give every class on window.up its public name:
// - Chrome labels an instance of a base class with its class's `name` property.
// - For an instance of a subclass, Chrome walks up the prototype chain and takes the first own
//   [Symbol.toStringTag] *data* property (it skips a getter) or the original name of an own
//   `constructor`, whichever comes first. So each class needs a tag on its own prototype.
// The tag also names our objects in Object.prototype.toString() and u.inspect(), and our errors (see
// error.ts). The layer modes aren't public, so they all say up.Layer. Internal classes on up.internal
// keep whatever name the minifier gives them. None of them is an error class.
const layerModes = [RootLayer, ModalLayer, PopupLayer, DrawerLayer, CoverLayer]
for (let key in up) {
  // Test the key first, so we don't call a getter like `up.context`.
  // `Up` has no index signature, so we read the key from an untyped `up`.
  if (/^[A-Z]/.test(key) && (up as any)[key].prototype) {
    framework.setClassName((up as any)[key], 'up.' + key)
  }
}
for (let mode of layerModes) {
  framework.setClassName(mode, 'up.Layer')
}

// The explicit install order. It is the order in which the namespaces registered their side
// effects before they were ES modules. All installs run before `framework.onEvaled()` below,
// while `isEvaling()` is still true. Event listeners, compilers, macros and registry
// entries created now are marked as defaults (`isDefault`), which a reset between specs keeps
// (see event_listener.ts, registry.ts, script.ts).
//
// Some things already happen when a module is evaluated, before any install: a `new Config()`
// builds its defaults and listens for `up:framework:reset`, and a few namespaces create helper
// objects (like up.network's request queue and cache).
const installs = [
  util.install,
  event.install,
  log.install,
  script.install,
  history.install,
  fragment.install,
  viewport.install,
  motion.install,
  network.install,
  // up.layer gets its mode classes from here. Nothing else imports them, so no other module can
  // reach a mode class before its superclass is evaluated (see the cycle rules above).
  () => layer.install(layerModes),
  link.install,
  form.install,
  status.install,
  radio.install,
  rails.install,
]

for (let install of installs) {
  install()
}

framework.onEvaled()
