import { PackageAnalysis, PackageModules } from '.';

export interface ProjectAnalyzer {
  analyze(project: readonly PackageModules[]): PackageAnalysis[];
}
