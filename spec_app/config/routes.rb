Rails.application.routes.draw do

  mount JasmineRails::Engine => '/specs' if defined?(JasmineRails)
  root to: redirect('/specs')

  get 'test/:action', controller: 'test'

end
