module FormTest
  class UploadsController < ApplicationController

    layout 'integration_test'

    def new

    end

    def create
      render 'form_test/submission_result'
    end

  end
end