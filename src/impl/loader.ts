import { PackageModules, ProjectLoader } from '../core/loader';

export default class DefaultProjectLoader implements ProjectLoader {
  constructor(private projectDirectory: string) {}

  load(): Promise<PackageModules[]> {
    throw new Error('Method not implemented.');
  }
}
