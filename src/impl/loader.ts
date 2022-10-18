import fs from 'node:fs/promises';
import { PackageModules, ProjectLoader } from '../core/loader';
import { DirectoryNotFoundError, EmptyProjectError, NoPackagesError } from '../errors';

export default class DefaultProjectLoader implements ProjectLoader {
  constructor(private projectDirectory: string) {}

  async load(): Promise<PackageModules[]> {
    try {
      await fs.access(this.projectDirectory);
    } catch {
      throw new DirectoryNotFoundError();
    }
    const directories = await fs.readdir(this.projectDirectory, { withFileTypes: true });
    if (!directories.length) {
      throw new EmptyProjectError();
    }
    throw new NoPackagesError();
  }
}
