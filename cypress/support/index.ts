import '@cypress/code-coverage/support';
import '@percy/cypress';

import user from 'cypress/fixtures/user.json';

Cypress.Commands.add('getBySel', (selector: string, ...args: any) =>
  cy.get(`[data-cy=${selector}]`, ...args)
);

declare global {
  namespace Cypress {
    interface Chainable {
      login: () => Chainable<undefined>;
      getBySel: (selector: string, args?: any) => Chainable<Element>;
    }
  }
}
