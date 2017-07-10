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
   * @property {Object} $$lastDirtyWatch - Keep track of the last dirty watch.
   * @property {Array} $$asynQueue - Store the $evalAsync jobs that have been
   *     scheduled.
   * @property {Array} $$applyAsyncQueue - Store the $applyAsync jobs that have
   *     been scheduled.
   * @property {String} $$phase - A string attribute that stores information
   *     about what’s currently going on.
   */
  constructor () {
    /**
     * @description The double-dollar prefix `$$` means that this variable
     *     should be considered private to the framework, and should not be
     *     called from application code.
     * @readonly
     */
    this.$$watchers         = [];
    this.$$lastDirtyWatch   = null;
    this.$$asyncQueue       = [];
    this.$$applyAsyncQueue  = [];
    this.$$phase            = null;
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
   * @name Scope#isNumber
   * @function
   * @description Determines if a reference is a `Number`. This includes the
   *     **special** numbers `NaN`.
   *
   * @param {(Number)} newValue - Number to compare.
   * @param {(Number)} oldValue - Number to compare.
   *
   * @returns {Boolean} True if numbers are NaN.
   */
  isNumber (newValue, oldValue) {
    return (typeof newValue === 'number' && typeof oldValue === 'number' &&
      isNaN(newValue) && isNaN(oldValue));
  }

  /**
   * @name Scope#$$areEqual
   * @function
   * @description Determines if two objects or two values are equivalent. Two
   *     objects or values are considered equivalent if at least one of the
   *     following is true:
   *
   * * Both objects or values pass `===` comparision.
   * * Both objects or values are of the same type and all of their properties
   *   are equal.
   *
   * @param {(Object|Array)} newValue - Object or value to compare.
   * @param {(Object|Array)} oldValue - Object or value to compare.
   * @param {Boolean} equality - Boolean flag to compare values in a deep way.
   *
   * @returns {Boolean} True if arguments are equal.
   */
  $$areEqual (newValue, oldValue, equality) {
    if (equality)
      return _.isEqual(newValue, oldValue);

    return (newValue === oldValue) || this.isNumber(newValue, oldValue);
  }

  /**
   * @name Scope#$watch
   * @function
   * @description Register a `listener` callback to be executed whenever the
   *     `watchExpression` changes.
   * @param {(string|function)} watchExpression - The `watchExpression` is
   *     called on every call to `$digest()` and should return the value that
   *     will be watched.
   * @param {function} [listener=function] - The `listener` is called only when the value
   *     from the current `watchExpression` and the previous call to
   *     `watchExpression` are not equal.
   * @param {Boolean} [equality=false] - Compare for object equality using
   *     {@link Scope#$$areEqual areEqual} instead of comparing for reference equality.
   *
   * @returns {function} Returns a deregistration function for this listener.
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
  $watch (watchExpression, listener = () => {}, equality = false) {
    const watcher = {
      watchExpression,
      listener,
      equality,
      last: this.uuid,
    };

    this.$$watchers.unshift(watcher);

    this.$$lastDirtyWatch = null;

    // @name Scope#deregisterWatch
    // @function
    // @description Removes `watch` from the `$$watchers` array.
    return () => {
      const index = this.$$watchers.indexOf(watcher);

      if (index >= 0) {
        this.$$watchers.splice(index, 1);
        this.$$lastDirtyWatch = null;
      }
    };
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

    _.forEachRight(this.$$watchers, watcher => {
      try {
        if (watcher) {
          // $digest has to remember what the last value of each `watch` function
          // was.
          newValue = watcher.watchExpression(this);
          oldValue = watcher.last;

          if (!this.$$areEqual(newValue, oldValue, watcher.equality)) {
            this.$$lastDirtyWatch = watcher;
            watcher.last = (watcher.equality ? _.cloneDeep(newValue) : newValue);
            watcher.listener(newValue,
              (oldValue === this.uuid ? newValue : oldValue),
              this);
            dirty = true;
          } else if (this.$$lastDirtyWatch === watcher) {
            return false;
          }
        }
      } catch (e) {
        console.error(e);
      }
    });

    return dirty;
  }

  /**
   * @name Scope#$digest
   * @function
   * @description Iterates over all registered watchers and calls their listener
   *     functions on the current `Scope`.
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

    this.$$lastDirtyWatch = null;
    this.$beginPhase('$digest');

    do {
      while (this.$$asyncQueue.length) {
        const asyncTask = this.$$asyncQueue.shift();

        asyncTask.scope.$eval(asyncTask.expression);
      }

      dirty = this.$$digestOnce();

      if ((dirty || this.$$asyncQueue.length) && !(TTL--)) {
        this.$clearPhase();
        throw 'ngException: TTL max–iterations has been reached.';
      }
    } while (dirty || this.$$asyncQueue.length);

    this.$clearPhase();
  }

  /**
   * @name Scope#$eval
   * @kind function
   * @function
   *
   * @description
   * Executes the `expression` on the current scope and returns the result. This
   * is useful when evaluating AngularJS expressions.
   *
   * @example
   * const scope = new Scope();
   * scope.a = 1;
   * scope.b = 2;
   *
   * expect(scope.$eval('a+b')).toEqual(3);
   * expect(scope.$eval(scope => scope.a + scope.b)).toEqual(3);
   *
   * @param {(string|function())=} expression An AngularJS expression to be
   *     executed.
   *
   *     - `function(scope)`: execute the function with current `scope` param.
   *
   * @param {(object)=} locals Local variables object, useful for overriding
   *     values in scope.
   *
   * @returns {*} The result of evaluating the expression.
   */
  $eval (expression, locals) {
    return expression(this, locals);
  }

  /**
   * @name Scope#$evalAsync
   * @kind function
   * @function
   *
   * @description
   * Executes the expression on the current scope at a later point in time.
   *
   * The `$evalAsync` makes no guarantees as to when the `expression` will be
   * executed, only that:
   *
   *    - it will execute after the function that scheduled the evaluation.
   *    - at least one {@link Scope#$digest $digest cycle} will be performed
   *       after `expression` execution.
   *
   * __Note:__ Hi.
   *
   * @param {(string|function())=} expression An AngularJS expression ready to
   *     be executed.
   *
   *     - `function(scope)`: execute the function with current `scope` param.
   */
  $evalAsync (expression) {
    if (!this.$$phase && !this.$$asyncQueue.length) {
      setTimeout(() => {
        if (this.$$asyncQueue.length) {
          this.$digest();
        }
      }, 0);
    }
    this.$$asyncQueue.push({ scope: this, expression });
  }

  /**
   * @name Scope#$apply
   * @kind function
   * @function
   *
   * @description
   * `$apply()` is used to execute an expression in AngularJS from outside of
   * the AngularJS framework. (For example browser DOM events, setTimeout, XHR
   * or third party libraries).
   * Because we are calling into the AngularJS framework we need to perform
   * proper scope life cycle, {@link Scope#$digest executing watches}.
   *
   * Scope’s `apply()` method transitions through the following stages:
   *
   *    - The **expression** is executed using the {@link Scope#$eval $eval()}
   *      method.
   *    - The {@link Scope#$watch watch} listeners are fired immediately after the
   *      expression was executed using the {@link Scope#$digest $digest()}
   *      method.
   *
   * @example <caption><h6>Pseudo-Code of `apply()`</h6></caption>
   * function $apply(expr) {
   *   try {
   *     return $eval(expr);
   *   } finally {
   *     $digest();
   *   }
   * }
   *
   *
   * @param {(string|function())=} expression An AngularJS expression to be
   *     executed.
   *
   *     - `function(scope)`: execute the function with current `scope` param.
   *
   * @returns {*} The result of evaluating the expression.
   */
  $apply (expression) {
    try {
      this.$beginPhase('$apply');
      return this.$eval(expression);
    } finally {
      this.$clearPhase();
      this.$digest();
    }
  }

  $applyAsync (expression) {
    this.$$applyAsyncQueue.push(() => {
      this.$eval(expression);
    });

    setTimeout(() => {
      this.$apply(() => {
        while(this.$$applyAsyncQueue.length) {
          this.$$applyAsyncQueue.shift()();
        }
      });
    }, 0);
  }

  /**
   * @name Scope#$beginPhase
   * @kind function
   * @function
   *
   * @description
   * A function that is controlling the phase: Setting it.
   *
   * @param {string} - The current phase in digest cycle.
   */
  $beginPhase (phase) {
    if (this.$$phase) {
      throw `${this.$$phase} already in progress.`;
    }

    this.$$phase = phase;
  }

  /**
   * @name Scope#$clearPhase
   * @kind function
   * @function
   *
   * @description
   * A function that clear `$$phase` field.
   */
  $clearPhase () {
    this.$$phase = null;
  }
}
