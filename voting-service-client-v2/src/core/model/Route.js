export class Route {
  /**
   * @param {String} path
   * @param {String|null} name Use constants to define the route name for better code completion.
   * @param {Object|null} component
   * @param {String|null} redirect
   * @param {Object|null} meta @see meta.bootstrapIcon is used in navigations https://icons.getbootstrap.com/#icons
   * @param {Object|Boolean|null} props
   * @param {Route[]|null} children
   * @param {Function|null} beforeEnter
   */
  constructor(
    path,
    name,
    component,
    meta = null,
    redirect = null,
    props = null,
    children = null,
    beforeEnter = null,
  ) {
    this.path = path;
    this.name = name;
    this.component = component;
    this.redirect = redirect;
    this.meta = meta;
    this.props = props;
    this.children = children;
    this.beforeEnter = beforeEnter;
  }
}
