import { ProjectReport, Reporter } from '../core';

export default class PlainReporter implements Reporter {
  report(report: ProjectReport): number {
    const mappedReports = Object.fromEntries(
      report.packages.map((r) => {
        const relationalCohesion = (r.internalRelationships + 1) / r.numClasses;
        const instability = r.efferentCouplings / (r.efferentCouplings + r.afferentCouplings);
        const normalDistance = Math.abs(r.abstractness + instability - 1);
        return [
          r.packageName,
          {
            N: r.numClasses,
            R: r.internalRelationships,
            H: Number(relationalCohesion.toFixed(2)),
            A: Number(r.abstractness.toFixed(2)),
            Ca: r.afferentCouplings,
            Ce: r.efferentCouplings,
            I: Number(instability.toFixed(2)),
            D: Number(normalDistance.toFixed(2)),
          },
        ];
      }),
    );
    console.table(mappedReports);
    return 0;
  }
}
