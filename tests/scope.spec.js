import _      from 'lodash';
import Scope  from 'src/scope';

describe('Scope', () => {
  it('can be constructed and used as an object', () => {
    const scope = new Scope();
    scope.aProperty = 1;

    expect(scope.aProperty).toBe(1);
  });

  describe('$digest', () => {
    let scope;

    beforeEach(() => {
      scope = new Scope();
    });

    it('calls the listener function of a watch on first $digest', () => {
      const watchExpression = () => 'watchExpression';
      const listener        = jasmine.createSpy();

      scope.$watch(watchExpression, listener);
      scope.$digest();

      expect(listener).toHaveBeenCalled();
    });

    it('calls the watch function with the scope as the argument', () => {
      const watchExpression = jasmine.createSpy();
      const listener        = () => {};

      scope.$watch(watchExpression, listener);
      scope.$digest();

      expect(watchExpression).toHaveBeenCalledWith(scope);
    });

    it('calls the listener function when the watched value changes', () => {
      scope.someValue = 'a';
      scope.counter   = 0;

      scope.$watch(
        scope => scope.someValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );

      expect(scope.counter).toBe(0);

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.someValue = 'b';
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('calls listener when watch value is first undefined', () => {
      scope.counter = 0;

      scope.$watch(
        scope => scope.someValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );
      scope.$digest();

      expect(scope.counter).toBe(1);
    });

    it('calls listener with new value as old value the first time', () => {
      let newValueAsOldValue;
      scope.someValue = 123;

      scope.$watch(
        scope => scope.someValue,
        (newValue, oldValue, scope) => {
          newValueAsOldValue = oldValue;
        }
      );

      scope.$digest();
      expect(newValueAsOldValue).toBe(123);
    });

    it('may have watchers that omit the listener function', () => {
      const watchExpression = jasmine.createSpy().and.returnValue('whatever');

      scope.$watch(watchExpression);
      scope.$digest();

      expect(watchExpression).toHaveBeenCalled();
    });

    it('triggers chained watchers in the same $digest', () => {
      scope.name = 'rogues';

      scope.$watch(
        scope => scope.nameUpper,
        (newValue, oldValue, scope) => {
          if (newValue) {
            scope.initial = `${newValue.substring(0, 1)}.`;
          }
        }
      );

      scope.$watch(
        scope => scope.name,
        (newValue, oldValue, scope) => {
          if (newValue) {
            scope.nameUpper = newValue.toUpperCase();
          }
        }
      );

      scope.$digest();
      expect(scope.initial).toBe('R.');

      scope.name = 'genius';

      scope.$digest();
      expect(scope.initial).toBe('G.');
    });

    it('gives up on the watches after 10 iterations', () => {
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$watch(
        scope => scope.counterA,
        (newValue, oldValue, scope) => {
          scope.counterB++;
        }
      );

      scope.$watch(
        scope => scope.counterB,
        (newValue, oldValue, scope) => {
          scope.counterA++;
        }
      );

      expect(() => { scope.$digest(); }).toThrow();
    });

    it('ends the $digest when the last watch is clean', () => {
      let watchExecutions = 0;
      scope.watches = _.range(100);

      _.times(100, i => {
        scope.$watch(
          scope => {
            watchExecutions++;

            return scope.watches[i];
          },
          (newValue, oldValue, scope) => {}
        );
      });

      scope.$digest();
      expect(watchExecutions).toBe(200);

      scope.watches[0] = 'Cuak';

      scope.$digest();
      expect(watchExecutions).toBe(301);
    });

    it('does not end $digest so that new watches are not run', () => {
      scope.aValue  = 'abc';
      scope.counter = 0;

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.$watch(
            scope => scope.aValue,
            (newValue, oldValue, scope) => {
              scope.counter++;
            }
          );
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('compares based on value if enabled', () => {
      scope.aValue  = [1, 2, 3];
      scope.counter = 0;

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        },
        true
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue.push(4);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('correctly handles NaNs', () => {
      scope.number  = 0/0;
      scope.counter = 0;

      scope.$watch(
        scope => scope.number,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('catches exceptions in watch functions and continues', () => {
      scope.aValue  = 'abc';
      scope.counter = 0;

      scope.$watch(
        scope => { throw 'ngError'; },
        (newValue, oldValue, scope) => {}
      );

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('catches exceptions in listener functions and continues', () => {
      scope.aValue  = 'abc';
      scope.counter = 0;

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          throw 'ngError';
        }
      );

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('allows destroying a $watch with a removal function', () => {
      scope.aValue  = 'a';
      scope.counter = 0;

      const unbindWatcher = scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue = 'b';

      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.aValue = 'c';
      unbindWatcher();

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it('allows destroying a $watch during $digest', () => {
      const watchExecutions = [];
      scope.aValue = 'a';

      scope.$watch(
        scope => {
          watchExecutions.push('first');

          return scope.aValue;
        }
      );

      const unbindWatcher = scope.$watch(
        scope => {
          watchExecutions.push('second');
          unbindWatcher();
        }
      );

      scope.$watch(
        scope => {
          watchExecutions.push('third');

          return scope.aValue;
        }
      );

      scope.$digest();
      expect(watchExecutions).toEqual(['first', 'second', 'third', 'first', 'third']);
    });

    it('allows a $watch to destroy another during $digest', () => {
      scope.aValue  = 'a';
      scope.counter = 0;

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          unbindWatcher();
        }
      );

      const unbindWatcher = scope.$watch(
        scope => {},
        (newValue, oldValue, scope) => {}
      );

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('allows destroying several $watches during $digest', () => {
      scope.aValue  = 'a';
      scope.counter = 0;

      const unbindWatcher1 = scope.$watch(
        scope => {
          unbindWatcher1();
          unbindWatcher2();
        }
      );

      const unbindWatcher2 = scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(0);
    });
  });

  describe('$eval', () => {
    let scope;

    beforeEach(() => {
      scope = new Scope();
    });

    it('executes $evaled function and returns result', () => {
      scope.aValue = 42;

      const result = scope.$eval(
        scope => scope.aValue
      );

      expect(result).toBe(42);
    });

    it('passes the second $eval argument straight through', () => {
      scope.aValue = 42;

      const result = scope.$eval(
        (scope, arg) => scope.aValue + arg, 2
      );

      expect(result).toBe(44);
    });
  });

  describe('$apply', () => {
    let scope;

    beforeEach(() => {
      scope = new Scope();
    });

    it('executes the given function and starts the $digest', () => {
      scope.aValue  = 'a';
      scope.counter = 0;

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$apply(scope => {
        scope.aValue = 'b';
      });
      expect(scope.counter).toBe(2);
    });
  });

  describe('$evalAsync', () => {
    let scope;

    beforeEach(() => {
      scope = new Scope();
    });

    it('executes given function later in the same cycle', () => {
      scope.aValue                    = [1, 2, 3];
      scope.asyncEvaluated            = false;
      scope.asyncEvaluatedImmediately = false;

      scope.$watch(
        scope => scope.aValue,
        (newValue, oldValue, scope) => {
          scope.$evalAsync(scope => {
            scope.asyncEvaluated = true;
          });
          scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
        }
      );

      scope.$digest();

      expect(scope.asyncEvaluated).toBe(true);
      expect(scope.asyncEvaluatedImmediately).toBe(false);
    });

    it('executes $evalAsynced functions added by watch functions', () => {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;

      scope.$watch(
        scope => {
          if (!scope.asyncEvaluated) {
            scope.$evalAsync(scope => {
              scope.asyncEvaluated = true;
            });
          }
          return scope.aValue;
        },
        (newValue, oldValue, scope) => {}
      );

      scope.$digest();
      expect(scope.asyncEvaluated).toBe(true);
    });

    it('executes $evalAsync functions even when not dirty', () => {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluatedTimes = 0;

      scope.$watch(
        scope => {
          if (scope.asyncEvaluatedTimes < 2) {
            scope.$evalAsync(scope => {
              scope.asyncEvaluatedTimes++;
            });
          }
          return scope.aValue;
        },
        (newValue, oldValue, scope) => {}
      );

      scope.$digest();
      expect(scope.asyncEvaluatedTimes).toBe(2);
    });
  });
});
