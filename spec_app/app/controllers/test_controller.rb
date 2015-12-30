class TestController < ActionController::Base

  def is_up
    render :text => up?.to_s
  end

  def up_selector
    render :text => up.selector
  end

  def is_up_validate
    render :text => up.validate?.to_s
  end

  def up_validate_name
    render :text => up.validate_name
  end

  def text
    render :text => 'text from controller'
  end

end
