import { PackageAnalysis, ProjectReport } from '.';

export interface ReportCompiler {
  compile(analyses: readonly PackageAnalysis[]): ProjectReport;
}
