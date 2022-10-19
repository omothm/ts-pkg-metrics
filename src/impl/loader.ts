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
    const packages = directories.filter((d) => d.isDirectory());
    if (!packages.length) {
      throw new NoPackagesError();
    }
    return Promise.all(
      packages.map(async (p) => {
        const modules = await this.loadModules(p.name);
        return { packageName: p.name, modules };
      }),
    );
  }

  private async loadModules(packageName: string) {
    const files = await this.getDeepFiles(packageName);
    return Promise.all(
      files.map(async (f) => {
        const buffer = await fs.readFile(`${this.projectDirectory}/${f}`);
        return buffer.toString();
      }),
    );
  }

  private async getDeepFiles(parentDir: string): Promise<string[]> {
    const entries = await fs.readdir(`${this.projectDirectory}/${parentDir}`, {
      withFileTypes: true,
    });
    const deepFiles = await Promise.all(
      entries.map(async (e) => {
        if (e.isDirectory()) {
          return this.getDeepFiles(`${parentDir}/${e.name}`);
        }
        return [`${parentDir}/${e.name}`];
      }),
    );
    return deepFiles.flat();
  }
}
