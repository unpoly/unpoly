class Tests
  class << self

    def drop_all_tables
      connection = ::ActiveRecord::Base.connection
      connection.tables.each do |table|
        connection.drop_table table
      end
    end

    def migrate_test_database
      print "\033[30m" # dark gray text
      drop_all_tables
      ::ActiveRecord::Migrator.migrate("#{Rails.root}/db/migrate")
      print "\033[0m"
    end

    def response_delay
      @response_delay ||= 0
    end

    def response_delay=(seconds)
      @response_delay = seconds
    end

  end
end
