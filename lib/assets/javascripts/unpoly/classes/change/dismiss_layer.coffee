#= require ./close_layer

class up.Change.DismissLayer extends up.Change.CloseLayer

  valueAttr: 'up-dismiss'

  closeEventName: 'up:layer:dismiss'
  closeCallbackName: 'onDismiss'

  closingEventName: 'up:layer:dismissing'
  closingCallbackName: 'onDismissing'

  closedEventName: 'up:layer:dismissed'
  closedCallbackName: 'onDismissed'
