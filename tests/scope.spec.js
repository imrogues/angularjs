import Scope from 'src/scope';

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
  });
});
