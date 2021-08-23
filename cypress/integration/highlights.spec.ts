import highlights from 'cypress/fixtures/highlights.json';

function showsEmptyState(dark = false): void {
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  cy.visit('/highlights');
  cy.getBySel('highlight-row').should('have.attr', 'data-loading', 'true');
  cy.percySnapshot(`Feed Page Fallback${dark ? ' Dark' : ''}`);
  cy.wait('@get-account');
  cy.wait('@get-highlights');
  cy.getBySel('empty').contains(
    'Nothing to see here... yet. Go highlight something!'
  );
  cy.percySnapshot(`Feed Page Empty${dark ? ' Dark' : ''}`);
}

function showshighlights(dark = false): void {
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  cy.intercept('GET', '/api/highlights', highlights).as('get-highlights');
  cy.visit('/highlights');
  cy.wait('@get-account');
  cy.wait('@get-highlights');
  cy.getBySel('empty').should('not.exist');
  cy.getBySel('highlight-row')
    .should('have.attr', 'data-loading', 'false')
    .and('have.length', highlights.length)
    .as('highlights');
  highlights.forEach((highlight, idx) => {
    cy.get('@highlights')
      .eq(idx)
      .should('have.attr', 'href', `/messages/${highlight.message.id}`)
      .within(() => {
        cy.getBySel('name').should(
          'have.text',
          `${highlight.message.name}: ${highlight.message.subject}`
        );
        cy.get('blockquote').should('have.text', highlight.text);
      });
  });
  cy.percySnapshot(`Feed Page${dark ? ' Dark' : ''}`);
  cy.scrollTo('bottom');
  cy.getBySel('highlight-row')
    .should('have.length', highlights.length + 5)
    .last()
    .should('have.attr', 'data-loading', 'true');
  cy.percySnapshot(`Feed Page Loading${dark ? ' Dark' : ''}`);
}

describe('Highlights', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account', { fixture: 'user' }).as('get-account');
    cy.intercept('GET', '/api/highlights', []).as('get-highlights');
    cy.intercept('GET', '/api/sync', {}).as('get-sync');
  });

  it('shows empty state', () => showsEmptyState(false));

  it('shows highlights', () => showshighlights(false));

  it('shows empty state dark mode', () => showsEmptyState(true));

  it('shows highlights dark mode', () => showshighlights(true));
});
