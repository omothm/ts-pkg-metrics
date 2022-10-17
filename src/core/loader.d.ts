export interface ProjectLoader {
  load(): Promise<PackageModules[]>;
}

interface PackageModules {
  packageName: string;
  modules: string[];
}
