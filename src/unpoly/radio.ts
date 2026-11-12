import * as u from './util.js'
import * as e from './element.js'
import { OptionsParser } from './element/options_parser.js'
import { newConfig } from './util/config.js'
import { build } from './event.js'
import {
  compressNestedSteps, getAllFragments, getSmart, tryToTarget, type FragmentKeepEvent,
} from './fragment.js'
import { layerStack } from './layer.js'
import { parseRequestOptions } from './link.js'
import { printToWarn } from './log.js'
import { motionOptions } from './motion.js'
import { callbackAttr, registerAttrCompiler, registerMacro } from './script.js'
import { statusOptions } from './status.js'
import type * as t from './radio/types.js'
export type * from './radio/types.js'
import { FragmentPolling } from './radio/fragment_polling.js'

export const radioConfig = newConfig('up.radio.config', (): t.RadioConfig => ({
  hungrySelectors: ['[up-hungry]'],
  noHungrySelectors: ['[up-hungry=false]'],
  pollInterval: 30000,
}))

export function hungrySteps(renderOptions: u.PlainObject): t.HungrySteps {
  let { hungry, origin, layer: renderLayer, meta } = renderOptions
  let steps: t.HungrySteps = { current: [], other: [] }

  if (!hungry) return steps

  let hungrySelector = radioConfig.selector('hungrySelectors')

  // When multiple steps target the same new selector, we're updating the layer
  // that's closer to the layer of the render pass.
  //
  // In this case two steps will match the same { newElement }. Hence this case is
  // not covered by step compression (which looks at { oldElement }).
  const layerPreference = [renderLayer, ...renderLayer.ancestors, ...renderLayer.descendants]

  for (let elementLayer of layerPreference) {
    let hungries = getAllFragments(elementLayer.element, hungrySelector, { layer: elementLayer })

    for (let element of hungries) {
      let selector = tryToTarget(element, { origin })
      if (!selector) {
        printToWarn('[up-hungry]', 'Ignoring untargetable fragment %o', element)
        continue
      }

      let ifLayer = e.stringAttr(element, 'up-if-layer')
      let applicableLayers = ifLayer ? layerStack.getAll(ifLayer, { baseLayer: elementLayer }) : [elementLayer]

      let elementMotion = motionOptions(element)

      // We cannot emit up:fragment:hungry here as we don't know { newElement } yet.
      let selectEvent = build('up:fragment:hungry', { log: false })
      let selectCallback = callbackAttr(element, 'up-on-hungry', { expandObject: ['newFragment', 'renderOptions'] })

      let step = {
        selector,            // The selector for a single step is { selector }
        oldElement: element, // The match on the current page
        layer: elementLayer, // May be different from { layer } when we found an [up-hungry][up-if-layer=any]
        origin,              // The { origin } passed into the fn. will be used to match { newElement } later.
        ...elementMotion,    // The hungry element defines its own transition, duration, easing.
        placement: 'swap',   // Hungry elements are always swapped, never appended
        keep: true,          // Always honor [up-keep] in hungry elements. Set here because we don't inherit default render options.
        maybe: true,         // Don't fail if we cannot match { newElement } later.
        meta,
        selectEvent,         // Used by up.ResponseDoc#selectStep()
        selectCallback,      // Used by up.ResponseDoc#selectStep()
        // The step also gets a reference to the original render options.
        // Although these render options are not used to render the hungry step, it will be
        // passed to up:fragment:hungry listener to e.g. only update hungry elements if the
        // original render pass would update history.
        originalRenderOptions: renderOptions,
      }

      if (applicableLayers.includes(renderLayer)) {
        let list = renderLayer === elementLayer ? steps.current : steps.other
        list.push(step)
      }
    }

  }

  // Remove nested steps on other layers.
  // Note that `steps.current` is already compressed by UpdateLayerPlan once it's been mixed with
  // the explicit target steps. So we're not doing it again here.
  steps.other = compressNestedSteps(steps.other)

  return steps
}

export function startPolling(fragment: Element, options: t.PollOptions = {}): void {
  FragmentPolling.forFragment(fragment).forceStart(options)
}

export function stopPolling(element: Element): void {
  FragmentPolling.forFragment(element).forceStop()
}

export function pollOptions(fragment: e.ElementOrSelector, options?: t.PollOptions): t.PollOptions {
  fragment = getSmart(fragment)!
  options = u.newOptions(options)
  const defaults = { background: true }
  const parser = new OptionsParser(fragment, options, { defaults })
  parser.number('interval', { default: radioConfig.pollInterval })
  parser.string('ifLayer', { default: 'front' })
  parser.include(parseRequestOptions)
  parser.include(statusOptions)
  // An error response renders nothing, unless the fragment has [up-fail=false].
  // Polling then tries again after the next interval.
  options.failTarget ??= ':none'
  return options
}

export function install(): void {
  registerAttrCompiler('up-poll', function(fragment) {
    FragmentPolling.forFragment(fragment).onPollAttributeObserved()
  })

  registerMacro('[up-flashes]', function(fragment) {
    e.setMissingAttrs(fragment, {
      'up-hungry': '',
      'up-if-layer': 'subtree',
      'up-keep': '',
      'role': 'alert',
    })

    fragment.addEventListener('up:fragment:keep', function(event) {
      // A flash is an HTML element, so its new version is one too.
      if (!e.isEmpty((event as FragmentKeepEvent).newFragment as HTMLElement)) event.preventDefault()
    })
  })
}

export const api = {
  radio: {
    config: radioConfig,
    startPolling,
    stopPolling,
    pollOptions,
  },
}
