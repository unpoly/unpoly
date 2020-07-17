module FlashesHelper

  def render_flashes
    html = ''.html_safe
    flash.map do |type, message|
      html << content_tag(:div, message, class: "#{bootstrap_flash_classes(type)} mb-3", role: 'alert')
    end
    html
  end

  def bootstrap_flash_type(type)
    case type.to_s
    when 'notice'
      'success'
    when 'error'
      'danger'
    else
      'info'
    end
  end

  def bootstrap_flash_classes(type)
    "alert alert-#{bootstrap_flash_type(type)}"
  end

end
