const u = up.util
const e = up.element

up.CompilerPass = class CompilerPass {

  constructor(root, compilers, options = {}) {
    this.root = root
    this.compilers = compilers

    // Exclude all elements that are descendants of the subtrees we want to keep.
    // The exclusion process is very expensive (in one case compiling 100 slements
    // took 1.5s because of this). That's why we only do it if (1) options.skipSubtrees
    // was given and (2) there is an [up-keep] element in root.
    this.skipSubtrees = options.skip
    if (!this.skipSubtrees.length || !this.root.querySelector('[up-keep]')) {
      this.skipSubtrees = undefined
    }

    // (1) If a caller has already looked up the layer we don't want to look it up again.
    // (2) Ddefault to the current layer in case the user manually compiles a detached element.
    this.layer = options.layer || up.layer.get(this.root) || up.layer.current

    this.errors = []
  }

  run() {
    up.puts('up.hello()', "Compiling fragment %o", this.root)
    // If we're compiling a fragment in a background layer, we want
    // up.layer.current to resolve to that background layer, not the front layer.
    this.layer.asCurrent(() => {
      for (let compiler of this.compilers) {
        this.runCompiler(compiler)
      }
    })

    if (this.errors.length) {
      throw new up.CannotCompile('Errors while compiling', { errors: this.errors })
    }
  }

  runCompiler(compiler) {
    const matches = this.select(compiler.selector)
    if (!matches.length) { return; }

    if (!compiler.isDefault) {
      up.puts('up.hello()', 'Compiling "%s" on %d element(s)', compiler.selector, matches.length)
    }

    if (compiler.batch) {
      this.compileBatch(compiler, matches)
    } else {
      for (let match of matches) {
        this.compileOneElement(compiler, match)
      }
    }

    return up.migrate.postCompile?.(matches, compiler)
  }

  compileOneElement(compiler, element) {
    const elementArg = compiler.jQuery ? up.browser.jQuery(element) : element
    const compileArgs = [elementArg]
    // Do not retrieve and parse [up-data] unless the compiler function
    // expects a second argument. Note that we must pass data for an argument
    // count of 0, since then the function might take varargs.
    if (compiler.length !== 1) {
      const data = up.syntax.data(element)
      compileArgs.push(data)
    }

    const result = this.applyCompilerFunction(compiler, element, compileArgs)

    let destructorOrDestructors = this.destructorPresence(result)
    if (destructorOrDestructors) {
      up.destructor(element, destructorOrDestructors)
    }
  }

  compileBatch(compiler, elements) {
    const elementsArgs = compiler.jQuery ? up.browser.jQuery(elements) : elements
    const compileArgs = [elementsArgs]
    // Do not retrieve and parse [up-data] unless the compiler function
    // expects a second argument. Note that we must pass data for an argument
    // count of 0, since then the function might take varargs.
    if (compiler.length !== 1) {
      const dataList = u.map(elements, up.syntax.data)
      compileArgs.push(dataList)
    }

    const result = this.applyCompilerFunction(compiler, elements, compileArgs)

    if (this.destructorPresence(result)) {
      up.fail('Compilers with { batch: true } cannot return destructors')
    }
  }

  applyCompilerFunction(compiler, elementOrElements, compileArgs) {
    try {
      return compiler.apply(elementOrElements, compileArgs)
    } catch (error) {
      this.errors.push(error)
      up.log.error('up.hello()', 'While compiling %o: %o', elementOrElements, error)
      up.error.emitGlobal(error)
    }
  }

  destructorPresence(result) {
    // Check if the result value looks like a destructor to filter out
    // unwanted implicit returns in CoffeeScript.
    if (u.isFunction(result) || (u.isArray(result) && (u.every(result, u.isFunction)))) {
      return result
    }
  }

  select(selector) {
    let matches = e.subtree(this.root, u.evalOption(selector))
    if (this.skipSubtrees) {
      matches = u.reject(matches, (match) => this.isInSkippedSubtree(match))
    }
    return matches
  }

  isInSkippedSubtree(element) {
    let parent
    if (u.contains(this.skipSubtrees, element)) {
      return true
    } else if ((parent = element.parentElement)) {
      return this.isInSkippedSubtree(parent)
    } else {
      return false
    }
  }
}
