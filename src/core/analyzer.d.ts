import { PackageModules } from './loader';
import PackageAnalysis from './analysis';

export default interface ProjectAnalyzer {
  analyze(project: readonly PackageModules[]): PackageAnalysis[];
}
