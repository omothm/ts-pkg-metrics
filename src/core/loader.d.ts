export interface ProjectLoader {
  load(): Promise<PackageModules[]>;
}

export interface Module {
  path: string;
  content: string;
}

export interface PackageModules {
  packageName: string;
  modules: Module[];
}
