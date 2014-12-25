Given(/^there are (\d+) cards$/) do |count|
  1.upto(count.to_i).each do |i|
    Card.create!(title: "Card ##{i}", body: "Body for card ##{i}")
  end
end
