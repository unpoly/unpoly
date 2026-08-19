// Every port the dev environment listens on, in one place.
//
// They are fixed numbers because the guides name them — `localhost:4001` appears throughout
// docs/contributing, and trying-out-changes.md tells agents to point a browser at it. Deriving
// them from the checkout path would need no configuration but would make every one of those
// references read "whatever port it printed", which is worse for a human and much worse for an
// agent following a guide.
//
// So a second checkout opts in instead: PORT_OFFSET=100 moves all of them together, and the
// checkout that sets nothing keeps the documented numbers. Everything else the environment
// owns is already per-checkout — tmp/dev.pid and tmp/build-status.json are anchored to the
// project root — so ports were the only thing two clones fought over.

const BASE = {
  specServer: 4000,
  scratch: 4001,
  // Held only while a start is in progress. Offsetting it is deliberate: two checkouts run
  // independent environments and have no reason to serialise against each other, which the
  // one shared number used to make them do.
  startLock: 4099,
  docs: 4567,
}

export function portsFor(env = process.env) {
  const raw = env.PORT_OFFSET
  if (raw === undefined || raw === '') return { ...BASE, offset: 0 }

  const offset = Number(raw)
  // Without this, a typo silently produces NaN ports and every listen fails with something
  // that does not mention PORT_OFFSET.
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error(`PORT_OFFSET must be a non-negative integer, got ${JSON.stringify(raw)}.`)
  }

  return {
    specServer: BASE.specServer + offset,
    scratch: BASE.scratch + offset,
    startLock: BASE.startLock + offset,
    docs: BASE.docs + offset,
    offset,
  }
}

export const PORTS = portsFor()
