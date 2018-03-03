module FormTest
  class BasicsController < ApplicationController

    layout 'integration_test'

    def new
    end

    def create
      render 'form_test/submission_result', status: 500
    end

  end
end
