/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.ResponseDoc = class ResponseDoc {

  constructor(options) {
    // We wrap <noscript> tags into a <div> for two reasons:
    //
    // (1) IE11 and Edge cannot find <noscript> tags with jQuery or querySelector() or
    //     getElementsByTagName() when the tag was created by DOMParser. This is a bug.
    //     https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12453464/
    //
    // (2) The children of a <nonscript> tag are expected to be a verbatim text node
    //     in a scripting-capable browser. However, due to rules in the DOMParser spec,
    //     the children are parsed into actual DOM nodes. This confuses libraries that
    //     work with <noscript> tags, such as lazysizes.
    //     http://w3c.github.io/DOM-Parsing/#dom-domparser-parsefromstring
    //
    // We will unwrap the wrapped <noscript> tags when a fragment is requested with
    // #first(), and only in the requested fragment.
    this.noscriptWrapper = new up.HTMLWrapper('noscript');

    // We strip <script> tags from the HTML.
    // If you need a fragment update to call JavaScript code, call it from a compiler
    // ([Google Analytics example](https://makandracards.com/makandra/41488-using-google-analytics-with-unpoly)).
    this.scriptWrapper = new up.HTMLWrapper('script');

    this.root =
      this.parseDocument(options) || this.parseFragment(options) || this.parseContent(options);
  }

  parseDocument(options) {
    return this.parse(options.document, e.createDocumentFromHTML);
  }

  parseContent(options) {
    // Parsing { inner } is the last option we try. It should always succeed in case someone
    // tries `up.layer.open()` without any args. Hence we set the innerHTML to an empty string.
    let content = options.content || '';
    const target = options.target || up.fail("must pass a { target } when passing { content }");

    // Conjure an element that will later match options.target in @select()
    const matchingElement = e.createFromSelector(target);

    if (u.isString(content)) {
      content = this.wrapHTML(content);
      // Don't use e.createFromHTML() here, since content may be a text node.
      matchingElement.innerHTML = content;
    } else {
      matchingElement.appendChild(content);
    }

    return matchingElement;
  }

  parseFragment(options) {
    return this.parse(options.fragment);
  }

  parse(value, parseFn = e.createFromHTML) {
    if (u.isString(value)) {
      value = this.wrapHTML(value);
      value = parseFn(value);
    }
    return value;
  }

  rootSelector() {
    return up.fragment.toTarget(this.root);
  }

  wrapHTML(html) {
    html = this.noscriptWrapper.wrap(html);

    if (up.fragment.config.runScripts) {
      // <script> tags instantiated by DOMParser are inert and will not run
      // when appended. So we wrap them, then unwrap once attach. This will
      // cause the script to run.
      html = this.scriptWrapper.wrap(html);
    } else {
      html = this.scriptWrapper.strip(html);
    }

    return html;
  }

  getTitle() {
    // Cache since multiple plans will query this.
    // Use a flag so we can cache an empty result.
    if (!this.titleParsed) {
      this.title = __guard__(this.root.querySelector("head title"), x => x.textContent);
      this.titleParsed = true;
    }
    return this.title;
  }

  select(selector) {
    // Use up.fragment.subtree() instead of up.element.subtree()
    // so we can support the non-standard :has() selector.
    // We need to disable layer matching with { layer: 'any' } since
    // our detached document is not part of the layer stack.
    return up.fragment.subtree(this.root, selector, {layer: 'any'})[0];
  }

  finalizeElement(element) {
    // Restore <noscript> tags so they become available to compilers.
    this.noscriptWrapper.unwrap(element);

    // Restore <script> so they will run.
    return this.scriptWrapper.unwrap(element);
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}