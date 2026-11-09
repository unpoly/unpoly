import { spanObject } from '../util.js'

// The options that control how an overlay looks and animates.
// The Overlay constructor assigns each of them (Layer assigns { mode }). Keep both in sync.
//
// These live outside the Overlay class, so code outside the layer modes can use them without
// importing a mode class (see the cycle rules in src/unpoly.ts).
export const OVERLAY_VISUAL_KEYS = [
  'mode',
  'position',
  'align',
  'size',
  'origin', // for tethered anchor element
  'class',
  'backdrop',
  'dismissible',
  'dismissLabel',
  'dismissARIALabel',
  'openAnimation',
  'closeAnimation',
  'openDuration',
  'closeDuration',
  'openEasing',
  'closeEasing',
  'trapFocus',
]

export const UNSET_OVERLAY_VISUALS = spanObject(OVERLAY_VISUAL_KEYS, undefined)
