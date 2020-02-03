describe ActionController::Base, type: :controller do

  describe 'up?' do

    controller do
      def index
        render text: up?.to_s
      end
    end

    it 'returns true if the request has an X-Up-Target header' do
      request.headers['X-Up-Target'] = 'body'
      get :index
      expect(response.body).to eq('true')
    end

    it 'returns false if the request has no X-Up-Target header' do
      get :index
      expect(response.body).to eq('false')
    end

  end

  describe 'up.target' do

    controller do
      def index
        render text: up.target
      end
    end

    it 'returns the CSS selector that Unpoly requested for a sucessful response' do
      request.headers['X-Up-Target'] = '.foo'
      get :index
      expect(response.body).to eq('.foo')
    end

  end

  describe 'up.fail_target' do

    controller do
      def index
        render text: up.fail_target
      end
    end

    it 'returns the CSS selector that Unpoly requested for an error response' do
      request.headers['X-Up-Target'] = '.foo'
      request.headers['X-Up-Fail-Target'] = '.bar'
      get :index
      expect(response.body).to eq('.bar')
    end

  end

  shared_examples_for 'target query' do |opts|

    let(:header) { opts.fetch(:header) }

    let(:test_method) { opts.fetch(:method)}
    
    controller do
      define_method :index do
        is_target = up.send(opts.fetch(:test_method), tested_target)
        render text: is_target
      end
      
      private

      def tested_target
        params[:tested_target].presence or raise "No target given"
      end
    end

    def set_header(value)
      request.headers[header] = value
      if header != 'X-Up-Target'
        # Make sure that it's considered a fragment update
        request.headers['X-Up-Target'] = '.other-selector'
      end
    end

    it 'returns true if the tested CSS selector is requested via Unpoly' do
      set_header '.foo'
      get :index, tested_target: '.foo'
      expect(response.body).to eq('true')
    end

    it 'returns false if Unpoly is requesting another CSS selector' do
      set_header '.bar'
      get :index, tested_target: '.foo'
      expect(response.body).to eq('false')
    end

    it 'returns true if the request is not an Unpoly request' do
      get :index, tested_target: '.foo'
      expect(response.body).to eq('true')
    end

    it 'returns true if testing a custom selector, and Unpoly requests "body"' do
      set_header 'body'
      get :index, tested_target: '.foo'
      expect(response.body).to eq('true')
    end

    it 'returns true if testing a custom selector, and Unpoly requests "html"' do
      set_header 'html'
      get :index, tested_target: '.foo'
      expect(response.body).to eq('true')
    end

    it 'returns true if testing "body", and Unpoly requests "html"' do
      set_header 'html'
      get :index, tested_target: 'body'
      expect(response.body).to eq('true')
    end

    it 'returns true if testing "head", and Unpoly requests "html"' do
      set_header 'html'
      get :index, tested_target: 'head'
      expect(response.body).to eq('true')
    end

    it 'returns false if the tested CSS selector is "head" but Unpoly requests "body"' do
      set_header 'body'
      get :index, tested_target: 'head'
      expect(response.body).to eq('false')
    end

    it 'returns false if the tested CSS selector is "title" but Unpoly requests "body"' do
      set_header 'body'
      get :index, tested_target: 'title'
      expect(response.body).to eq('false')
    end

    it 'returns false if the tested CSS selector is "meta" but Unpoly requests "body"' do
      set_header 'body'
      get :index, tested_target: 'meta'
      expect(response.body).to eq('false')
    end

    it 'returns true if the tested CSS selector is "head", and Unpoly requests "html"' do
      set_header 'html'
      get :index, tested_target: 'head'
      expect(response.body).to eq('true')
    end

    it 'returns true if the tested CSS selector is "title", Unpoly requests "html"' do
      set_header 'html'
      get :index, tested_target: 'title'
      expect(response.body).to eq('true')
    end

    it 'returns true if the tested CSS selector is "meta", and Unpoly requests "html"' do
      set_header 'html'
      get :index, tested_target: 'meta'
      expect(response.body).to eq('true')
    end

  end

  describe 'up.target?' do
    it_behaves_like 'target query', test_method: :target?, header: 'X-Up-Target'
  end

  describe 'up.fail_target?' do
    it_behaves_like 'target query', test_method: :fail_target?, header: 'X-Up-Fail-Target'
  end

  describe '#any_target?' do

    before :each do
      request.headers['X-Up-Target'] = '.success'
      request.headers['X-Up-Fail-Target'] = '.failure'
    end

    controller do
      def index
        render text: up.any_target?(tested_target)
      end

      private

      def tested_target
        params[:tested_target].presence or raise "No target given"
      end

    end

    it 'returns true if the tested CSS selector is the target for a successful response' do
      get :index, tested_target: '.success'
      expect(response.body).to eq('true')
    end

    it 'returns true if the tested CSS selector is the target for a failed response' do
      get :index, tested_target: '.failure'
      expect(response.body).to eq('true')
    end

    it 'returns false if the tested CSS selector is a target for neither successful nor failed response' do
      get :index, tested_target: '.other'
      expect(response.body).to eq('false')
    end

  end

  describe 'up.validate?' do

    controller do
      def index
        render text: up.validate?
      end
    end

    it 'returns true the request is an Unpoly validation call' do
      request.headers['X-Up-Validate'] = 'user[email]'
      get :index
      expect(response.body).to eq('true')
    end

    it 'returns false if the request is not an Unpoly validation call' do
      get :index
      expect(response.body).to eq('false')
    end

  end

  describe 'up.validate' do

    controller do
      def index
        render text: up.validate
      end
    end

    it 'returns the name of the field that is being validated' do
      request.headers['X-Up-Validate'] = 'user[email]'
      get :index
      expect(response.body).to eq('user[email]')
    end

  end

  describe 'up.title=' do

    controller do
      def index
        up.title = 'Title from server'
        render text: 'text'
      end
    end

    it 'sets an X-Up-Title header to push a document title to the client' do
      get :index
      expect(response.headers['X-Up-Title']).to eq('Title from server')
    end

  end

  describe 'request method cookie' do

    controller do

      def create
        render text: 'text'
      end

      def index
        render text: 'text'
      end

    end

    describe 'if the request is both non-GET and not a fragment update' do

      it 'echoes the request method in an _up_method cookie ' do
        post :create
        expect(response.cookies['_up_method']).to eq('POST')
      end

    end

    describe 'if the request is not a fragment update, but GET' do

      it 'does not set the cookie' do
        get :index
        expect(response.cookies['_up_method']).to be_nil
      end

      it 'deletes an existing cookie' do
        request.cookies['_up_method'] = 'PUT'
        get :index
        expect(response.cookies['_up_method']).to be_nil
      end

    end

    describe 'if the request is non-GET but a fragment update' do

      it 'does not set the cookie' do
        request.headers['X-Up-Target'] = '.target'
        post :create
        expect(response.cookies['_up_method']).to be_nil
      end

      it 'deletes an existing cookie' do
        request.cookies['_up_method'] = 'PUT'
        request.headers['X-Up-Target'] = '.target'
        post :create
        expect(response.cookies['_up_method']).to be_nil
      end

    end

  end

end
