const u = up.util

up.CompilerPass = class CompilerPass {

  constructor(root, compilers, { layer, data, dataMap, meta }) {
    // (1) If a caller has already looked up the layer we don't want to look it up again.
    // (2) Default to the current layer in case the user manually compiles a detached element.
    layer ||= up.layer.get(root) || up.layer.current

    this._root = root
    this._compilers = compilers
    this._layer = layer
    this._data = data
    this._dataMap = dataMap

    this._meta = { layer, ...meta }
    this._errors = []
  }

  run() {
    // If we're compiling a fragment in a background layer, we want
    // up.layer.current to resolve to that background layer, not the front layer.
    this._layer.asCurrent(() => {

      this.setCompileData()

      for (let compiler of this._compilers) {
        this._runCompiler(compiler)
      }

    })

    if (this._errors.length) {
      throw new up.CannotCompile('Errors while compiling', { errors: this._errors })
    }
  }

  setCompileData() {
    if (this._data) {
      this._root.upCompileData = this._data
    }

    if (this._dataMap) {
      for (let selector in this._dataMap) {
        for (let match of this._select(selector)) {
          match.upCompileData = this._dataMap[selector]
        }
      }
    }
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

    return up.migrate.postCompile?.(matches, compiler)
  }

  _compileOneElement(compiler, element) {
    const compileArgs = [element]
    // Do not retrieve and parse [up-data] unless the compiler function
    // expects a second argument. Note that we must pass data for an argument
    // count of 0, since then the function might take varargs.
    if (compiler.length !== 1) {
      const data = up.script.data(element)
      compileArgs.push(data, this._meta)
    }

    const result = this._applyCompilerFunction(compiler, element, compileArgs)

    let destructorOrDestructors = this._destructorPresence(result)
    if (destructorOrDestructors) {
      up.destructor(element, destructorOrDestructors)
    }
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

    const result = this._applyCompilerFunction(compiler, elements, compileArgs)

    if (this._destructorPresence(result)) {
      up.fail('Compilers with { batch: true } cannot return destructors')
    }
  }

  _applyCompilerFunction(compiler, elementOrElements, compileArgs) {
    try {
      return compiler.apply(elementOrElements, compileArgs)
    } catch (error) {
      this._errors.push(error)
      up.log.error('up.hello()', 'While compiling %o: %o', elementOrElements, error)
    }
  }

  _destructorPresence(result) {
    // Check if the result value looks like a destructor to filter out
    // unwanted implicit returns in CoffeeScript.
    if (u.isFunction(result) || (u.isArray(result) && (u.every(result, u.isFunction)))) {
      return result
    }
  }

  _select(selector) {
    return up.fragment.subtree(this._root, u.evalOption(selector), { layer: this._layer } )
  }

  _selectOnce(compiler) {
    let matches = this._select(compiler.selector)
    return u.filter(matches, (element) => {
      let appliedCompilers = (element.upAppliedCompilers ||= new Set())
      if (!appliedCompilers.has(compiler)) {
        appliedCompilers.add(compiler)
        return true
      }
    })
  }

}
