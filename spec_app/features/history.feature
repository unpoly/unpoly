Feature: History with HTML5 pushState

  @javascript
  Scenario: Page transforms leave an intact history that can be navigated forward and backward
    Given there are 2 cards
    When I go to the screen selection
      And I follow "Cards panel"
      And I wait for 0.7 seconds
      And I follow "Card #1"
      And I wait for 0.7 seconds
      And I follow "Card #2"
      And I wait for 0.7 seconds
    When I go back
      And I wait for 0.7 seconds
    Then I should see the card "Card #1"
    When I go back
      And I wait for 0.7 seconds
    Then I should be on the list of cards
    When I go back
      And I wait for 0.7 seconds
    Then I should be on the screen selection
    When I go forward
      And I wait for 0.7 seconds
    Then I should be on the list of cards
    When I go forward
      And I wait for 0.7 seconds
    Then I should see the card "Card #1"
    When I go forward
      And I wait for 0.7 seconds
    Then I should see the card "Card #2"
