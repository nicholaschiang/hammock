import messages from 'cypress/fixtures/messages.json';

function showsEmptyState(dark = false): void {
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  cy.visit('/feed');
  cy.getBySel('message-row').should('have.attr', 'data-loading', 'true');
  cy.percySnapshot(`Feed Page Fallback${dark ? ' Dark' : ''}`);
  cy.wait('@get-account');
  cy.wait('@get-messages');
  cy.getBySel('empty').contains('You’re all caught up with your reading!');
  cy.percySnapshot(`Feed Page Empty${dark ? ' Dark' : ''}`);
}

function showsMessages(dark = false): void {
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  cy.intercept('GET', '/api/messages', messages).as('get-messages');
  cy.visit('/feed');
  cy.wait('@get-account');
  cy.wait('@get-messages');
  cy.getBySel('empty').should('not.exist');
  cy.getBySel('message-row')
    .should('have.length', messages.length)
    .as('messages');
  messages.forEach((message, idx) => {
    cy.get('@messages')
      .eq(idx)
      .should('have.attr', 'href', `/messages/${message.id}`)
      .within(() => {
        cy.getBySel('name').should('have.text', message.name);
        cy.getBySel('subject').should('have.text', message.subject);
        cy.getBySel('time').should('have.text', `${message.time} min`);
        cy.getBySel('snippet').should('have.text', message.snippet);
      });
  });
  cy.percySnapshot(`Feed Page${dark ? ' Dark' : ''}`);
  cy.scrollTo('bottom');
  cy.getBySel('message-row')
    .should('have.length', messages.length + 3)
    .last()
    .should('have.attr', 'data-loading', 'true');
  cy.percySnapshot(`Feed Page Loading${dark ? ' Dark' : ''}`);
}

describe('Feed', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account', { fixture: 'user' }).as('get-account');
    cy.intercept('GET', '/api/messages', []).as('get-messages');
    cy.intercept('GET', '/api/sync', {}).as('get-sync');
  });

  it('shows empty state', () => showsEmptyState(false));

  it('shows messages', () => showsMessages(false));

  it('shows empty state dark mode', () => showsEmptyState(true));

  it('shows messages dark mode', () => showsMessages(true));
});
