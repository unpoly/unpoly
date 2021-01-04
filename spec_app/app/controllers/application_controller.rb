class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  layout 'integration_test'

  before_filter :log_content_type

  private

  def log_content_type
    Rails.logger.info("*** Got Content-Type: " + request.media_type.inspect)
  end

end
