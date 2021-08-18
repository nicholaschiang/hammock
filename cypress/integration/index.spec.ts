describe('Index page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shows screenshot and benefits', () => {
    cy.percySnapshot('Index Page');
  });
});
