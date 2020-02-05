describe Unpoly::Rails::Controller, type: :request do

  class BindingTestController < ActionController::Base

    def is_up
      render plain: up?.to_s
    end

    def up_target
      render plain: up.target
    end

    def up_fail_target
      render plain: up.fail_target
    end

    def up_is_target
      render plain: up.target?(tested_target).to_s
    end

    def up_is_fail_target
      render plain: up.fail_target?(tested_target).to_s
    end

    def up_is_any_target
      render plain: up.any_target?(tested_target).to_s
    end

    def is_up_validate
      render plain: up.validate?.to_s
    end

    def up_validate_name
      render plain: up.validate
    end

    def set_up_title
      up.title = 'Pushed document title'
      render plain: 'text'
    end

    def text
      render plain: 'text from controller'
    end

    def redirect0
      redirect_to action: :redirect1
    end

    def redirect1
      redirect_to action: :redirect2
    end

    def redirect2
      render plain: up.target
    end

    private

    def tested_target
      tested_target = params[:tested_target].presence
      tested_target or raise "No target given"
    end

  end

  Rails.application.routes.draw do
    get '/binding_test/:action', controller: 'binding_test'
    put '/binding_test/:action', controller: 'binding_test'
  end

  describe 'up?' do

    it 'returns true if the request has an X-Up-Target header' do
      get '/binding_test/is_up', nil, { 'X-Up-Target' => 'body' }
      expect(response.body).to eq('true')
    end

    it 'returns false if the request has no X-Up-Target header' do
      get '/binding_test/is_up'
      expect(response.body).to eq('false')
    end

  end

  describe 'up' do

    describe '#target' do

      it 'returns the CSS selector that Unpoly requested for a sucessful response' do
        get '/binding_test/up_target', nil, { 'X-Up-Target' => '.foo' }
        expect(response.body).to eq('.foo')
      end

    end

    describe '#fail_target' do

      it 'returns the CSS selector that Unpoly requested for an error response' do
        get '/binding_test/up_fail_target', nil, { 'X-Up-Target' => '.foo', 'X-Up-Fail-Target' => '.bar' }
        expect(response.body).to eq('.bar')
      end

    end

    shared_examples_for 'target query' do |opts|

      let(:header) { opts.fetch(:header) }

      let (:action) { opts.fetch(:action)}

      def target_headers(target)
        headers = { header => target}
        if header != 'X-Up-Target'
          # Make sure that it's considered a fragment update
          headers['X-Up-Target'] = '.other-selector'
        end
        headers
      end

      it 'returns true if the tested CSS selector is requested via Unpoly' do
        get "/binding_test/#{action}", { tested_target: '.foo' }, target_headers('.foo')
        expect(response.body).to eq('true')
      end

      it 'returns false if Unpoly is requesting another CSS selector' do
        get "/binding_test/#{action}", { tested_target: '.foo' }, target_headers('.bar')
        expect(response.body).to eq('false')
      end

      it 'returns true if the request is not an Unpoly request' do
        get "/binding_test/#{action}", { tested_target: '.foo' }
        expect(response.body).to eq('true')
      end

      it 'returns true if testing a custom selector, and Unpoly requests "body"' do
        get "/binding_test/#{action}", { tested_target: '.foo' }, target_headers('body')
        expect(response.body).to eq('true')
      end

      it 'returns true if testing a custom selector, and Unpoly requests "html"' do
        get "/binding_test/#{action}", { tested_target: '.foo' }, target_headers('html')
        expect(response.body).to eq('true')
      end

      it 'returns true if testing "body", and Unpoly requests "html"' do
        get "/binding_test/#{action}", { tested_target: 'body' }, target_headers('html')
        expect(response.body).to eq('true')
      end

      it 'returns true if testing "head", and Unpoly requests "html"' do
        get "/binding_test/#{action}", { tested_target: 'head' }, target_headers('html')
        expect(response.body).to eq('true')
      end

      it 'returns false if the tested CSS selector is "head" but Unpoly requests "body"' do
        get "/binding_test/#{action}", { tested_target: 'head' }, target_headers('body')
        expect(response.body).to eq('false')
      end 

      it 'returns false if the tested CSS selector is "title" but Unpoly requests "body"' do
        get "/binding_test/#{action}", { tested_target: 'title' }, target_headers('body')
        expect(response.body).to eq('false')
      end

      it 'returns false if the tested CSS selector is "meta" but Unpoly requests "body"' do
        get "/binding_test/#{action}", { tested_target: 'meta' }, target_headers('body')
        expect(response.body).to eq('false')
      end

      it 'returns true if the tested CSS selector is "head", and Unpoly requests "html"' do
        get "/binding_test/#{action}", { tested_target: 'head' }, target_headers('html')
        expect(response.body).to eq('true')
      end

      it 'returns true if the tested CSS selector is "title", Unpoly requests "html"' do
        get "/binding_test/#{action}", { tested_target: 'title' }, target_headers('html')
        expect(response.body).to eq('true')
      end

      it 'returns true if the tested CSS selector is "meta", and Unpoly requests "html"' do
        get "/binding_test/#{action}", { tested_target: 'meta' }, target_headers('html')
        expect(response.body).to eq('true')
      end

    end

    describe 'up.target?' do
      it_behaves_like 'target query', action: :up_is_target, header: 'X-Up-Target'
    end

    describe 'up.fail_target?' do
      it_behaves_like 'target query', action: :up_is_fail_target, header: 'X-Up-Fail-Target'
    end

    describe 'up.any_target?' do

      let :headers do
        { 'X-Up-Target' => '.success',
          'X-Up-Fail-Target' => '.failure' }
      end

      it 'returns true if the tested CSS selector is the target for a successful response' do
        get '/binding_test/up_is_any_target', { tested_target: '.success' }, headers
        expect(response.body).to eq('true')
      end

      it 'returns true if the tested CSS selector is the target for a failed response' do
        get '/binding_test/up_is_any_target', { tested_target: '.failure' }, headers
        expect(response.body).to eq('true')
      end

      it 'returns false if the tested CSS selector is a target for neither successful nor failed response' do
        get '/binding_test/up_is_any_target', { tested_target: '.other' }, headers
        expect(response.body).to eq('false')
      end

    end

    describe 'up.validate?' do

      it 'returns true the request is an Unpoly validation call' do
        get '/binding_test/is_up_validate', nil, 'X-Up-Validate' => 'user[email]'
        expect(response.body).to eq('true')
      end

      it 'returns false if the request is not an Unpoly validation call' do
        get '/binding_test/is_up_validate'
        expect(response.body).to eq('false')
      end

    end

    describe 'up.validate' do

      it 'returns the name of the field that is being validated' do
        get '/binding_test/up_validate_name', nil, 'X-Up-Validate' => 'user[email]'
        expect(response.body).to eq('user[email]')
      end

    end

    describe 'up.title=' do

      it 'sets an X-Up-Title header to push a document title to the client' do
        get '/binding_test/set_up_title'
        expect(response.headers['X-Up-Title']).to eq('Pushed document title')
      end

    end

  end

  describe 'redirect_to' do

    it 'preserves Unpoly-related headers for the redirect' do
      get '/binding_test/redirect1', nil, { 'X-Up-Target' => '.foo' }
      expect(response).to be_redirect
      follow_redirect!
      expect(response.body).to eq('.foo')
    end

    it 'preserves Unpoly-releated headers over multiple redirects' do
      get '/binding_test/redirect0', nil, { 'X-Up-Target' => '.foo' }
      expect(response).to be_redirect
      follow_redirect!
      expect(response).to be_redirect
      follow_redirect!
      expect(response.body).to eq('.foo')
    end

    it 'does not change the history' do
      get '/binding_test/redirect1', nil, { 'X-Up-Target' => '.foo' }
      expect(response).to be_redirect
      follow_redirect!
      expect(response.headers['X-Up-Location']).to end_with('/redirect2')
    end

  end

  describe 'echoing of the request location' do

    it 'echoes the current path in an X-Up-Location response header' do
      get '/binding_test/text'
      expect(response.headers['X-Up-Location']).to end_with('/binding_test/text')
    end

    it 'echoes the current path after a redirect' do
      get '/binding_test/redirect1'
      expect(response).to be_redirect
      follow_redirect!
      expect(response.headers['X-Up-Location']).to end_with('/binding_test/redirect2')
    end

    it 'echoes the current path with query params' do
      get '/binding_test/text?foo=bar'
      expect(response.headers['X-Up-Location']).to end_with('/binding_test/text?foo=bar')
    end

  end

  describe 'echoing of the request method' do

    it 'echoes the current request method in an X-Up-Method response header' do
      get '/binding_test/text'
      expect(response.headers['X-Up-Method']).to eq('GET')
    end

    it 'echoes the current path after a redirect' do
      put '/binding_test/redirect1'
      expect(response).to be_redirect
      follow_redirect!
      expect(response.headers['X-Up-Method']).to eq('GET')
    end

    it 'echoes a non-GET request method' do
      put '/binding_test/text'
      expect(response.headers['X-Up-Method']).to eq('PUT')
    end

  end

  describe 'request method cookie' do

    describe 'if the request is both non-GET and not a fragment update' do

      it 'echoes the request method in an _up_method cookie ' do
        put '/binding_test/text'
        expect(cookies['_up_method']).to eq('PUT')
      end

    end

    describe 'if the request is not a fragment update, but GET' do

      it 'does not set the cookie' do
        get '/binding_test/text'
        expect(cookies['_up_method']).to be_blank
      end

      it 'deletes an existing cookie' do
        cookies['_up_method'] = 'PUT'
        get '/binding_test/text'
        expect(cookies['_up_method']).to be_blank
      end

    end

    describe 'if the request is non-GET but a fragment update' do

      it 'does not set the cookie' do
        get '/binding_test/text', nil, { 'X-Up-Target' => '.target '}
        expect(cookies['_up_method']).to be_blank
      end

      it 'deletes an existing cookie' do
        cookies['_up_method'] = 'PUT'
        get '/binding_test/text', nil, { 'X-Up-Target' => '.target' }
        expect(cookies['_up_method']).to be_blank
      end

    end

  end

