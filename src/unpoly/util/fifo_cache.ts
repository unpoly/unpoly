import { identity } from '../util.js'

/**
Options for `up.FIFOCache`.
@internal
*/
export interface FIFOCacheOptions<K> {
  capacity?: number
  normalizeKey?: (key: K) => any
}

export class FIFOCache<K = any, V = any> {
  declare _map: Map<any, V>
  declare _capacity: number
  declare _normalizeKey: (key: K) => any

  constructor({ capacity = 10, normalizeKey = identity }: FIFOCacheOptions<K> = {}) {
    this._map = new Map()
    this._capacity = capacity
    this._normalizeKey = normalizeKey
  }

  get(key: K): V | undefined {
    key = this._normalizeKey(key)
    return this._map.get(key)
  }

  set(key: K, value: V): void {
    if (this._map.size === this._capacity) {
      let oldestKey = this._map.keys().next().value
      this._map.delete(oldestKey)
    }

    key = this._normalizeKey(key)
    this._map.set(key, value)
  }

  clear(): void {
    this._map.clear()
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  FIFOCache,
}
