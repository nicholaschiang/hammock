describe('Index page', () => {
  it('shows screenshot and benefits', () => {
    cy.visit('/');
    cy.percySnapshot('Index Page');
  });

  it('redirects to feed when logged in', () => {
    cy.login();
    cy.visit('/');
    cy.wait('@get-account');
    cy.url().should('include', '/feed');
  });

  it('skips redirect when on /about page', () => {
    cy.login();
    cy.visit('/about');
    cy.wait('@get-account');
    cy.url().should('not.include', '/feed');
    cy.percySnapshot('About Page');
  });
});
