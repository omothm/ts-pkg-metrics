import { PackageReport } from '.';

export interface ProjectReport {
  packages: PackageReport[];
  metrics: {
    cohesion: MetricReport;
    distance: MetricReport;
  };
}

export interface MetricReport {
  threshold: number;
  average: number;
  offendingPackageRatio: number;
}
