describe BindingTestController do

  describe '#up?' do

    it 'returns true if the request has an X-Up-Target header' do
      request.headers['X-Up-Target'] = 'body'
      get :is_up
      expect(response.body).to eq('true')
    end

    it 'returns false if the request has no X-Up-Target header' do
      get :is_up
      expect(response.body).to eq('false')
    end

  end

  describe '#up' do

    describe '#target' do

      it 'returns the CSS selector that Unpoly requested for a sucessful response' do
        request.headers['X-Up-Target'] = '.foo'
        get :up_target
        expect(response.body).to eq('.foo')
      end

    end

    describe '#fail_target' do

      it 'returns the CSS selector that Unpoly requested for an error response' do
        request.headers['X-Up-Target'] = '.foo'
        request.headers['X-Up-Fail-Target'] = '.bar'
        get :up_fail_target
        expect(response.body).to eq('.bar')
      end

    end

    shared_examples_for 'target query' do |opts|

      let(:header) { opts.fetch(:header) }

      let (:action) { opts.fetch(:action)}

      def set_header(value)
        request.headers[header] = value
        if header != 'X-Up-Target'
          # Make sure that it's considered a fragment update
          request.headers['X-Up-Target'] = '.other-selector'
        end
      end

      it 'returns true if the tested CSS selector is requested via Unpoly' do
        set_header '.foo'
        get action, tested_target: '.foo'
        expect(response.body).to eq('true')
      end

      it 'returns false if Unpoly is requesting another CSS selector' do
        set_header '.bar'
        get action, tested_target: '.foo'
        expect(response.body).to eq('false')
      end

      it 'returns true if the request is not an Unpoly request' do
        get action, tested_target: '.foo'
        expect(response.body).to eq('true')
      end

      it 'returns true if testing a custom selector, and Unpoly requests "body"' do
        set_header 'body'
        get action, tested_target: '.foo'
        expect(response.body).to eq('true')
      end

      it 'returns true if testing a custom selector, and Unpoly requests "html"' do
        set_header 'html'
        get action, tested_target: '.foo'
        expect(response.body).to eq('true')
      end

      it 'returns true if testing "body", and Unpoly requests "html"' do
        set_header 'html'
        get action, tested_target: 'body'
        expect(response.body).to eq('true')
      end

      it 'returns true if testing "head", and Unpoly requests "html"' do
        set_header 'html'
        get action, tested_target: 'head'
        expect(response.body).to eq('true')
      end

      it 'returns false if the tested CSS selector is "head" but Unpoly requests "body"' do
        set_header 'body'
        get action, tested_target: 'head'
        expect(response.body).to eq('false')
      end

      it 'returns false if the tested CSS selector is "title" but Unpoly requests "body"' do
        set_header 'body'
        get action, tested_target: 'title'
        expect(response.body).to eq('false')
      end

      it 'returns false if the tested CSS selector is "meta" but Unpoly requests "body"' do
        set_header 'body'
        get action, tested_target: 'meta'
        expect(response.body).to eq('false')
      end

      it 'returns true if the tested CSS selector is "head", and Unpoly requests "html"' do
        set_header 'html'
        get action, tested_target: 'head'
        expect(response.body).to eq('true')
      end

      it 'returns true if the tested CSS selector is "title", Unpoly requests "html"' do
        set_header 'html'
        get action, tested_target: 'title'
        expect(response.body).to eq('true')
      end

      it 'returns true if the tested CSS selector is "meta", and Unpoly requests "html"' do
        set_header 'html'
        get action, tested_target: 'meta'
        expect(response.body).to eq('true')
      end

    end

    describe '#target?' do
      it_behaves_like 'target query', action: :up_is_target, header: 'X-Up-Target'
    end

    describe '#fail_target?' do
      it_behaves_like 'target query', action: :up_is_fail_target, header: 'X-Up-Fail-Target'
    end

    describe '#any_target?' do

      before :each do
        request.headers['X-Up-Target'] = '.success'
        request.headers['X-Up-Fail-Target'] = '.failure'
      end

      it 'returns true if the tested CSS selector is the target for a successful response' do
        get :up_is_any_target, tested_target: '.success'
        expect(response.body).to eq('true')
      end

      it 'returns true if the tested CSS selector is the target for a failed response' do
        get :up_is_any_target, tested_target: '.failure'
        expect(response.body).to eq('true')
      end

      it 'returns false if the tested CSS selector is a target for neither successful nor failed response' do
        get :up_is_any_target, tested_target: '.other'
        expect(response.body).to eq('false')
      end

    end

    describe '#validate?' do

      it 'returns true the request is an Unpoly validation call' do
        request.headers['X-Up-Validate'] = 'user[email]'
        get :is_up_validate
        expect(response.body).to eq('true')
      end

      it 'returns false if the request is not an Unpoly validation call' do
        get :is_up_validate
        expect(response.body).to eq('false')
      end

    end

    describe '#validate_name' do

      it 'returns the name of the field that is being validated' do
        request.headers['X-Up-Validate'] = 'user[email]'
        get :up_validate_name
        expect(response.body).to eq('user[email]')
      end

    end

    describe '#title=' do

      it 'sets an X-Up-Title header to push a document title to the client' do
        get :set_up_title
        expect(response.headers['X-Up-Title']).to eq('Pushed document title')
      end

    end

  end

  describe 'request method cookie' do

    describe 'if the request is both non-GET and not a fragment update' do

      it 'echoes the request method in an _up_method cookie ' do
        put :text
        expect(response.cookies['_up_method']).to eq('PUT')
      end

    end

    describe 'if the request is not a fragment update, but GET' do

      it 'does not set the cookie' do
        get :text
        expect(response.cookies['_up_method']).to be_nil
      end

      it 'deletes an existing cookie' do
        request.cookies['_up_method'] = 'PUT'
        get :text
        expect(response.cookies['_up_method']).to be_nil
      end

    end

    describe 'if the request is non-GET but a fragment update' do

      it 'does not set the cookie' do
        request.headers['X-Up-Target'] = '.target'
        put :text
        expect(response.cookies['_up_method']).to be_nil
      end

      it 'deletes an existing cookie' do
        request.cookies['_up_method'] = 'PUT'
        request.headers['X-Up-Target'] = '.target'
        put :text
        expect(response.cookies['_up_method']).to be_nil
      end

    end


  end

end
