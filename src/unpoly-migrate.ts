// TypeScript only knows require() from @types/node, which we don't load. We keep require() because
// the files below are scripts that patch window.up and must run between startExtension() and
// stopExtension(). Imports would be hoisted above startExtension().
declare const require: (path: string) => void

// We are going to add compilers and event handlers that should not be reset during specs.
up.internal.startExtension()
require('./unpoly-migrate/migrate')
require('./unpoly-migrate/util/config')
require('./unpoly-migrate/fragment/render/render_job')
require('./unpoly-migrate/fragment/render/render_result')
require('./unpoly-migrate/layer/base')
require('./unpoly-migrate/util')
require('./unpoly-migrate/error')
require('./unpoly-migrate/browser')
require('./unpoly-migrate/element')
require('./unpoly-migrate/event')
require('./unpoly-migrate/script')
require('./unpoly-migrate/form')
require('./unpoly-migrate/fragment')
require('./unpoly-migrate/framework')
require('./unpoly-migrate/history')
require('./unpoly-migrate/status')
require('./unpoly-migrate/link')
require('./unpoly-migrate/layer')
require('./unpoly-migrate/motion')
require('./unpoly-migrate/modal')
require('./unpoly-migrate/popup')
require('./unpoly-migrate/tooltip')
require('./unpoly-migrate/protocol')
require('./unpoly-migrate/network')
require('./unpoly-migrate/radio')
require('./unpoly-migrate/viewport')
up.internal.stopExtension()
