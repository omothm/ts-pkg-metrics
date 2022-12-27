import { PackageAnalysis, PackageReport, ReportCompiler } from '../core';

export default class DefaultReportCompiler implements ReportCompiler {
  constructor(private safePackages: readonly string[]) {}

  compile(analyses: readonly PackageAnalysis[]): PackageReport[] {
    return analyses.map((r) => {
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
  }
}
