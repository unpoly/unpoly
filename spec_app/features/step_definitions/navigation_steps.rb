module NavigationHarness

  # def should_eventually_have_class(element, klass)
  #   patiently { expect(element['class']).to match(/\b#{klass}\b/) }
  # end
  #
  # def should_eventually_not_have_class(element, klass)
  #   patiently { expect(element['class']).to match(/\b#{klass}\b/) }
  # end

end


Then(/^I should be able to navigate to "(.*?)"$/) do |title|
  click_link title
  expect(page).to have_css('.up-active', text: title, count: 1)
  expect(page).to_not have_css('.up-active', text: title)
  expect(page).to have_css('.up-current', text: title, count: 1)
  expect(page).to have_css('.panel__main', text: title)
end

#
#
# And I follow "Card #1"
# Then the "Cards #1" link should be active
# When I wait a litle
# Then the "Cards #1" link should not be active
# But the "Cards #1" link should be current
# And I should see "Card #1" within the main area
# When I follow "Card #1"
# Then the "Cards #1" link should be active
# When I wait a litle
# Then the "Cards #1" link should not be active
# But the "Cards #1" link should be current
# And I should see "Card #1" within the main area
#
