class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  before_action :print_authenticity_token

  private

  def print_authenticity_token
    Rails.logger.info "*** Real token is #{send(:real_csrf_token, session)}"
  end

end
