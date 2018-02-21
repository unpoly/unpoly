u = up.util

class up.WaypointCache



#  MAX_SIZE = 70
#
#  constructor: =>
#    @reset()
#
#  reset: =>
#    @waypoints = []
#    @cursorIndex = 0
#
#  add: (name) =>
#    throw "soll aktuellen waypoint erweitern"
#    waypoint = new up.Waypoint(name: name, index: @cursorIndex)
#    waypoint.update()
#    @waypoints[@cursorIndex] = waypoint
#    @clean()
#
#  clean: =>
#    # We cannot just shift elements from the beginning the array,
#    # since that index is referenced in history states.
#    while @cursorIndex - @firstIndex > MAX_SIZE
#      delete @waypoints[@firstIndex]
#      @firstIndex++
#
#  upsert: (name, index) =>
#
#
#
#  beforeDomChange: =>
#
#  beforeBackClick: =>
#
#  beforeHistoryPush: =>
#
#  afterHistoryPop: =>
#    @cursorIndex--

###
  es wird updates geben mir [up-waypoint]
  es wird updates geben ohne [up-waypoint]

  ich kann nur waypoints für updates mit history-URLs machen, da ich nur so restoren kann

  evtl. so:

  - ich komme einmal dran bevor ich den DOM verändere
    => update current if still visible

  - bevor jemand auf [up-back] klickt
    => update current if still visible

  - ich komme einmal dran beim history pushen
    => create, am liebsten mit name wenn ein [up-waypoint] im DOM ist
       => kann auch mehrere createn wenn [up-waypoint] mehrere namen hat
    => falls cache-cursor nicht am ende ist, neuere einträge clearen
    => assoziiere history state mit waypoint (by index for soft map)

  - bei history.pop()
    => assoziierten waypoint wiederherstellen
    => cursor im cache zurückstellen, so dass der nächste push() neuere einträge löscht
###

###
  cache begrenzen:
  - ich will nur 2 states eines namens behalten
  - ich will nur die neuesten behalten
###