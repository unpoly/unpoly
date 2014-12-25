module PathHelpers

  def path_to(page_name)
    case page_name

    when /^the list of (.*?)$/
      models_prose = $1
      route = "#{model_prose_to_route_segment(models_prose)}_path"
      send(route)

    when /^the (page|form) for the (.*?) above$/
      action_prose, model_prose = $1, $2
      route = "#{action_prose == 'form' ? 'edit_' : ''}#{model_prose_to_route_segment(model_prose)}_path"
      model = model_prose.classify.constantize
      send(route, model.last)

    when /^the (page|form) for the (.*?) "(.*?)"$/
      action_prose, model_prose, identifier = $1, $2, $3
      path_to_show_or_edit(action_prose, model_prose, identifier)

    when /^the (.*?) (page|form) for "(.*?)"$/
      model_prose, action_prose, identifier = $1, $2, $3
      path_to_show_or_edit(action_prose, model_prose, identifier)

    when /^the (.*?) form$/
      model_prose = $1
      route = "new_#{model_prose_to_route_segment(model_prose)}_path"
      send(route)

    when /^the screen selection$/
      root_path

    end

  end

  private

  def path_to_show_or_edit(action_prose, model_prose, identifier)
    model = model_prose.classify.constantize
    route = "#{action_prose == 'form' ? 'edit_' : ''}#{model_prose_to_route_segment(model_prose)}_path"
    send(route, model.find_by_anything!(identifier))
  end

  def model_prose_to_route_segment(model_prose)
    model_prose.gsub(/[\ \/]/, '_')
  end

end

World(PathHelpers)
