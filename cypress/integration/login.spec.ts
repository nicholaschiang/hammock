describe('Login', () => {
  it('shows error message', () => {
    cy.visit('/login?error=Callback');
    cy.getBySel('error')
      .should('be.visible')
      .and('contain', 'Try signing in with a different account');
    cy.percySnapshot('Login Page Error');
    cy.get('button').should('have.length', 1).click().should('be.disabled');
    cy.percySnapshot('Login Page Loading');
  });
});
