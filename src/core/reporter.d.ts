import { PackageAnalysis } from '.';

export interface Reporter {
  report(analyses: PackageAnalysis[]): void;
}
