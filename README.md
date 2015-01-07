# Up + Rails bindings (WIP)

Up.js is a solution for Rails apps that need fast-responding UI
but don't want to pay the Javascript MVC complexity tax.

## Design manifesto

### Client-side code is a complexity driver

### Server-side code should stay the same
- We like the simplicity of classic Rails development
- It should not require extra controller actions to update a page part via AJAX

### Batteries included
- We will ship a basic implementation for the most established UI patterns like navigation bars, infinite scrolling, drop-down menus, modals
- We will split this out into a plugin architecture eventually, but not now

### Ruby on Rails first
- We will leverage the assumptions that Rails is underneath
- Other frameworks once we’re happy with Rails

### Not for ambitious UIs
- We don’t want to compromise ease of use for simple patterns by providing a million hooks and options
- Limits in configurability
- You can always roll your own code
- Probably the wrong choice if you want to create something very ambitious

### (Sort of) Plays nice with existing JS code
- If you're ready to go into our event binding

### URLs are important
- Every page has an URL
- Works nice with Google
 Works with browsers that don’t speak Up.js (e. g. IE9 doesn’t speak pushState)

### Be small

### Few dependencies
- jQuery

### Convention over configuration

### Interface: Both UJS and programmatic




