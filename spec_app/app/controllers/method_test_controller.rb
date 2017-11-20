class MethodTestController < ApplicationController

  layout false

  skip_before_filter :verify_authenticity_token

  def page1
  end

  def page2
  end

  def form_target
  end

end
