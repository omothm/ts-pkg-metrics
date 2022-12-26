import { PackageModules } from '.';

export interface ProjectLoader {
  load(): Promise<PackageModules[]>;
}
