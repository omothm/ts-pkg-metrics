import { PackageAnalysis, PackageReport, ProjectReport, ReportCompiler } from '../core';

export default class DefaultReportCompiler implements ReportCompiler {
  constructor(
    private safePackages: readonly string[],
    private cohesionThreshold: number,
    private distanceThreshold: number,
  ) {}

  compile(analyses: readonly PackageAnalysis[]): ProjectReport {
    const packages = analyses.map((r) => {
      const instability = r.efferentCouplings / (r.efferentCouplings + r.afferentCouplings);
      const safe = this.safePackages.includes(r.packageName) ? 1 : 0;
      return {
        ...r,
        relationalCohesion: (r.internalRelationships + 1) / r.numClasses,
        instability,
        safe,
        normalDistance: r.abstractness + Math.max(instability, safe) - 1,
      };
    });
    return {
      packages,
      metrics: {
        cohesion: {
          threshold: this.cohesionThreshold,
          average: this.averageOfAbsolute(packages, 'relationalCohesion'),
          offendingPackageRatio: this.ratio(
            packages,
            (pkg) => pkg.relationalCohesion < this.cohesionThreshold,
          ),
        },
        distance: {
          threshold: this.distanceThreshold,
          average: this.averageOfAbsolute(packages, 'normalDistance'),
          offendingPackageRatio: this.ratio(
            packages,
            (pkg) => pkg.normalDistance > this.distanceThreshold,
          ),
        },
      },
    };
  }

  private averageOfAbsolute<K extends string, T extends { [key in K]: number }>(
    reports: T[],
    property: K,
  ): number {
    return reports.reduce((acc, cur) => acc + Math.abs(cur[property]), 0) / reports.length;
  }

  private ratio(reports: PackageReport[], offends: (report: PackageReport) => boolean): number {
    return reports.reduce((acc, cur) => acc + (offends(cur) ? 1 : 0), 0) / reports.length;
  }
}
