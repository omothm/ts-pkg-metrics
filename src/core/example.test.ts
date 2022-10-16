import test from 'ava';
import exampleFunction from './example';

test('example test', (t) => {
  const answer = 42;

  const result = exampleFunction();

  t.is(result, answer);
});
