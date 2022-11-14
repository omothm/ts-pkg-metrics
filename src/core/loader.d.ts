export interface ProjectLoader {
  load(): Promise<PackageModules[]>;
}

interface PackageModules {
  packageName: string;
  packagePath: string;
  modules: string[];
}
