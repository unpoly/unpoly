describe TestController do

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

    describe '#selector' do

      it 'returns the CSS selector that is requested via Up.js' do
        request.headers['X-Up-Target'] = '.foo'
        get :up_target
        expect(response.body).to eq('.foo')
      end

    end

    describe '#validate?' do

      it 'returns true the request is an Up.js validation call' do
        request.headers['X-Up-Validate'] = 'user[email]'
        get :is_up_validate
        expect(response.body).to eq('true')
      end

      it 'returns false if the request is not an Up.js validation call' do
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


  # describe '#test' do
  #
  #   it 'does stuff' do
  #     get :test
  #     expect(response.body).to eq('foo')
  #   end
  #
  # end

end
