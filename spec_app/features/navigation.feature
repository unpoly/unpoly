Feature: Navigation bars with [up-navigation]

  @javascript
  Scenario: User clicks through sections in a navigation bar
    Given there are 3 cards
      And the server reacts slowly
    When I go to the list of cards
    Then I should be able to navigate to "Card #1"
      And I should be able to navigate to "Card #2"
