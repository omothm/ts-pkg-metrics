import test from 'ava';
import Api from './api';

let api: Api;

test.beforeEach(() => {
  api = new Api();
});

test('example test', (t) => {
  api.exampleApi();
  t.pass();
});
