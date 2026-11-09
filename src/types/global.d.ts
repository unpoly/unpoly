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

// ERB templates are rendered by the build's erb plugin. The only one inserts the version number.
// We spell out its type: an untyped module would make the whole `Up` type `any`.
declare module '*/namespace.js.erb' {
  export const api: { version: string }
}
