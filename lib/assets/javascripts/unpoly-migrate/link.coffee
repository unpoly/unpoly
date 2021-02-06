up.migrate.parseFollowOptions = (parser) ->
  parser.string('flavor') # Renamed to { mode }.
  parser.string('width') # Removed overlay option.
  parser.string('height') # Removed overlay option.
  parser.boolean('closable') # Renamed to { dismissable }.
  parser.booleanOrString('reveal') # legacy option for { scroll: 'target' }
  parser.boolean('resetScroll') # legacy option for { scroll: 'top' }
  parser.boolean('restoreScroll') # legacy option for { scroll: 'restore' }
