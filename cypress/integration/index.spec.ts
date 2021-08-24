describe('About', () => {
  it('shows screenshot and benefits', () => {
    cy.visit('/');
    cy.percySnapshot('Index Page');
  });

  it('redirects to feed when logged in', () => {
    cy.intercept('GET', '/api/account', { fixture: 'user' }).as('get-account');
    cy.visit('/');
    cy.wait('@get-account');
    cy.url().should('include', '/feed');
  });

  it('skips redirect when on about page', () => {
    cy.intercept('GET', '/api/account', { fixture: 'user' }).as('get-account');
    cy.visit('/about');
    cy.wait('@get-account');
    cy.url().should('not.include', '/feed');
    cy.percySnapshot('About Page');
  });

  it('always shows light mode', () => {
    localStorage.setItem('theme', 'dark');
    cy.visit('/');
    cy.get('#__next')
      .children()
      .should('have.class', 'light')
      .and('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.percySnapshot('Index Page Dark');
  });
});
