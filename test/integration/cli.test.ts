import { execSync } from 'node:child_process';
import path from 'node:path';
import test from 'ava';
import { cleanupTestDirectory, createFile, createTestDirectory } from './common/fs';
import config from './config';

const cwd = process.cwd();

test.beforeEach(() => createTestDirectory());
test.after.always(() => cleanupTestDirectory());

test('should throw if directory not found', (t) => {
  t.throws(() => runCli('non-existing-directory'));
});

test('should throw if directory is empty', (t) => {
  t.throws(() => runCli());
});

test('should throw if no folders', async (t) => {
  await createFile('some-file.ts', "console.log('hey');");
  t.throws(() => runCli());
});

test('should not throw if folders (packages) exist', async (t) => {
  await createFile('some-file.ts', "console.log('hey');");
  await createFile('dir1/mod1.ts', "console.log('I'm mod 1');");
  await createFile('dir1/mod1.test.ts', "console.log('I'm mod 1 test');");
  await createFile('dir2/mod1.ts', "console.log('I'm mode 2');");
  t.notThrows(() => runCli());
});

function runCli(args?: string) {
  const dir = path.join(config.testDirectory, args ?? '');
  execSync(`npx ts-node ${cwd}/src/cli.ts ${dir}`, { stdio: 'ignore' });
}
