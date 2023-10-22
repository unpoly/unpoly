jasmine.expectGlobalError = async function(...args) {
  let fn = args.pop()
  let anyErrorArgs = args

  await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
    await fn(globalErrorSpy)
    expect(globalErrorSpy).toHaveBeenCalledWith(jasmine.anyError(...anyErrorArgs))
  })
}
