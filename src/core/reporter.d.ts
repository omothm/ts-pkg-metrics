import PackageAnalysis from './analysis';

export default interface Reporter {
  report(analyses: PackageAnalysis[]): void;
}
