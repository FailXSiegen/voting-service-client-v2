describe('Login of organizer succeeds', () => {
  it('Visits the index page', () => {
    cy.visit('/')
  })

  it('Login', () => {
    cy.intercept('POST', '/login', { fixture: 'login/organizer.json', statusCode: 201 }).as('login')

    cy.get('#organizer-form input[name="username"]')
      .type('example')
      .should('have.value', 'example')

    cy.get('#organizer-form input[name="password"]')
      .type('12345678')
      .should('have.value', '12345678')

    cy.get('#organizer-form button.login__button').click()
    cy.wait('@login')
    cy.url().should('include', '/admin')
  })

  it('Check h1', () => {
    cy.get('h1')
      .should('contain', 'Dashboard')
  })
})
