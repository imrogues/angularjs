import _ from 'lodash';

/**
 * @namespace Scope
 * @class Scope
 * @name Scope
 * @description Scopes can be created by applying the `new` operator to the
 *     `Scope` constructor.
 * @type {Class}
 * @since 1.0.0
 * @author rogues {@link https://twitter.com/ro9ues @ro9ues}
 * @example
 * const scope = new Scope();
 */
export default class Scope {
  /**
   * @constructs Scope#constructor
   * @description Create an instance of `Scope`.
   * @function
   * @instance
   *
   * @property {Array} $$watchers - A place to store all the watchers that
   *     have been registered.
   */
  constructor () {
    /**
     * @description The double-dollar prefix `$$` means that this variable
     *     should be considered private to the framework, and should not be
     *     called from application code.
     * type {Array}
     * @readonly
     */
    this.$$watchers = [];
  }

  /**
   * @name Scope#uuid
   * @function
   * @description Function to initialize the `last` attribute to something we
   *     can guarantee to be unique, so that’s different from anything a watch
   *     function might return, including `undefined`.
   */
  uuid () {}

  /**
   * @name Scope#$watch
   * @function
   * @description Register a `listener` callback to be executed whenever the
   *     `watchExpression` changes.
   * @param {(string|function)} watchExpression - The `watchExpression` is called
   *     on every call to `$digest()` and should return the value that will be
   *     watched.
   * @param {function} [listener] - The `listener` is called only when the value from
   *     the current `watchExpression` and the previous call to `watchExpression`
   *     are not equal.
   *
   * @example
   * scope.someValue = 'a';
   * scope.counter = 0;
   *
   * scope.$watch(
   *   scope => scope.someValue,
   *   (newValue, oldValue, scope) => { scope.counter++; }
   * );
   *
   * expect(scope.counter).toBe(0);
   *
   * scope.$digest();
   * expect(scope.counter).toBe(1);
   *
   * scope.someValue = 'b';
   *
   * scope.$digest();
   * expect(scope.counter).toBe(2);
   */
  $watch (watchExpression, listener = () => {}) {
    const watcher = {
      watchExpression,
      listener,
      last: this.uuid,
    };

    this.$$watchers.push(watcher);
  }

  /**
   * @name Scope#$$digestOnce
   * @function
   * @description Runs all the watchers once, and returns a boolean value that
   *     determines whether there any changes or not.
   * @returns {Boolean} Value that determine if a watcher is dirty or not.
   * @readonly
   *
   * @example
   * const dirty = $$digestOnce();
   */
  $$digestOnce () {
    let newValue, oldValue, dirty;

    _.forEach(this.$$watchers, watcher => {
      // $digest has to remember what the last value of each `watch` function
      // was.
      newValue = watcher.watchExpression(this);
      oldValue = watcher.last;

      if (newValue !== oldValue) {
        watcher.last = newValue;
        watcher.listener(newValue,
          (oldValue === this.uuid ? newValue : oldValue),
          this);
        dirty = true;
      }
    });

    return dirty;
  }

  /**
   * @name Scope#$digest
   * @function
   * @description Iterates over all registered watchers and calls their listener
   *     functions on the current `Scope`.
   * @function
   *
   * @example
   * scope.someValue = 'a';
   * scope.counter = 0;
   *
   * scope.$watch(
   *   scope => scope.someValue,
   *   (newValue, oldValue, scope) => { scope.counter++; }
   * );
   *
   * expect(scope.counter).toBe(0);
   *
   * scope.$digest();
   * expect(scope.counter).toBe(1);
   *
   * scope.someValue = 'b';
   *
   * scope.$digest();
   * expect(scope.counter).toBe(2);
   */
  $digest () {
    let dirty;
    let TTL = 10;

    do {
      dirty = this.$$digestOnce();

      if (dirty && !(TTL--)) {
        throw 'ngException: TTL max–iterations has been reached.';
      }
    } while (dirty);
  }
}
