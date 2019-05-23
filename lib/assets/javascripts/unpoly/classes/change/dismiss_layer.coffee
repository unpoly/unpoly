#= require ./close_layer

class up.Change.DismissLayer extends up.Change.CloseLayer

  valueAttr: 'up-dismiss'
  closeEvent: 'up:layer:dismiss'
  closedEvent: 'up:layer:dismissed'
  closedCallback: 'onDismissed'
