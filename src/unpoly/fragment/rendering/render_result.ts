import * as u from '../../util.js'
import { isCritical } from '../../error.js'
import { type Layer } from '../../layer.js'
import type * as t from '../types.js'

// Options for constructing an up.RenderResult.
interface RenderResultOptions {
  layer?: Layer
  target?: string
  renderOptions?: t.RenderOptions
  partialResults?: t.PartialRenderResult[]
}

export class RenderResult {
  declare layer: Layer
  declare target: string
  declare renderOptions: t.RenderOptions
  declare fragments: Element[]
  declare finished: Promise<RenderResult>

  constructor({ layer, target, renderOptions = {}, partialResults = [] }: RenderResultOptions = {}) {
    // Unpoly always passes both. Only specs build an empty result.
    this.layer = layer!
    this.target = target!
    this.renderOptions = renderOptions

    this.fragments = this._partialPhase(partialResults, 'fragments').flat()
    this.finished = this._finish(partialResults)
  }

  _partialPhase(partialResults: t.PartialRenderResult[], phase: keyof t.PartialRenderResult, extraValue?: any): any[] {
    return u.compact([...u.map(partialResults, phase), extraValue])
  }

  async _finish(partialResults: t.PartialRenderResult[]): Promise<RenderResult> {
    let finishedPromises = this._partialPhase(partialResults, 'finished')
    let verifyFns = this._partialPhase(partialResults, 'verifyFinished', this.renderOptions.verifyFinished)
    await Promise.all(finishedPromises)

    let finishedResult: RenderResult = this
    for (let verifyFn of verifyFns) {
      let verifyerResult = await verifyFn(finishedResult)
      finishedResult = verifyerResult || finishedResult
    }
    return finishedResult
  }

  get none(): boolean {
    return !this.fragments.length
  }

  get fragment(): Element | undefined {
    return this.fragments[0]
  }

  get ok(): boolean {
    return !this.renderOptions.didFail
  }

  // A failed render pass rejects with its result, which is not a critical error.
  [isCritical.key](): boolean {
    return false
  }

}

export const api = {
  RenderResult,
}
