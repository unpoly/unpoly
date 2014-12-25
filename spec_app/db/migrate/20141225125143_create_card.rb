class CreateCard < ActiveRecord::Migration
  def change
    create_table :cards do |t|
      t.string :title
      t.text :body
      t.timestamps
    end
  end
end
