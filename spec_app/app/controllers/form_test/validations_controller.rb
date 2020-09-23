module FormTest
  class ValidationsController < ApplicationController

    def new
    end

    def create
      if up.validate?
        render 'new'
      else
        render 'form_test/submission_result'
      end
    end

    private

    helper_method def invalid_email?
      email = params[:email]
      email && email !~ /\A.+\@.+\..+\z/
    end

  end
end
