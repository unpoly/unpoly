ActiveRecord::Base.class_eval do

  def self.find_by_anything(identifier)
    matchable_columns = columns.reject { |column| [:binary, :boolean].include?(column.type) }
    query_clauses = matchable_columns.collect do |column|
      qualified_column_name = "#{table_name}.#{column.name}"
      column_as_string = "CAST(#{qualified_column_name} AS CHAR)"
      "#{column_as_string} = ?"
    end
    bindings = [identifier] * query_clauses.size
    find(:first, :conditions => [query_clauses.join(' OR '), *bindings])
  end
  
  def self.find_by_anything!(identifier)
    find_by_anything(identifier) or raise ActiveRecord::RecordNotFound, "No column equals \"#{identifier}\""
  end

end

