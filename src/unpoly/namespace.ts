import util from './util'

const up = {
  util,
  version: 'dummy',
}

declare global {
  interface Window {
    up: typeof up
  }
}

window.up = up
