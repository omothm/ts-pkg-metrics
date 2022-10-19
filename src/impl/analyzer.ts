import ProjectAnalyzer from '../core/analyzer';
import { PackageModules } from '../core/loader';
import PackageReport from '../core/report';
import { NoPackagesError } from '../errors';

export default class DefaultProjectAnalyzer implements ProjectAnalyzer {
  analyze(_project: PackageModules[]): PackageReport[] {
    throw new NoPackagesError();
  }
}
