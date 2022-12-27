import { PackageReport } from '.';

export interface Reporter {
  report(reports: readonly PackageReport[]): number;
}
