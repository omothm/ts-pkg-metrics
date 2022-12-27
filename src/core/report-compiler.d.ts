import { PackageAnalysis, PackageReport } from '.';

export interface ReportCompiler {
  compile(analyses: readonly PackageAnalysis[]): PackageReport[];
}
