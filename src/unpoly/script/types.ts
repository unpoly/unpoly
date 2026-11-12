import type * as u from '../util.js'
import { type UpEvent } from '../event.js'
import { type RenderOptions } from '../fragment.js'
import { type Layer } from '../layer.js'
import { type UpResponse } from '../network.js'

/**
Options for `up.hello()`.
*/
export interface HelloOptions {
  layer?: Layer
  data?: any
  dataMap?: Record<string, any>
  meta?: u.PlainObject
  insertedEvent?: boolean
  // Only run these macros and compilers (default: all registered ones).
  macros?: Compiler[]
  compilers?: Compiler[]
  // The element that gets the { data }, if not the compiled element.
  dataRoot?: Element
}

/**
Options for `up.compiler()` and `up.macro()`.
*/
export interface CompilerOptions {
  priority?: number
  batch?: boolean
  /** @internal Also run on elements that the compiler already compiled. */
  rerun?: boolean
  /** @internal Register a macro. */
  macro?: boolean
}

/**
Options for `up.compiler()` and `up.macro()` with a compiler that gets all matching elements at once.
*/
export interface BatchCompilerOptions extends CompilerOptions {
  batch: true
}

/**
[Information about the render pass](/learn/enhancing-elements#meta) that a compiler gets as its
third argument. The `{ meta }` option of `up.hello()` may add more keys.
*/
export interface CompilerMeta {
  layer: Layer
  ok: boolean
  revalidating: boolean
  [key: string]: any
}

/**
The selector of a compiler or macro. A function is called each time the compiler runs, so the
selector can come from a config that changes later.
*/
export type CompilerSelector = string | (() => string)

/**
The function passed to `up.compiler()` or `up.macro()`. It is called with a matching element, its
[data](/learn/data) and [meta information](/learn/enhancing-elements#meta) about the render pass.
It may return a destructor function, an array of destructors, or a promise.

A compiler gets any element that matches its selector, so the element type is a parameter. It
defaults to `HTMLElement`. A compiler for SVG elements can annotate its argument as `SVGElement`.
*/
export type CompilerCallback<E extends Element = HTMLElement> = (element: E, data: any, meta: CompilerMeta) => unknown

/**
The function passed to `up.compiler()` or `up.macro()` with `{ batch: true }`. It is called once
with all matching elements and their data.

TypeScript only picks this callback type when `batch` is the literal `true`. Options from a
variable need the type `BatchCompilerOptions` or `as const`, or `batch` is widened to `boolean`
and the callback gets one element.
*/
export type BatchCompilerCallback<E extends Element = HTMLElement> = (elements: E[], data: any[], meta: CompilerMeta) => unknown

/**
Options for `registerAttrCompiler()`.
@internal
*/
export interface AttrCompilerOptions extends CompilerOptions {
  // The value for an attribute set without a value, or to "true".
  defaultValue?: string
}

/**
A compiler for `registerAttrCompiler()`. It is called with the element and its attribute value.
Without a `{ defaultValue }`, the value of an attribute set without a value (or to "true") is `true`.
@internal
*/
export type AttrCompilerCallback<V = string | true, E extends Element = HTMLElement> = (element: E, value: V) => unknown

/**
Options for `up.script.parseCallback()`.
@internal
*/
export interface ParseCallbackOptions {
  argNames?: string[]
  // Also pass these properties of the first argument as arguments.
  expandObject?: string[] | false
}

/**
The `up:assets:changed` event.
*/
export interface AssetsChangedEvent extends UpEvent {
  newAssets: u.List<Element>
  oldAssets: u.List<Element>
  renderOptions: RenderOptions
  response?: UpResponse
}

/**
The settings in `up.script.config`, described in its doc comment.
*/
export interface ScriptConfig {
  assetSelectors: string[]
  noAssetSelectors: string[]
  scriptSelectors: string[]
  noScriptSelectors: string[]
  evalCallbackPolicy: PolicyString
  scriptElementPolicy: PolicyString
  cspNonce: string | (() => string | undefined)
  cspWarnings: boolean
  /**
  Callback attributes like `[up-on-loaded]`, which may carry a CSP nonce.
  @internal
  */
  nonceableAttributes: string[]
}

/**
A compiler or macro registered with `up.compiler()` or `up.macro()`: the compile function
with its registration options.
@internal
*/
export interface Compiler extends CompilerOptions {
  (...args: any[]): any
  selector: CompilerSelector
  priority: number
  // Registered while Unpoly boots, so a reset keeps it.
  isDefault?: boolean
}

/**
Properties Unpoly sets on elements to remember their data, their destructors and the compilers
that ran on them.
@internal
*/
export interface ScriptedElement extends Element {
  upData?: any
  upTemplateData?: u.PlainObject
  upCompileData?: u.PlainObject
  upDestructors?: u.Cleaner
  upAppliedCompilers?: Set<Compiler>
}

/**
A value that `up.script.config.evalCallbackPolicy` or `up.script.config.scriptElementPolicy` can be set to.
@internal
*/
export type PolicyString = 'pass' | 'block' | 'nonce' | 'auto'

/**
The names and values of the arguments for a callback string, and its `this`.
@internal
*/
export interface EvalEnv {
  argNames: string[]
  argValues: any[]
  thisContext?: any
}