end

#
#
#
#   describe 'up?' do
#
#     controller do
#       def index
#         render text: up?.to_s
#       end
#     end
#
#     it 'returns true if the request has an X-Up-Target header' do
#       request.headers['X-Up-Target'] = 'body'
#       get :index
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns false if the request has no X-Up-Target header' do
#       get :index
#       expect(response.body).to eq('false')
#     end
#
#   end
#
#   describe 'up.target' do
#
#     controller do
#       def index
#         render text: up.target
#       end
#     end
#
#     it 'returns the CSS selector that Unpoly requested for a sucessful response' do
#       request.headers['X-Up-Target'] = '.foo'
#       get :index
#       expect(response.body).to eq('.foo')
#     end
#
#   end
#
#   describe 'up.fail_target' do
#
#     controller do
#       def index
#         render text: up.fail_target
#       end
#     end
#
#     it 'returns the CSS selector that Unpoly requested for an error response' do
#       request.headers['X-Up-Target'] = '.foo'
#       request.headers['X-Up-Fail-Target'] = '.bar'
#       get :index
#       expect(response.body).to eq('.bar')
#     end
#
#   end
#
#   shared_examples_for 'target query' do |opts|
#
#     let(:header) { opts.fetch(:header) }
#
#     let(:test_method) { opts.fetch(:method)}
#
#     controller do
#       define_method :index do
#         is_target = up.send(opts.fetch(:test_method), tested_target)
#         render text: is_target
#       end
#
#       private
#
#       def tested_target
#         params[:tested_target].presence or raise "No target given"
#       end
#     end
#
#     def set_header(value)
#       request.headers[header] = value
#       if header != 'X-Up-Target'
#         # Make sure that it's considered a fragment update
#         request.headers['X-Up-Target'] = '.other-selector'
#       end
#     end
#
#     it 'returns true if the tested CSS selector is requested via Unpoly' do
#       set_header '.foo'
#       get :index, tested_target: '.foo'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns false if Unpoly is requesting another CSS selector' do
#       set_header '.bar'
#       get :index, tested_target: '.foo'
#       expect(response.body).to eq('false')
#     end
#
#     it 'returns true if the request is not an Unpoly request' do
#       get :index, tested_target: '.foo'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns true if testing a custom selector, and Unpoly requests "body"' do
#       set_header 'body'
#       get :index, tested_target: '.foo'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns true if testing a custom selector, and Unpoly requests "html"' do
#       set_header 'html'
#       get :index, tested_target: '.foo'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns true if testing "body", and Unpoly requests "html"' do
#       set_header 'html'
#       get :index, tested_target: 'body'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns true if testing "head", and Unpoly requests "html"' do
#       set_header 'html'
#       get :index, tested_target: 'head'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns false if the tested CSS selector is "head" but Unpoly requests "body"' do
#       set_header 'body'
#       get :index, tested_target: 'head'
#       expect(response.body).to eq('false')
#     end
#
#     it 'returns false if the tested CSS selector is "title" but Unpoly requests "body"' do
#       set_header 'body'
#       get :index, tested_target: 'title'
#       expect(response.body).to eq('false')
#     end
#
#     it 'returns false if the tested CSS selector is "meta" but Unpoly requests "body"' do
#       set_header 'body'
#       get :index, tested_target: 'meta'
#       expect(response.body).to eq('false')
#     end
#
#     it 'returns true if the tested CSS selector is "head", and Unpoly requests "html"' do
#       set_header 'html'
#       get :index, tested_target: 'head'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns true if the tested CSS selector is "title", Unpoly requests "html"' do
#       set_header 'html'
#       get :index, tested_target: 'title'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns true if the tested CSS selector is "meta", and Unpoly requests "html"' do
#       set_header 'html'
#       get :index, tested_target: 'meta'
#       expect(response.body).to eq('true')
#     end
#
#   end
#
#   describe 'up.target?' do
#     it_behaves_like 'target query', test_method: :target?, header: 'X-Up-Target'
#   end
#
#   describe 'up.fail_target?' do
#     it_behaves_like 'target query', test_method: :fail_target?, header: 'X-Up-Fail-Target'
#   end
#
#   describe '#any_target?' do
#
#     before :each do
#       request.headers['X-Up-Target'] = '.success'
#       request.headers['X-Up-Fail-Target'] = '.failure'
#     end
#
#     controller do
#       def index
#         render text: up.any_target?(tested_target)
#       end
#
#       private
#
#       def tested_target
#         params[:tested_target].presence or raise "No target given"
#       end
#
#     end
#
#     it 'returns true if the tested CSS selector is the target for a successful response' do
#       get :index, tested_target: '.success'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns true if the tested CSS selector is the target for a failed response' do
#       get :index, tested_target: '.failure'
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns false if the tested CSS selector is a target for neither successful nor failed response' do
#       get :index, tested_target: '.other'
#       expect(response.body).to eq('false')
#     end
#
#   end
#
#   describe 'up.validate?' do
#
#     controller do
#       def index
#         render text: up.validate?
#       end
#     end
#
#     it 'returns true the request is an Unpoly validation call' do
#       request.headers['X-Up-Validate'] = 'user[email]'
#       get :index
#       expect(response.body).to eq('true')
#     end
#
#     it 'returns false if the request is not an Unpoly validation call' do
#       get :index
#       expect(response.body).to eq('false')
#     end
#
#   end
#
#   describe 'up.validate' do
#
#     controller do
#       def index
#         render text: up.validate
#       end
#     end
#
#     it 'returns the name of the field that is being validated' do
#       request.headers['X-Up-Validate'] = 'user[email]'
#       get :index
#       expect(response.body).to eq('user[email]')
#     end
#
#   end
#
#   describe 'up.title=' do
#
#     controller do
#       def index
#         up.title = 'Title from server'
#         render text: 'text'
#       end
#     end
#
#     it 'sets an X-Up-Title header to push a document title to the client' do
#       get :index
#       expect(response.headers['X-Up-Title']).to eq('Title from server')
#     end
#
#   end
#
#   describe 'up.redirect_to' do
#
#     controller do
#       def one
#         up.redirect_to '/two'
#       end
#
#       def two
#         render text: up.target
#       end
#     end
#
#     before :each do
#       routes.draw do
#         get 'one' => 'anonymous#one'
#         get 'two' => 'anonymous#two'
#       end
#     end
#
#     it 'preserves Unpoly-related headers for the redirect' do
#       request.headers['X-Up-Target'] = '.foo'
#       get :one
#       follow_redirect!
#       expect(response.body).to eq('.foo')
#     end
#
#     it 'does not change the history' do
#       request.headers['X-Up-Target'] = '.foo'
#       get :one
#       follow_redirect!
#       expect(response.headers['X-Up-Location']).to eq('/two')
#     end
#
#   end
#
#   describe 'request method cookie' do
#
#     controller do
#
#       def create
#         render text: 'text'
#       end
#
#       def index
#         render text: 'text'
#       end
#
#     end
#
#     describe 'if the request is both non-GET and not a fragment update' do
#
#       it 'echoes the request method in an _up_method cookie ' do
#         post :create
#         expect(response.cookies['_up_method']).to eq('POST')
#       end
#
#     end
#
#     describe 'if the request is not a fragment update, but GET' do
#
#       it 'does not set the cookie' do
#         get :index
#         expect(response.cookies['_up_method']).to be_nil
#       end
#
#       it 'deletes an existing cookie' do
#         request.cookies['_up_method'] = 'PUT'
#         get :index
#         expect(response.cookies['_up_method']).to be_nil
#       end
#
#     end
#
#     describe 'if the request is non-GET but a fragment update' do
#
#       it 'does not set the cookie' do
#         request.headers['X-Up-Target'] = '.target'
#         post :create
#         expect(response.cookies['_up_method']).to be_nil
#       end
#
#       it 'deletes an existing cookie' do
#         request.cookies['_up_method'] = 'PUT'
#         request.headers['X-Up-Target'] = '.target'
#         post :create
#         expect(response.cookies['_up_method']).to be_nil
#       end
#
#     end
#
#   end
#
# end
