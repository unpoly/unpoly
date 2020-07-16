class AddNestedFormTestRecords < ActiveRecord::Migration
  def change
    create_table :projects do |t|
      t.string :name
      t.timestamps
    end

    create_table :budgets do |t|
      t.string :name
      t.integer :amount
      t.integer :project_id
    end
  end
end
