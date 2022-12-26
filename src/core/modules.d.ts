import { Module } from './module';

export interface PackageModules {
  packageName: string;
  modules: Module[];
}
