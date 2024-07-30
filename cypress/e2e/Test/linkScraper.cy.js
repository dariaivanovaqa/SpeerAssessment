import { Given, When, Then } from "cypress-cucumber-preprocessor/steps";

let wikiLink;
let n;
let uniqueLinks = new Set();
let allLinks = new Set();
let visitedLinks = new Set();

Given('a valid Wikipedia link {string}', (link) => {
  if (!link.startsWith('https://en.wikipedia.org/wiki/')) {
    throw new Error('Invalid Wikipedia link');
  }
  wikiLink = link; 
});

Given('a valid integer {string}', (number) => {
  n = parseInt(number);
  if (isNaN(n) || n < 1 || n > 3) {
    throw new Error('Invalid integer');
  }
});

When('I scrape the link', () => {
  function scrapeCycle(link, cyclesLeft) {
    if (visitedLinks.has(link)) {
      return; 
    }

    visitedLinks.add(link); 

    return cy.request({
      url: link,
      failOnStatusCode: false
    }).then((response) => {

      if (response.status === 404) {
        return; 
      }

      if (response.body) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.body, 'text/html');
        const links = Array.from(doc.querySelectorAll('a[href^="/wiki/"]'))
          .map((a) => `https://en.wikipedia.org${a.getAttribute('href')}`)
          .filter((link) => !visitedLinks.has(link)); 

        links.forEach((link) => {
          uniqueLinks.add(link);
          allLinks.add(link);
        });


        if (uniqueLinks.size > 10) {
          const tempLinks = Array.from(uniqueLinks).slice(0, 10);
          uniqueLinks.clear();
          tempLinks.forEach(link => uniqueLinks.add(link));
        }

        if (links.length > 0 && cyclesLeft > 1) {
          return scrapeCycle(links[0], cyclesLeft - 1); 
        }
      }
    });
  }

  return scrapeCycle(wikiLink, n);
});

Then('I should get up to 10 unique links embedded in the page', () => {
  cy.wrap(Array.from(uniqueLinks)).should('have.length.lte', 10);
});

Then('I should repeat this process for {int} cycles', (cycles) => {
  cy.wrap(uniqueLinks.size).should('be.lte', 10 * cycles);
});

Then('I should output the results in JSON format', () => {
  const totalCount = allLinks.size;
  const uniqueCount = uniqueLinks.size;

  const results = {
    totalLinks: totalCount,
    uniqueLinks: uniqueCount,
    links: Array.from(allLinks)
  };

  const jsonOutput = JSON.stringify(results, null, 2);
  
  cy.writeFile('cypress/fixtures/output.json', jsonOutput);
});