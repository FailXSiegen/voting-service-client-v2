describe('MainLogin', () => {
    it('visits the app root url', () => {
        cy.visit('/')
        cy.contains('h1', 'digitalwahl.org')
        cy.contains('h2', 'Einfach die Wahl haben')
    })
})
