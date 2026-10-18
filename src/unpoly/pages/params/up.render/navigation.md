@partial up.render/navigation

@param {boolean} [options.navigate=false]
  Whether this fragment update is considered [navigation](/learn/navigation-defaults).

  Setting this to `true` will enable many side effects,
  like [updating history](/learn/updating-history) or [scrolling](/learn/scrolling).

  Setting this to `false` will disable most defaults, allowing you to
  opt into individual side effects using the options below.
