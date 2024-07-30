Feature: Wikipedia Link Scraper

  Scenario: Scraping unique links from Wikipedia
    Given a valid Wikipedia link "https://en.wikipedia.org/wiki/QA"
    And a valid integer "3"
    When I scrape the link
    Then I should get up to 10 unique links embedded in the page
    And I should repeat this process for 3 cycles
    Then I should output the results in JSON format
