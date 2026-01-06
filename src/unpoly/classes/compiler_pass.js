const u = up.util

up.CompilerPass = class CompilerPass {

  constructor(root, macros, compilers, { layer, data, dataRoot, dataMap, meta, insertedEvent }) {
    // (1) If a caller has already looked up the layer we don't want to look it up again.
    // (2) Default to the current layer in case the user manually compiles a detached element.
    layer ||= up.layer.get(root) || up.layer.current

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
    // (B) The meta object may have a deprecated getter on { response }, defined by unpoly-migrate.js.
    //     Hence we cannot make a new object here.
    meta ||= {}
    meta.layer ??= layer
    meta.ok ??= true
    meta.revalidating ??= false
    this._meta = meta
  }

  weavableRun() {
    up.puts('up.hello()', "Compiling fragment %o", this._root)
    this._assignDataToElements()
    this._runCompilers(this._macros)

    return {
      value: this._root,
      finish: async () => {
        this._emitCompileEvent()
        this._runCompilers(this._compilers)
        this._emitInsertedEvent()
        await Promise.all(this._compilePromises)
      }
    }
  }

  _emitCompileEvent() {
    up.emit(this._root, 'up:fragment:compile', { log: false })
  }

  _emitInsertedEvent() {
    if (this._insertedEvent) {
      up.fragment.emitInserted(this._root, this._meta)
    }
  }

  _assignDataToElements() {
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

  _runCompilers(compilers) {
    // If we're compiling a fragment in a background layer, we want
    // up.layer.current to resolve to that background layer, not the front layer.
    this._layer.asCurrent(() => {
      for (let compiler of compilers) {
        this._runCompiler(compiler)
      }
    })
  }

  _runCompiler(compiler) {
    const matches = this._selectOnce(compiler)
    if (!matches.length) { return }

    if (!compiler.isDefault) {
      up.puts('up.hello()', 'Compiling %d× "%s" on %s', matches.length, compiler.selector, this._layer)
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

  _compileOneElement(compiler, element) {
    const compileArgs = [element]
    // (A) For performance reason, do not parse [up-data] unless the compiler function expects a second argument.
    // (B) We must pass data for an argument count of 0, since then the function might take varargs.
    if (compiler.length !== 1) {
      const data = up.script.data(element)
      compileArgs.push(data, this._meta)
    }

    let onDestructor = (destructor) => up.destructor(element, destructor)
    this._applyCompilerFunction(compiler, element, compileArgs, onDestructor)
  }

  _compileBatch(compiler, elements) {
    const compileArgs = [elements]
    // Do not retrieve and parse [up-data] unless the compiler function
    // expects a second argument. Note that we must pass data for an argument
    // count of 0, since then the function might take varargs.
    if (compiler.length !== 1) {
      const dataList = u.map(elements, up.script.data)
      compileArgs.push(dataList, this._meta)
    }

    let onDestructor = () => this._reportBatchCompilerWithDestructor(compiler)
    this._applyCompilerFunction(compiler, elements, compileArgs, onDestructor)
  }

  async _applyCompilerFunction(compiler, elementOrElements, compileArgs, onDestructor) {
    let maybeDestructor = up.error.guard(() => compiler.apply(elementOrElements, compileArgs))

    if (u.isPromise(maybeDestructor)) {
      // If the async compiler rejects, emit an `error` event but don't reject.
      let guardedPromise = up.error.guardPromise(maybeDestructor)

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

  _reportBatchCompilerWithDestructor(compiler) {
    let error = new up.Error(['Batch compiler (%s) cannot return a destructor', compiler.selector])
    reportError(error)
  }

  _select(selector) {
    return up.fragment.subtree(this._root, u.evalOption(selector), { layer: this._layer } )
  }

  _selectOnce(compiler) {
    let matches = this._select(compiler.selector)

    if (!compiler.rerun) {
      matches = u.filter(matches, (element) => {
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
