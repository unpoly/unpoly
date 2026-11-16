import * as u from '../util.js'

// Options for `up.FIFOCache`.
interface FIFOCacheOptions<K> {
  capacity?: number
  normalizeKey?: (key: K) => unknown
}

export class FIFOCache<K, V> {
  declare _map: Map<unknown, V>
  declare _capacity: number
  declare _normalizeKey: (key: K) => unknown

  constructor({ capacity = 10, normalizeKey = u.identity }: FIFOCacheOptions<K> = {}) {
    this._map = new Map()
    this._capacity = capacity
    this._normalizeKey = normalizeKey
  }

  get(key: K): V | undefined {
    return this._map.get(this._normalizeKey(key))
  }

  set(key: K, value: V): void {
    if (this._map.size === this._capacity) {
      let oldestKey = this._map.keys().next().value
      this._map.delete(oldestKey)
    }

    this._map.set(this._normalizeKey(key), value)
  }

  clear(): void {
    this._map.clear()
  }

}
