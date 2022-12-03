import PackageReport from '../core/report';
import Reporter from '../core/reporter';

export default class DefaultReporter implements Reporter {
  report(report: PackageReport[]): void {
    console.table(report);
  }
}
