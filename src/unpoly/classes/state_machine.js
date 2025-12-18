up.StateMachine = class StateMachine {
  constructor(transitions) {
    this.transition = transitions
    this.state = Object.keys(transitions)[0]
  }

  to(newState) {
    let allowedTargets = this.transition[this.state]
    if (allowedTargets.includes(newState)) {
      this.state = newState
    } else {
      throw new up.Error(`Cannot transition from ${this.state} to ${newState}`)
    }
  }

  is(queryState) {
    return this.state === this.queryState
  }
}