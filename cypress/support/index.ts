import '@cypress/code-coverage/support';
import '@percy/cypress';

Cypress.Commands.add('login', () => {
  cy.intercept('GET', '/api/account', { fixture: 'user' }).as('get-account');
});

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Cypress {
    interface Chainable {
      login: () => Chainable<undefined>;
    }
  }
}
