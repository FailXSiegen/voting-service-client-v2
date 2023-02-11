export class Route {
    /**
     * @param {String} path
     * @param {String} name Use constants to define the route name for better code completion.
     * @param {Object} component
     * @param {String} bootstrapIcon @see https://icons.getbootstrap.com/#icons
     */
    constructor(path, name, component, bootstrapIcon) {
        this.path = path;
        this.name = name;
        this.component = component;
        this.meta = {
            bootstrapIcon
        };
    }
}