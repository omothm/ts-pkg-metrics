import test from 'ava';
import Api from './api';

let api: Api;

test.beforeEach(() => {
  api = new Api();
});

test('facade acceptance test', async (t) => {
  await api.analyze('example1');

  api.validate('core', 'numClasses', 4);
  api.validate('core', 'abstractness', 1);
  api.validate('core', 'internalRelationships', 0);
  api.validate('core', 'afferentCouplings', 4);
  api.validate('core', 'efferentCouplings', 0);

  api.validate('impl', 'numClasses', 4);
  api.validate('impl', 'abstractness', 0);
  api.validate('impl', 'internalRelationships', 1);
  api.validate('impl', 'afferentCouplings', 0);
  api.validate('impl', 'efferentCouplings', 4);
  t.pass();
});
