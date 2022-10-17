import test from 'ava';
import { cleanupTestDirectory, createTestDirectory } from '../common/fs';

test.beforeEach(() => createTestDirectory());
test.afterEach(() => cleanupTestDirectory());

test.todo('example integration test');
