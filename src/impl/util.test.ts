import test from 'ava';
import { stripPrefix } from './util';

test('stripPrefix: should return empty string on empty string input', (t) => {
  t.is(stripPrefix('', ''), '');
  t.is(stripPrefix('', 'abc'), '');
});

test('stripPrefix: should return same string if prefix not found', (t) => {
  t.is(stripPrefix('world', ''), 'world');
  t.is(stripPrefix('world', 'hello '), 'world');
});

test('stripPrefix: should return stripped string if prefix found', (t) => {
  t.is(stripPrefix('hello world', 'hello '), 'world');
});
