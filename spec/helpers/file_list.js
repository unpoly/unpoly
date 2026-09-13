// A FileList cannot be constructed directly, but a DataTransfer will build one.
// Use it to give an <input type="file"> a value from a spec:
//
//     input.files = fileList(new File(['content'], 'file.txt', { type: 'text/plain' }))

window.fileList = function(...files) {
  const transfer = new DataTransfer()
  for (let file of files) transfer.items.add(file)
  return transfer.files
}
