describe('About', () => {
  it('shows screenshot and benefits', () => {
    cy.visit('/about');
    cy.percySnapshot('About Page');
  });

  it('always shows light mode', () => {
    localStorage.setItem('theme', 'dark');
    cy.visit('/about');
    cy.get('#__next')
      .children()
      .should('have.class', 'light')
      .and('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.percySnapshot('About Page Dark');
  });
});
