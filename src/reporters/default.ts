import PackageReport from '../core/report';
import Reporter from '../core/reporter';

export default class DefaultReporter implements Reporter {
  report(reports: PackageReport[]): void {
    const mappedReports = Object.fromEntries(
      reports.map((r) => {
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
  }
}
