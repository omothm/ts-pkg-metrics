import { PackageReport, ProjectAnalyzer, ProjectLoader, ReportCompiler } from '../core';

export default class MetricsFacade {
  constructor(
    private loader: ProjectLoader,
    private analyzer: ProjectAnalyzer,
    private reportCompiler: ReportCompiler,
  ) {}

  async analyze(): Promise<PackageReport[]> {
    const modules = await this.loader.load();
    const analysis = this.analyzer.analyze(modules);
    const report = this.reportCompiler.compile(analysis);
    return report;
  }
}
