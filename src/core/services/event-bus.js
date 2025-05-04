/**
 * Simple event bus for decoupling components
 * Allows pub/sub pattern between different components
 * for improved asynchronous messaging
 */
class EventBus {
  constructor() {
    this.handlers = {};
    this.instanceId = Symbol('event-bus-instance');
  }
  
  /**
   * Register a handler for an event
   * @param {string} event - Event name to listen for
   * @param {Function} handler - Callback function to execute 
   * @returns {EventBus} - Returns this for chaining
   */
  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
    return this;
  }
  
  /**
   * Remove a handler for an event
   * @param {string} event - Event name
   * @param {Function} handler - Handler to remove
   * @returns {EventBus} - Returns this for chaining
   */
  off(event, handler) {
    if (this.handlers[event]) {
      if (handler) {
        this.handlers[event] = this.handlers[event].filter(h => h !== handler);
      } else {
        delete this.handlers[event];
      }
    }
    return this;
  }
  
  /**
   * Emit an event with data
   * @param {string} event - Event name to emit
   * @param {any} data - Data to pass to handlers
   * @returns {EventBus} - Returns this for chaining
   */
  emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => {
        // Make async to avoid blocking
        setTimeout(() => handler(data), 0);
      });
    }
    return this;
  }
  
  /**
   * Reset all handlers
   */
  reset() {
    this.handlers = {};
    return this;
  }
}

// Create a singleton instance
const eventBus = new EventBus();

export default eventBus;