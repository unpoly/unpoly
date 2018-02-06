module FormTest
  class RedirectsController < ApplicationController

    layout 'integration_test'

    def new
    end

    def create
      redirect_to target_form_test_redirect_path
    end

    def target
    end

  end
end
