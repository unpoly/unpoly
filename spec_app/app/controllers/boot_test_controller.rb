class BootTestController < ApplicationController
  include ActionView::Helpers::AssetTagHelper

  skip_before_action :verify_authenticity_token, only: :user_script

  layout 'integration_test'

  def user_script
    if (delay = params[:delay])
      sleep delay.to_f
    end

    render body: <<~JS, content_type: 'text/javascript'
      console.log("hello from user script")
      up.compiler('body', function(body) {
        body.style.background = 'red'
      })
    JS
  end

  private

  helper_method def include_user_script(options = {})
    path = '/boot_test/user_script.js'
    if (delay = options.delete(:delay))
      path << "?delay=#{delay}"
    end
    javascript_include_tag(path, options)
  end

end
