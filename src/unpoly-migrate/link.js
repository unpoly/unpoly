/*-
@module up.link
*/

up.migrate.parseFollowOptions = function(parser) {
  parser.string('flavor'); // Renamed to { mode }.
  parser.string('width'); // Removed overlay option.
  parser.string('height'); // Removed overlay option.
  parser.boolean('closable'); // Renamed to { dismissable }.
  parser.booleanOrString('solo'); // Renamed to { abort }, which can be a boolean or string. Old { solo } could be a boolean, a string (URL pattern). Programmatic { solo } could also be a function.
  parser.booleanOrString('reveal'); // legacy option for { scroll: 'target' }
  parser.boolean('resetScroll'); // legacy option for { scroll: 'top' }
  parser.boolean('restoreScroll'); // legacy option for { scroll: 'restore' }
  parser.booleanOrString('historyVisible'); // short-lived legacy option for { history }
  parser.booleanOrString('clearCache'); // legacy option for { expireCache }
}

/*-
[Follows](/up.follow) this link as fast as possible.

This is done by:

- [Following the link through AJAX](/a-up-follow) instead of a full page load
- [Preloading the link's destination URL](/a-up-preload)
- [Triggering the link on `mousedown`](/a-up-instant) instead of on `click`

### Example

Use `[up-dash]` like this:

    <a href="/users" up-dash=".main">User list</a>

This is shorthand for:

    <a href="/users" up-target=".main" up-instant up-preload>User list</a>

@selector a[up-dash]
@param [up-dash='body']
  The CSS selector to replace

  Inside the CSS selector you may refer to this link as `:origin`.
@deprecated
  To accelerate all links use `up.link.config.instantSelectors` and `up.link.config.preloadSelectors`.
*/
up.migrate.targetMacro('up-dash', { 'up-preload': '', 'up-instant': '' }, () => up.migrate.deprecated('a[up-dash]', 'up.link.config.instantSelectors and up.link.config.preloadSelectors'))

up.migrate.renamedAttribute('up-delay', 'up-preload-delay', { scope: up.link.preloadSelector })
