import sayHello from '../src/index';

describe('sayHello function', () => {
  it('returns a salute', () => {
    expect(sayHello('ro9ues')).toBe('Hello ro9ues!');
  });
});
