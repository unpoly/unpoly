#= require ./close_layer

class up.Change.AcceptLayer extends up.Change.CloseLayer

  valueAttr: 'up-accept'
  closeEvent: 'up:layer:accept'
  closedEvent: 'up:layer:accepted'
  closedCallback: 'onAccepted'
