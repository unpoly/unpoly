class Project < ActiveRecord::Base
  has_many :budgets
  accepts_nested_attributes_for :budgets

  validates :name, presence: true
end
