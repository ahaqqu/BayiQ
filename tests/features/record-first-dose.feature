Feature: Record a child's first immunization dose

  Scenario: Continue anonymously, add a child, and record a dose
    Given I open BayiQ
    When I continue anonymously
    Then I see the onboarding screen
    When I add a child named "Aisha" born 5 months ago
    Then I see the schedule for "Aisha"
    When I navigate the schedule to the birth column
    And I click the Hepatitis B birth cell
    And I save the record with date today
    Then the Hepatitis B birth cell shows "done"
    And the notification badge shows 17
    And the sync status shows "Tersinkron"
    And the page has no serious accessibility violations
