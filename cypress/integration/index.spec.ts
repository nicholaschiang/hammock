import messages from 'cypress/fixtures/messages.json';
import user from 'cypress/fixtures/user.json';

function showsEmptyState(dark = false): void {
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  cy.visit('/');
  cy.get('html').should('have.class', dark ? 'dark' : 'light');
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
  cy.visit('/');
  cy.wait('@get-account');
  cy.wait('@get-messages');
  cy.getBySel('empty').should('not.exist');
  cy.getBySel('message-row')
    .should('have.attr', 'data-loading', 'false')
    .and('have.length', messages.length)
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
  cy.getBySel('greeting').should('not.have.class', 'loading');
  cy.percySnapshot(`Feed Page${dark ? ' Dark' : ''}`);
  cy.scrollTo('bottom');
  cy.getBySel('message-row')
    .should('have.length', messages.length + 3)
    .last()
    .should('have.attr', 'data-loading', 'true');
  cy.percySnapshot(`Feed Page Loading${dark ? ' Dark' : ''}`);
}

describe('Feed', () => {
  it('redirects to login page', () => {
    cy.intercept('GET', '/api/account').as('get-account');
    cy.visit('/');
    cy.wait('@get-account')
      .its('response')
      .should('have.property', 'statusCode', 401);
    cy.url().should('contain', '/login');
  });

  it('redirects to subscriptions page', () => {
    const account = { ...user, subscriptions: [] };
    cy.intercept('GET', '/api/account', account).as('get-account');
    cy.visit('/');
    cy.wait('@get-account');
    cy.url().should('contain', '/subscriptions');
  });

  describe('Authenticated', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/account', user).as('get-account');
      cy.intercept('GET', '/api/messages', []).as('get-messages');
      cy.intercept('GET', '/api/sync', {}).as('get-sync');
    });

    it('logs out and changes theme', () => {
      cy.visit('/');
      cy.wait('@get-account');
      cy.getBySel('menu').as('menu').should('not.be.visible');
      cy.getBySel('menu-button').as('btn').click();
      cy.get('@menu').should('be.visible');
      cy.percySnapshot('Feed Page Menu');

      // Toggle using button.
      cy.get('@btn').click();
      cy.get('@menu').should('not.be.visible');
      cy.get('@btn').click();
      cy.get('@menu').should('be.visible');

      // Toggle using outside menu.
      cy.get('body').click('topRight');
      cy.get('@menu').should('not.be.visible');
      cy.get('@btn').click();
      cy.get('@menu')
        .should('be.visible')
        .within(() => {
          cy.contains('a', 'Subscriptions').should(
            'have.attr',
            'href',
            '/subscriptions'
          );
          cy.contains('a', 'Archive').should('have.attr', 'href', '/archive');
          cy.contains('a', 'Send feedback').should(
            'have.attr',
            'href',
            'https://form.typeform.com/to/oTBbAI6z'
          );
          cy.contains('a', 'Help').should(
            'have.attr',
            'href',
            'https://readhammock.notion.site/Help-Support-9b6bb1da1d6d4887ad3631f32d7741de'
          );
          cy.contains('a', 'Changelog').should(
            'have.attr',
            'href',
            'https://readhammock.notion.site/Changelog-565a632fc5e3466d85748a78ddeae8f6'
          );
          cy.get('select')
            .should('have.attr', 'aria-label', 'Change color theme')
            .and('have.value', 'system')
            .select('dark');
          cy.percySnapshot('Feed Page Menu Dark');
          cy.contains('button', 'Logout').click();
          cy.url().should('contain', '/login');
          cy.percySnapshot('Login Page Dark');
        });
    });

    it('shows empty state', () => showsEmptyState(false));

    it('shows messages', () => showsMessages(false));

    it('shows empty state dark mode', () => showsEmptyState(true));

    it('shows messages dark mode', () => showsMessages(true));

    it('says good morning', () => {
      const n = new Date();
      const morning = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 6);
      cy.clock(morning.valueOf());
      cy.visit('/');
      cy.tick(1000);
      cy.getBySel('greeting').should('contain', 'Good morning');
    });

    it('says good afternoon', () => {
      const n = new Date();
      const afternoon = new Date(
        n.getFullYear(),
        n.getMonth(),
        n.getDate(),
        12
      );
      cy.clock(afternoon.valueOf());
      cy.visit('/');
      cy.tick(1000);
      cy.getBySel('greeting').should('contain', 'Good afternoon');
    });

    it('says good evening', () => {
      const n = new Date();
      const evening = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 18);
      cy.clock(evening.valueOf());
      cy.visit('/');
      cy.tick(1000);
      cy.getBySel('greeting').should('contain', 'Good evening');
    });
  });
});
