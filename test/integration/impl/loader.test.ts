import path from 'node:path';
import test from 'ava';
import { DirectoryNotFoundError, EmptyProjectError, NoPackagesError } from '../../../src/errors';
import DefaultProjectLoader from '../../../src/impl/loader';
import {
  cleanupTestDirectory,
  createDirectoryRecursively,
  createFile,
  createTestDirectory,
} from '../common/fs';
import config from '../config';

test.beforeEach(() => createTestDirectory());
test.after.always(() => cleanupTestDirectory());

test('should throw if project directory does not exist', async (t) => {
  const loader = new LoaderProxy('nonExistingProject');
  await t.throwsAsync(loader.load(), { instanceOf: DirectoryNotFoundError });
});

test('should throw if project directory is empty', async (t) => {
  const projectName = 'emptyProject';
  const loader = new LoaderProxy(projectName);
  await createDirectoryRecursively(projectName);
  await t.throwsAsync(loader.load(), { instanceOf: EmptyProjectError });
});

test('should throw if project directory contains no folders', async (t) => {
  const projectName = 'testProject';
  const loader = new LoaderProxy(projectName);
  await createFile(`${projectName}/index.ts`);
  await t.throwsAsync(loader.load(), { instanceOf: NoPackagesError });
});

class LoaderProxy {
  private loader = new DefaultProjectLoader(path.join(config.testDirectory, this.projectName));
  constructor(private projectName: string) {}
  load(): Promise<Modules[]> {
    return this.loader.load();
  }
}

interface Modules {
  packageName: string;
  modules: string[];
}
