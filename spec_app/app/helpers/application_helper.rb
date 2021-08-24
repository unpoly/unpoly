module ApplicationHelper

  def script_options(options = nil)
    if options
      @script_options = options
    else
      @script_options || {}
    end
  end

end
