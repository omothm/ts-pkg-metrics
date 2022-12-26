import { PackageAnalysis, ProjectAnalyzer, ProjectLoader } from '../core';

export default class MetricsFacade {
  constructor(private loader: ProjectLoader, private analyzer: ProjectAnalyzer) {}

  async analyze(): Promise<PackageAnalysis[]> {
    const project = await this.loader.load();
    const analysis = this.analyzer.analyze(project);
    return analysis;
  }
}
