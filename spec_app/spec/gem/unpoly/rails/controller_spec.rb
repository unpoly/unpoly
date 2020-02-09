describe Unpoly::Rails::Controller, type: :request do

  class BindingTestController < ActionController::Base

    class_attribute :next_eval_proc

    def eval
      expression = self.class.next_eval_proc or raise "No eval expression given"
      self.eval_result = nil
      self.class.next_eval_proc = nil
      self.eval_result = instance_exec(&expression)
      render nothing: true
    end

    attr_accessor :eval_result

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

  end

  Rails.application.routes.draw do
    get '/binding_test/:action', controller: 'binding_test'
    put '/binding_test/:action', controller: 'binding_test'
  end

  def controller_eval(expression, headers: {})
    BindingTestController.next_eval_proc = expression
    get '/binding_test/eval', {}, headers
    controller.eval_result
  end

  describe 'up?' do

    it 'returns true if the request has an X-Up-Target header' do
      expression = -> { up? }
      result = controller_eval(expression, headers: { 'X-Up-Target' => 'body' })
      expect(result).to eq(true)
    end

    it 'returns false if the request has no X-Up-Target header' do
      expression = -> { up? }
      result = controller_eval(expression)
      expect(result).to eq(false)
    end

  end

  describe 'up' do

    shared_examples_for 'string field' do |reader:, header:|
      it "returns the value of the #{header} request header" do
        result = controller_eval(reader, headers: { header => 'header value' })
        expect(result).to eq('header value')
      end

      it "returns nil if no #{header} request header is set" do
        result = controller_eval(reader)
        expect(result).to be_nil
      end
    end

    shared_examples_for 'hash field' do |reader:, header:|
      it "returns value of the #{header} request header, parsed as JSON" do
        result = controller_eval(reader, headers: { header => '{ "foo": "bar" }'})
        expect(result).to be_a(Hash)
        expect(result['foo']).to eq('bar')
      end

      it "allows to access the hash with symbol keys instead of string keys" do
        result = controller_eval(reader, headers: { header => '{ "foo": "bar" }'})
        expect(result[:foo]).to eq('bar')
      end

      it "returns an empty hash if no #{header} request header is set" do
        result = controller_eval(reader)
        expect(result).to eq({})
      end
    end

    describe '#target' do

      it_behaves_like 'string field',
        header: 'X-Up-Target',
        reader: -> { up.target }

    end

    describe '#fail_target' do

      it_behaves_like 'string field',
        header: 'X-Up-Fail-Target',
        reader: -> { up.fail_target }

    end

    shared_examples_for 'target query' do |header:, reader:|

      define_method :target_headers do |target|
        headers = { header => target}
        if header != 'X-Up-Target'
          # Make sure that it's considered a fragment update
          headers['X-Up-Target'] = '.other-selector'
        end
        headers
      end

      it 'returns true if the tested CSS selector is requested via Unpoly' do
        test = -> { instance_exec('.foo', &reader) }
        result = controller_eval(test, headers: target_headers('.foo'))
        expect(result).to eq(true)
      end

      it 'returns false if Unpoly is requesting another CSS selector' do
        test = -> { instance_exec('.foo', &reader) }
        result = controller_eval(test, headers: target_headers('.bar'))
        expect(result).to eq(false)
      end

      it 'returns true if the request is not an Unpoly request' do
        test = -> { instance_exec('.foo', &reader) }
        result = controller_eval(test)
        expect(result).to eq(true)
      end

      it 'returns true if testing a custom selector, and Unpoly requests "body"' do
        test = -> { instance_exec('foo', &reader) }
        result = controller_eval(test, headers: target_headers('body'))
        expect(result).to eq(true)
      end

      it 'returns true if testing a custom selector, and Unpoly requests "html"' do
        test = -> { instance_exec('foo', &reader) }
        result = controller_eval(test, headers: target_headers('html'))
        expect(result).to eq(true)
      end

      it 'returns true if testing "body", and Unpoly requests "html"' do
        test = -> { instance_exec('body', &reader) }
        result = controller_eval(test, headers: target_headers('html'))
        expect(result).to eq(true)
      end

      it 'returns true if testing "head", and Unpoly requests "html"' do
        test = -> { instance_exec('header', &reader) }
        result = controller_eval(test, headers: target_headers('html'))
        expect(result).to eq(true)
      end

      it 'returns false if the tested CSS selector is "head" but Unpoly requests "body"' do
        test = -> { instance_exec('head', &reader) }
        result = controller_eval(test, headers: target_headers('body'))
        expect(result).to eq(false)
      end 

      it 'returns false if the tested CSS selector is "title" but Unpoly requests "body"' do
        test = -> { instance_exec('title', &reader) }
        result = controller_eval(test, headers: target_headers('body'))
        expect(result).to eq(false)
      end

      it 'returns false if the tested CSS selector is "meta" but Unpoly requests "body"' do
        test = -> { instance_exec('meta', &reader) }
        result = controller_eval(test, headers: target_headers('body'))
        expect(result).to eq(false)
      end

      it 'returns true if the tested CSS selector is "head", and Unpoly requests "html"' do
        test = -> { instance_exec('head', &reader) }
        result = controller_eval(test, headers: target_headers('html'))
        expect(result).to eq(true)
      end

      it 'returns true if the tested CSS selector is "title", Unpoly requests "html"' do
        test = -> { instance_exec('title', &reader) }
        result = controller_eval(test, headers: target_headers('html'))
        expect(result).to eq(true)
      end

      it 'returns true if the tested CSS selector is "meta", and Unpoly requests "html"' do
        test = -> { instance_exec('meta', &reader) }
        result = controller_eval(test, headers: target_headers('html'))
        expect(result).to eq(true)
      end

    end

    describe 'up.target?' do
      it_behaves_like 'target query',
        header: 'X-Up-Target',
        reader: -> (selector) { up.target?(selector) }
    end

    describe 'up.fail_target?' do
      it_behaves_like 'target query',
        header: 'X-Up-Fail-Target',
        reader: -> (selector) { up.fail_target?(selector) }
    end

    describe 'up.any_target?' do

      let :headers do
        { 'X-Up-Target' => '.success',
          'X-Up-Fail-Target' => '.failure' }
      end

      it 'returns true if the tested CSS selector is the target for a successful response' do
        test = -> { up.any_target?('.success') }
        result = controller_eval(test, headers: headers)
        expect(result).to be(true)
      end

      it 'returns true if the tested CSS selector is the target for a failed response' do
        test = -> { up.any_target?('.failure') }
        result = controller_eval(test, headers: headers)
        expect(result).to eq(true)
      end

      it 'returns false if the tested CSS selector is a target for neither successful nor failed response' do
        test = -> { up.any_target?('.other') }
        result = controller_eval(test, headers: headers)
        expect(result).to eq(false)
      end

    end

    describe 'up.validate?' do

      it 'returns true the request is an Unpoly validation call' do
        test = -> { up.validate? }
        result = controller_eval(test, headers: { 'X-Up-Validate' => 'user[email]' })
        expect(result).to eq(true)
      end

      it 'returns false if the request is not an Unpoly validation call' do
        test = -> { up.validate? }
        result = controller_eval(test)
        expect(result).to eq(false)
      end

    end

    describe 'up.validate' do

      it_behaves_like 'string field',
        header: 'X-Up-Validate',
        reader: -> { up.validate }

    end
    
    describe 'up.mode' do

      it_behaves_like 'string field',
        header: 'X-Up-Mode',
        reader: -> { up.mode }
      
    end
    
    describe 'up.fail_mode' do
      
      it_behaves_like 'string field',
        header: 'X-Up-Fail-Mode',
        reader: -> { up.fail_mode }
      
    end
    
    describe 'up.context' do
      
      it_behaves_like 'hash field',
        header: 'X-Up-Context',
        reader: -> { up.context }
      
    end
    
    describe 'up.fail_context' do
      
      subject { controller.up.fail_context }
      
      it_behaves_like 'hash field',
        header: 'X-Up-Fail-Context',
        reader: -> { up.fail_context }
      
    end

    describe 'up.title=' do

      it 'sets an X-Up-Title header to push a document title to the client' do
        setter = -> { up.title = 'Title from controller' }
        controller_eval(setter)
        expect(response.headers['X-Up-Title']).to eq('Title from controller')
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

