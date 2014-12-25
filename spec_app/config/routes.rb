Rails.application.routes.draw do

  resources :cards
  root to: 'pages#home'

end
