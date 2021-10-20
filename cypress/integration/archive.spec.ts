import messages from 'cypress/fixtures/messages.json';

function showsEmptyState(dark = false): void {
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  cy.visit('/archive');
  cy.get('html').should('have.class', dark ? 'dark' : 'light');
  cy.getBySel('message-row').should('have.attr', 'data-loading', 'true');
  cy.percySnapshot(`Archive Page Fallback${dark ? ' Dark' : ''}`);
  cy.wait('@get-account');
  cy.wait('@get-archive');
  cy.getBySel('empty').contains('You’re all caught up with your reading!');
  cy.percySnapshot(`Archive Page Empty${dark ? ' Dark' : ''}`);
}

function showsMessages(dark = false): void {
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  const archive = messages.map((m) => ({ ...m, archived: true }));
  cy.intercept('GET', '/api/messages?archive=true', archive).as('get-archive');
  cy.visit('/archive');
  cy.wait('@get-account');
  cy.wait('@get-archive');
  cy.getBySel('empty').should('not.exist');
  cy.getBySel('message-row')
    .should('have.attr', 'data-loading', 'false')
    .and('have.length', archive.length)
    .as('messages');
  archive.forEach((message, idx) => {
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
  cy.getBySel('greeting').should('not.have.class', 'loading');
  cy.percySnapshot(`Archive Page${dark ? ' Dark' : ''}`);
  cy.scrollTo('bottom');
  cy.getBySel('message-row')
    .should('have.length', archive.length + 3)
    .last()
    .should('have.attr', 'data-loading', 'true');
  cy.percySnapshot(`Archive Page Loading${dark ? ' Dark' : ''}`);
}

describe('Archive', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account', { fixture: 'user' }).as('get-account');
    cy.intercept('GET', '/api/messages?archive=true', []).as('get-archive');
  });

  it('shows empty state', () => showsEmptyState(false));

  it('shows messages', () => showsMessages(false));

  it('shows empty state dark mode', () => showsEmptyState(true));

  it('shows messages dark mode', () => showsMessages(true));
});
