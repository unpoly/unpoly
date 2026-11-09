import { evalOption, filterList, isPromise, map } from '../util.js'
import { trackDefinitions } from '../element.js'
import { guard, guardPromise } from '../error.js'
import { UpError } from '../error/error.js'
import { emit } from '../event.js'
import { emitFragmentInserted, getSubtree } from '../fragment.js'
import { layerStack } from '../layer.js'
import { printToStandard } from '../log.js'
import { readData, registerDestructor } from '../script.js'
import type { AnyFunction, PlainObject } from '../util.js'
import type { Layer } from '../layer/base.js'

/**
A compiler or macro registered with `up.compiler()` or `up.macro()`: the compile function
with its registration options.
@internal
*/
export type Compiler = AnyFunction & {
  selector: string | (() => string)
  isDefault?: boolean
  batch?: boolean
  rerun?: boolean
}

/**
Options for compiling a fragment. See `up.hello()`.
@internal
*/
export interface HelloFragmentOptions {
  layer?: Layer
  data?: any
  dataRoot?: Element
  dataMap?: Record<string, any>
  meta?: PlainObject
  insertedEvent?: boolean
}

// Elements remember the data passed to up.hello(), and which compilers have run on them.
type CompiledElement = Element & { upCompileData?: any, upAppliedCompilers?: Set<Compiler> }

export class HelloFragment {
  declare _root: Element
  declare _macros: Compiler[]
  declare _compilers: Compiler[]
  declare _layer: Layer
  declare _data: any
  declare _dataRoot: CompiledElement
  declare _dataMap: Record<string, any> | undefined
  declare _compilePromises: Promise<any>[]
  declare _insertedEvent: boolean
  declare _meta: PlainObject

  constructor(root: Element, macros: Compiler[], compilers: Compiler[], { layer, data, dataRoot, dataMap, meta, insertedEvent }: HelloFragmentOptions) {
    // (1) If a caller has already looked up the layer we don't want to look it up again.
    // (2) Default to the current layer in case the user manually compiles a detached element.
    layer ||= layerStack.get(root) || layerStack.current

    this._root = root
    this._macros = macros
    this._compilers = compilers
    this._layer = layer
    this._data = data
    this._dataRoot = dataRoot || root
    this._dataMap = dataMap
    this._compilePromises = []
    this._insertedEvent = insertedEvent ?? true

    // (A) When a render pass compilers, it passes along a { meta } option.
    //     When up.hello() is called by the user, { meta } will be missing and we set defaults.
    // (B) We cannot make a new object literal here.
    //     The meta arg may have a deprecated getter on { response }, defined by unpoly-migrate.js.
    meta ||= {}
    meta.layer ??= layer
    meta.ok ??= true
    meta.revalidating ??= false
    this._meta = meta
  }

  async run(): Promise<Element> {
    printToStandard('up.hello()', "Compiling fragment %o", this._root)
    this._assignDataToElements()

    this._runCompilers(this._macros)
    this._emitCompileEvent()
    this._runCompilers(this._compilers)

    // Some selectors only match a custom element after its definition, which may arrive
    // after the element was inserted. Emit up:element:defined when that happens, so
    // e.g. an up.SelectorTracker can sync again.
    //
    // We scan after running compilers, which may insert undefined custom elements themselves.
    trackDefinitions(this._root)

    this._emitInsertedEvent()
    await Promise.all(this._compilePromises)
    return this._root
  }

  _emitCompileEvent(): void {
    emit(this._root, 'up:compilers:before', { log: false })
  }

  _emitInsertedEvent(): void {
    if (this._insertedEvent) {
      emitFragmentInserted(this._root, this._meta)
    }
  }

  _assignDataToElements(): void {
    if (this._data) {
      this._dataRoot.upCompileData = this._data
    }

    if (this._dataMap) {
      for (let selector in this._dataMap) {
        for (let match of this._select(selector)) {
          match.upCompileData = this._dataMap[selector]
        }
      }
    }
  }

  _runCompilers(compilers: Compiler[]): void {
    // If we're compiling a fragment in a background layer, we want
    // up.layer.current to resolve to that background layer, not the front layer.
    this._layer.asCurrent(() => {
      for (let compiler of compilers) {
        this._runCompiler(compiler)
      }
    })
  }

  _runCompiler(compiler: Compiler): void {
    const matches = this._selectOnce(compiler)
    if (!matches.length) { return }

    if (!compiler.isDefault) {
      printToStandard('up.hello()', 'Compiling %d× "%s" on %s', matches.length, compiler.selector, this._layer)
    }

    if (compiler.batch) {
      this._compileBatch(compiler, matches)
    } else {
      for (let match of matches) {
        this._compileOneElement(compiler, match)
      }
    }

    up.migrate.postCompile?.(matches, compiler)
  }

  _compileOneElement(compiler: Compiler, element: Element): void {
    const compileArgs: any[] = [element]
    // (A) For performance reason, do not parse [up-data] unless the compiler function expects a second argument.
    // (B) We must pass data for an argument count of 0, since then the function might take varargs.
    if (compiler.length !== 1) {
      const data = readData(element)
      compileArgs.push(data, this._meta)
    }

    let onDestructor = (destructor) => registerDestructor(element, destructor)
    this._applyCompilerFunction(compiler, element, compileArgs, onDestructor)
  }

  _compileBatch(compiler: Compiler, elements: Element[]): void {
    const compileArgs: any[] = [elements]
    // Do not retrieve and parse [up-data] unless the compiler function
    // expects a second argument. Note that we must pass data for an argument
    // count of 0, since then the function might take varargs.
    if (compiler.length !== 1) {
      const dataList = map(elements, readData)
      compileArgs.push(dataList, this._meta)
    }

    let onDestructor = () => this._reportBatchCompilerWithDestructor(compiler)
    this._applyCompilerFunction(compiler, elements, compileArgs, onDestructor)
  }

  async _applyCompilerFunction(compiler: Compiler, elementOrElements: Element | Element[], compileArgs: any[], onDestructor: (destructor: any) => void): Promise<void> {
    let maybeDestructor = guard(() => compiler.apply(elementOrElements, compileArgs))

    if (isPromise(maybeDestructor)) {
      // If the async compiler rejects, emit an `error` event but don't reject.
      let guardedPromise = guardPromise(maybeDestructor)

      // Remember this promise for the return value of #run()
      this._compilePromises.push(guardedPromise)

      // (1) We don't know yet if the async compiler function will return destructors.
      // (2) Ideally we want to avoid setting .up-can-clean on every element that is async-compiled.
      // (3) There is an edge case where a an element is destroyed, before its async compiler
      //     function resolves. In that case we still want to execute a returned destructor function.
      maybeDestructor = await guardedPromise
    }

    if (maybeDestructor) onDestructor(maybeDestructor)
  }

  _reportBatchCompilerWithDestructor(compiler: Compiler): void {
    let error = new UpError(['Batch compiler (%s) cannot return a destructor', compiler.selector])
    reportError(error)
  }

  _select(selector: string | (() => string)): CompiledElement[] {
    return getSubtree(this._root, evalOption(selector), { layer: this._layer } )
  }

  _selectOnce(compiler: Compiler): CompiledElement[] {
    let matches = this._select(compiler.selector)

    if (!compiler.rerun) {
      matches = filterList(matches, (element) => {
        let appliedCompilers = (element.upAppliedCompilers ||= new Set())
        if (!appliedCompilers.has(compiler)) {
          appliedCompilers.add(compiler)
          return true
        }
      })
    }

    return matches
  }

}
