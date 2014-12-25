module NavigationHarness

  def expect_current_page(title)
    patiently do
      expect(page).to have_css('.up-current', text: title, count: 1)
      expect(page).to have_css('.panel__main', text: title)
      expect(page.title).to eq(title)
    end
  end

end

World(NavigationHarness)

Then(/^I should be able to navigate to "(.*?)"$/) do |title|
  click_link title
  expect(page).to have_css('.up-active', text: title, count: 1)
  expect(page).to_not have_css('.up-active', text: title)
  expect_current_page(title)
end

When /^I go forward$/ do
  page.evaluate_script('window.history.forward()')
end

Then(/^I should see the card "(.*?)"$/) do |title|
  expect_current_page(title)
end

