module NavigationHarness

end

Then(/^I should be able to navigate to "(.*?)"$/) do |title|
  click_link title
  expect(page).to have_css('.up-active', text: title, count: 1)
  expect(page).to_not have_css('.up-active', text: title)
  expect(page).to have_css('.up-current', text: title, count: 1)
  expect(page).to have_css('.panel__main', text: title)
  expect(page.title).to eq(title)
end

When /^I go forward$/ do
  page.evaluate_script('window.history.forward()')
end
