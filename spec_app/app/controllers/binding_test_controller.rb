class BindingTestController < ActionController::Base

  def is_up
    render :text => up?.to_s
  end

  def up_target
    render :text => up.target
  end

  def up_fail_target
    render :text => up.fail_target
  end

  def up_is_target
    render :text => up.target?(tested_target).to_s
  end

  def up_is_fail_target
    render :text => up.fail_target?(tested_target).to_s
  end

  def up_is_any_target
    render :text => up.any_target?(tested_target).to_s
  end

  def is_up_validate
    render :text => up.validate?.to_s
  end

  def up_validate_name
    render :text => up.validate_name
  end

  def set_up_title
    up.title = 'Pushed document title'
    render :text => 'text'
  end

  def text
    render :text => 'text from controller'
  end

  private

  def tested_target
    tested_target = params[:tested_target].presence
    tested_target or raise "No target given"
  end

end
