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
  });
});
