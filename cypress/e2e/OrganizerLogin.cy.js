describe('OrganizerLogin', () => {

    it('Organzier login works', () => {

        cy.intercept('POST', '/login', {fixture: 'login/organizer.json', statusCode: 201}).as('loginOrganizer');

        cy.visit('/');
        
        cy.get('#organizer-form input[name="username"]')
            .type('username')
            .should('have.value', 'username');

        cy.get('#organizer-form input[name="password"]')
            .type('secret')
            .should('have.value', 'secret');

        cy.get('#organizer-form button.login__button').click();
        cy.wait('@loginOrganizer');

        cy.on('window:alert', (str) => {
            expect(str).to.equal(`Success`);
        });

    });
});
