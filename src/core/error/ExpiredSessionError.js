const type = "ExpiredSessionError";

export class ExpiredSessionError extends Error {
    constructor(message) {
        super(message);
        this.type = type;
    }
    
    static get type() {
        return type;
    }
}