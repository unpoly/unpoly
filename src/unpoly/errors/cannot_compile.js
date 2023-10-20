up.CannotCompile = class CannotCompile extends up.Error {
  constructor(props) {
    super('Error in compiler', props)
  }
}
