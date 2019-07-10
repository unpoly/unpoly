#= require ./close_layer

class up.Change.AcceptLayer extends up.Change.CloseLayer

  valueAttr: 'up-accept'

  closeEventName: 'up:layer:accept'
  closeCallbackName: 'onAccept'

  closingEventName: 'up:layer:accepting'
  closingCallbackName: 'onAccepting'

  closedEventName: 'up:layer:accepted'
  closedCallbackName: 'onAccepted'
