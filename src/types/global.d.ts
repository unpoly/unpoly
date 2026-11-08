// Ambient declarations for type checking (bin/typecheck). The build never reads this file.
/* eslint-disable no-var, @typescript-eslint/no-explicit-any -- ambient globals need `var`, and these are untyped on purpose */

// Each namespace file assigns its namespace to the global `up` (`up.util = ...`).
// TypeScript 7 doesn't infer members of a global from assignments in other files,
// so we declare `up` as `any` until namespaces become ES modules.
declare var up: any

// Globals we use only when the page has them: jQuery for interop, Jasmine in up.mockable().
declare var jQuery: any
declare var spyOn: any

// Entry points require their stylesheets, which webpack handles.
declare module '*.sass'

// ERB templates (like the one that inserts the version number) are rendered by webpack's erb loader.
declare module '*.erb'
