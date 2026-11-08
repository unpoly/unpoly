// Ambient declarations for type checking (bin/typecheck). The build never reads this file.

// Unpoly's own modules import each other and don't need the global `up`. A few places still reach
// it at call time (e.g. `up.migrate.*`, which only exists when unpoly-migrate.js is loaded), so we
// declare it as `any`.
declare var up: any

// Globals we use only when the page has them: jQuery for interop, Jasmine in up.mockable().
declare var jQuery: any
declare var spyOn: any
interface Window {
  jQuery?: any
  jasmine?: any
  // The rails-ujs gem
  Rails?: any
}

// Entry points require their stylesheets, which the build compiles with Sass.
declare module '*.sass'

// ERB templates (like the one that inserts the version number) are rendered by the build's erb plugin.
declare module '*.erb'
