import ProjectAnalyzer from '../core/analyzer';
import { PackageModules } from '../core/loader';
import report from '../core/report';

export default class DefaultProjectAnalyzer implements ProjectAnalyzer {
  analyze(_project: PackageModules[]): report[] {
    throw new Error('Method not implemented.');
  }
}
