import PackageReport from './report';

export default interface Reporter {
  report(report: PackageReport[]): void;
}
