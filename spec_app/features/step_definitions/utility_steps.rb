Given(/^the server reacts slowly$/) do
  Tests.response_delay = 1.0
end

After do
  Tests.response_delay = 0.0
end
