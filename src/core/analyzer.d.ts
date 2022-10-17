import { PackageModules } from './loader';
import PackageReport from './report';

export default interface ProjectAnalyzer {
  analyze(project: PackageModules[]): PackageReport[];
}