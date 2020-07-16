module FormTest
  class UploadsController < ApplicationController

    def new

    end

    def create
      render 'form_test/submission_result'
    end

  end
end