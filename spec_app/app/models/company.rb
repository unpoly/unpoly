class Company < ActiveRecord::Base
  has_many :projects, dependent: :restrict_with_error

  validates :name, presence: true
end
