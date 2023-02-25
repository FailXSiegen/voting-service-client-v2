export class GraphQLError extends Error {
    constructor(error) {
        super(error.message);
    }
}