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

test('should detect folders as packages but not files', async (t) => {
  const projectName = 'testProject';
  const loader = new LoaderProxy(projectName);
  await createFile(`${projectName}/index.ts`);
  await createFile(`${projectName}/package1/module1.ts`, "console.log('module1');");
  await createFile(`${projectName}/package2/subdirectory/module2.ts`, "console.log('module2');");
  await createFile(`${projectName}/package2/module3.ts`, "console.log('module3');");
  const packages = await loader.load();
  t.is(packages.length, 2);
  t.is(packages.find((p) => p.packageName === 'package1')?.modules.length, 1);
  t.truthy(
    packages
      .find((p) => p.packageName === 'package1')
      ?.modules.find((m) => m.content === "console.log('module1');"),
  );
  t.is(packages.find((p) => p.packageName === 'package2')?.modules.length, 2);
  t.truthy(
    packages
      .find((p) => p.packageName === 'package2')
      ?.modules.find((m) => m.content === "console.log('module2');"),
  );
  t.truthy(
    packages
      .find((p) => p.packageName === 'package2')
      ?.modules.find((m) => m.content === "console.log('module3');"),
  );
});

class LoaderProxy {
  private loader = new DefaultProjectLoader(path.join(config.testDirectory, this.projectName));
  constructor(private projectName: string) {}
  load(): Promise<PackageModules[]> {
    return this.loader.load();
  }
}

interface PackageModules {
  packageName: string;
  modules: { path: string; content: string }[];
}
